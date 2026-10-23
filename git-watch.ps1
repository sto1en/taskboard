param(
    [string]$ProjectDir,
    [int]$IntervalSec = 60,
    [switch]$Pull,
    [switch]$NoPull,
    [switch]$Once,
    [switch]$NoLock,
    [string]$TracePath = '',
    # После успешного pull — перезапустить эти процессы (например, бота),
    # чтобы он работал на свежем коде. Перезапуск только по факту обновления:
    # -ProcessName python,cmd -ProcessMatch 'app.main'
    [string[]]$ProcessName = @(),
    [string[]]$ProcessMatch = @(),
    [string]$RestartCmd = ''        # чем поднять обратно; по умолчанию та же командная строка
)

# ============================================================
#  git-watch.ps1 — фоновый наблюдатель за GitHub
#
#  Работает постоянно (до остановки) и раз в $IntervalSec секунд делает
#  `git fetch --prune` (трогает только refs/remotes/origin/*), затем
#  проверяет, есть ли в origin/<branch> коммиты, которых нет локально.
#
#  Режимы:
#    без ключей   — только fetch + записи о новых коммитах
#    -Pull        — при новых коммитах обновлять рабочую копию
#                 (fast-forward; если не выходит — через git-sync.ps1 со stash)
#    -NoPull      — явно «только fetch» (перебивает -Pull)
#    -Once        — один цикл и выход (отладка)
#    -TracePath X — пошаговая отладка в файл X
#    -ProcessName @('python','cmd') -ProcessMatch @('app.main')
#                 — после реального обновления перезапустить процессы,
#                   в командной строке которых есть подстрока из -ProcessMatch
#                   (нужно Telegram-боту ai-assistant: он держит код в памяти)
#
#  Повторный запуск невозможен: блокировка .git-watch.lock,
#  снимается автоматически при завершении процесса.
#  Лог: .git-watch.log (ротация в .git-watch.log.old при 5 МБ).
# ============================================================

$ErrorActionPreference = 'Continue'

if ($ProjectDir) { $PROJECT_DIR = $ProjectDir } else { $PROJECT_DIR = $PSScriptRoot }
$ScriptRoot  = $PSScriptRoot                       # где лежат соседние скрипты
$SYNC_SCRIPT = Join-Path $ScriptRoot 'git-sync.ps1'
$LOCK_PATH   = Join-Path $ScriptRoot '.git-watch.lock'
$LOG_FILE    = Join-Path $ScriptRoot '.git-watch.log'
# Файлы самого наблюдателя не должны попасть в stash: при pull git-sync
# делает `git stash push -u`, а .git-watch.lock открыт этим процессом с
# exclusive-доступом — stash падает `Permission denied`, и обновление
# встаёт навсегда. В репозитории их и не должно быть: кладём в
# .git/info/exclude (локально, без коммита).
foreach ($n in @('.git-watch.lock', '.git-watch.log', '.git-watch.log.old', '.git-watch-trace.log', '.git-watch-launcher.log')) {
    try {
        $ex = Join-Path $PROJECT_DIR '.git/info/exclude'
        if ((Test-Path $ex) -and -not (Select-String -Path $ex -SimpleMatch "/$n" -Quiet)) {
            Add-Content -Path $ex -Value "/$n" -Encoding utf8
        }
    } catch {}
}
$MAX_LOG_MB  = 5
$REMOTE      = 'origin'
$BRANCH      = 'master'                            # в taskboard ветка master (main нет)

if ($NoPull) { $Pull = $false }
$env:GIT_TERMINAL_PROMPT = 0                       # не висеть на запросе логина

function Write-Trace([string]$msg) {
    if (-not $TracePath) { return }
    try { Add-Content -Path $TracePath -Value "$(Get-Date -Format 'HH:mm:ss') $msg" -Encoding utf8 } catch {}
}

function Write-Log([string]$msg) {
    $line = "[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $msg
    Write-Host $line
    Write-Trace "LOG $msg"
    try { Add-Content -Path $LOG_FILE -Value $line -Encoding UTF8 } catch {}
}

# Перезапуск долгоживущих процессов после обновления кода.
# Ищем по CommandLine (python -m app.main запускается через cmd в run.cmd,
# поэтому смотрим и cmd.exe: родитель иначе останется висеть без ребёнка).
# Запускаем снова ровно ту же командную строку — без угадывания путей.
function Restart-TrackedProcesses {
    if (-not $ProcessName -or -not $ProcessMatch) { return }

    $filter = ($ProcessName | ForEach-Object { "Name='$_'" }) -join ' or '
    # Мусорные ветки ($PID-скрипт чтения процессов, сам git-watch) отсекаем,
    # чтобы перезапуск не убил наблюдателя и не зациклился сам на себе.
    $all = @(Get-CimInstance Win32_Process -Filter $filter -ErrorAction SilentlyContinue)
    $plan = @()
    foreach ($p in $all) {
        $cl = $p.CommandLine
        if (-not $cl -or $p.ProcessId -eq $PID) { continue }
        if ($cl -like '*Get-CimInstance*' -or $cl -like '*git-watch*' -or $cl -like '*run-git-watch*') { continue }

        $hit = $false
        foreach ($m in $ProcessMatch) { if ($m -and $cl -like "*$m*") { $hit = $true; break } }
        if (-not $hit) { continue }
        $plan += [pscustomobject]@{ Id = $p.ProcessId; Name = $p.Name; Cmd = $cl }
    }

    if ($plan.Count -eq 0) {
        Write-Log 'Restart: no tracked processes running - skip'
        return
    }

    foreach ($p in $plan) {
        Write-Log "Restart: stop $($p.Name) pid=$($p.Id)"
        try { Stop-Process -Id $p.Id -Force -ErrorAction Stop } catch { Write-Log "Restart: stop failed for pid=$($p.Id): $($_.Exception.Message)" }
    }
    Start-Sleep -Seconds 2   # дать освободить БД/сокеты и снять lock

    foreach ($p in $plan) {
        # cmd /c "...": перезапускаем саму командную строку как есть
        $cmdLine = $p.Cmd
        Write-Log "Restart: start -> $cmdLine"
        try {
            if ($p.Name -match '^(cmd|powershell|pwsh)\.exe$') {
                Start-Process -FilePath $p.Name -ArgumentList $cmdLine.Substring($p.Name.Length).Trim() -WindowStyle Minimized | Out-Null
            } else {
                Start-Process -FilePath $cmdLine -WindowStyle Minimized | Out-Null
            }
        } catch {
            Write-Log "Restart: start failed: $($_.Exception.Message)"
        }
    }
}

function Invoke-GitQuiet {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$GitArgs)
    $ErrorActionPreference = 'Continue'
    Write-Trace "git $($GitArgs -join ' ')"
    $null = & git @GitArgs 2>&1
    Write-Trace "  -> exit $LASTEXITCODE"
    return $LASTEXITCODE
}

# --- блокировка от второго экземпляра ---
$lock = $null
if (-not $NoLock) {
    try {
        $lock = [System.IO.File]::Open($LOCK_PATH, 'OpenOrCreate', 'ReadWrite', 'None')
        $lock.SetLength(0)
        $bytes = [Text.Encoding]::UTF8.GetBytes("$PID")
        $lock.Write($bytes, 0, $bytes.Length)
        $lock.Flush()
    } catch {
        Write-Host "git-watch already running for $PROJECT_DIR - exiting." -ForegroundColor Yellow
        exit 0
    }
}

Write-Trace 'lock acquired'

if (-not (Test-Path (Join-Path $PROJECT_DIR '.git'))) {
    Write-Log "ERROR: not a git repository: $PROJECT_DIR"
    if ($lock) { $lock.Close() }
    exit 2
}
Set-Location $PROJECT_DIR

$ref = "$REMOTE/$BRANCH"
Write-Log "=== git-watch start (dir=$PROJECT_DIR, ref=$ref, every ${IntervalSec}s, pull=$Pull, restart=$($ProcessMatch -join ',')) ==="

$lastSeen   = (& git rev-parse --short HEAD 2>$null)
$prevRemote = (& git rev-parse --short $ref 2>$null)
Write-Trace "initial HEAD=$lastSeen ref=$prevRemote"

try {
    do {
        Write-Trace '--- cycle ---'

        # ротация лога
        if (Test-Path $LOG_FILE) {
            $size = (Get-Item $LOG_FILE).Length
            if ($size -gt ($MAX_LOG_MB * 1MB)) { Move-Item -Force $LOG_FILE "$LOG_FILE.old" }
        }

        $fetchCode = Invoke-GitQuiet fetch --prune $REMOTE
        if ($fetchCode -ne 0) {
            Write-Log "fetch failed (exit $fetchCode) - network? retry in ${IntervalSec}s"
        } else {
            $remoteSha = (& git rev-parse --verify --quiet $ref 2>$null)
            if (-not $remoteSha) {
                Write-Log "WARN: ref $ref not found"
            } else {
                $behind = [int](& git rev-list --count "HEAD..$ref" 2>$null)
                $ahead  = [int](& git rev-list --count "$ref..HEAD" 2>$null)
                Write-Trace "behind=$behind ahead=$ahead"

                if ($behind -gt 0) {
                    Write-Log "NEW on GitHub: $behind commit(s) (local $lastSeen -> $ref, ahead $ahead)"
                    & git --no-pager log --oneline "HEAD..$ref" 2>$null | Select-Object -First 10 |
                        ForEach-Object { Write-Log "  + $_" }

                    if ($Pull) {
                        $headBefore = (& git rev-parse HEAD 2>$null)
                        Write-Log 'Updating working copy ...'
                        & git pull --ff-only $REMOTE $BRANCH 2>&1 | Out-Null
                        if ($LASTEXITCODE -eq 0) {
                            Write-Log "Pulled OK, HEAD now $((& git rev-parse --short HEAD 2>$null))"
                        } else {
                            Write-Log "pull failed (exit $LASTEXITCODE) - running git-sync.ps1 (stash -> pull -> stash pop)"
                            if (Test-Path $SYNC_SCRIPT) {
                                & powershell -NoProfile -ExecutionPolicy Bypass -File $SYNC_SCRIPT -NoPause -ProjectDir $PROJECT_DIR
                                Write-Log "git-sync exit=$LASTEXITCODE, HEAD now $((& git rev-parse --short HEAD 2>$null))"
                            } else {
                                Write-Log "WARN: $SYNC_SCRIPT not found; resolve manually (git stash / git pull)"
                            }
                        }

                        # Код на диске сменился — поднимаем процессы на свежем коде.
                        $headAfter = (& git rev-parse HEAD 2>$null)
                        if ($headAfter -and $headAfter -ne $headBefore) {
                            Write-Trace "restart tracked processes (HEAD $headBefore -> $headAfter)"
                            Restart-TrackedProcesses
                        } else {
                            Write-Log 'Restart: HEAD unchanged - skip'
                        }
                    }
                } else {
                    $nowRemote = $remoteSha.Substring(0, 7)
                    if ($nowRemote -ne $prevRemote) {
                        Write-Log "remote moved: $prevRemote -> $nowRemote (local up to date)"
                    }
                }

                $prevRemote = (& git rev-parse --short $ref 2>$null)
                $lastSeen   = (& git rev-parse --short HEAD 2>$null)
            }
        }

        if ($Once) { break }
        Start-Sleep -Seconds $IntervalSec
    } while ($true)
} finally {
    # Всегда снимаем блокировку и отпускаем файлы, даже при Ctrl+C / аварии.
    if ($lock) { try { $lock.Close() } catch {} }
}

Write-Log '=== git-watch stop ==='
exit 0
