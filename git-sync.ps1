param(
    [switch]$NoPause,
    [string]$ProjectDir
)

# ============================================================
#  git-sync.ps1 — подтягиваем свежий код taskboard с GitHub
#
#  Что делает:
#   1. Идёт в папку проекта (по умолчанию — где лежит сам скрипт)
#   2. Проверяет, что это git-репозиторий с remote origin
#   3. Если есть незакоммиченные изменения — сохраняет их в stash
#      (чтобы pull не упал), затем возвращает обратно
#   4. git fetch + git pull --ff-only (origin/master)
#   5. Пишет лог в .git-sync.log
#
#  Запуск:  git-sync.bat            (двойной клик)
#           powershell -File git-sync.ps1 -NoPause   (для планировщика)
#
#  Коды выхода:
#   0 — всё ок (обновлено или уже актуально)
#   1 — нет remote origin
#   2 — не git-репозиторий / stash не удался
#   3 — pull не удался (конфликт / нет сети / разошлись ветки)
# ============================================================

# Git пишет предупреждения в stderr. В PS 5.1 это ошибка для native-команд,
# поэтому глобально понижаем до Continue и разбираем вывод вручную.
$ErrorActionPreference = 'Continue'

# === НАСТРОЙКИ ===
if ($ProjectDir) { $PROJECT_DIR = $ProjectDir } else { $PROJECT_DIR = $PSScriptRoot }   # папка проекта
$ScriptRoot = $PSScriptRoot   # папка скрипта (для соседних файлов)
$SYNC_SCRIPT = Join-Path $ScriptRoot 'git-sync.ps1'
$REMOTE      = 'origin'
$BRANCH      = 'master'
$LOG_FILE    = Join-Path $PROJECT_DIR '.git-sync.log'
# ==================

function Write-Log([string]$msg) {
    $line = "[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $msg
    Write-Host $line
    try { Add-Content -Path $LOG_FILE -Value $line -Encoding UTF8 } catch {}
}

# Запускает git, логирует вывод. Результат — в $global:LastGitCode.
# ВАЖНО: без 'return' — иначе в pipeline уходит ВЕСЬ вывод git.
function Invoke-Git {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$GitArgs)
    $ErrorActionPreference = 'Continue'
    $out = & git @GitArgs 2>&1
    $global:LastGitCode = $LASTEXITCODE
    foreach ($line in @($out)) {
        if ($null -ne $line -and "$line".Trim()) { Write-Log "  $line" }
    }
}

# Возвращает stdout git как строку (без логирования).
function Get-GitOutput {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$GitArgs)
    $ErrorActionPreference = 'Continue'
    $out = & git @GitArgs 2>$null
    if ($null -eq $out) { return '' }
    return (@($out) -join "`n").Trim()
}

$script:Stashed = $false
function Restore-Stash {
    if ($script:Stashed) {
        Write-Log 'Restoring stashed changes...'
        $null = Invoke-Git stash pop
        $script:Stashed = $false
        if ($global:LastGitCode -ne 0) {
            Write-Log 'WARN: stash pop had conflicts. Resolve manually, then: git stash list / git stash drop'
        }
    }
}

function Stop-Sync([int]$code, [string]$msg) {
    Write-Log "ERROR: $msg"
    Restore-Stash
    if (-not $NoPause) { Read-Host 'Press Enter to close' | Out-Null }
    exit $code
}

Write-Log '=== git-sync start ==='

if (-not (Test-Path (Join-Path $PROJECT_DIR '.git'))) {
    Write-Log "ERROR: '.git' not found in $PROJECT_DIR"
    if (-not $NoPause) { Read-Host 'Press Enter to close' | Out-Null }
    exit 2
}
Set-Location $PROJECT_DIR

# --- проверка remote ---
$remotes = Get-GitOutput remote
if (($remotes -split "`n") -notcontains $REMOTE) {
    Write-Log "ERROR: remote '$REMOTE' not configured. Run: git remote add origin <url>"
    if (-not $NoPause) { Read-Host 'Press Enter to close' | Out-Null }
    exit 1
}

# --- текущая ветка ---
$current = Get-GitOutput rev-parse --abbrev-ref HEAD
if ($current -ne $BRANCH) {
    Write-Log "WARN: now on '$current', expected '$BRANCH'. Switching to '$BRANCH'..."
    Invoke-Git checkout $BRANCH
    if ($global:LastGitCode -ne 0) { Stop-Sync 3 "cannot checkout '$BRANCH'" }
}

# --- локальные изменения -> stash ---
$dirty = Get-GitOutput status --porcelain
if ($dirty.Length -gt 0) {
    Write-Log 'Local changes found, stashing...'
    Invoke-Git stash push -u -m "git-sync $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    if ($global:LastGitCode -ne 0) { Stop-Sync 2 'git stash failed' }
    $script:Stashed = $true
}

# --- fetch + pull ---
Write-Log "Fetching $REMOTE ..."
Invoke-Git fetch $REMOTE --prune
if ($global:LastGitCode -ne 0) { Stop-Sync 3 'git fetch failed' }

$before = Get-GitOutput rev-parse HEAD
$target = Get-GitOutput rev-parse "$REMOTE/$BRANCH"

if ($before -eq $target) {
    Write-Log "Already up to date ($($before.Substring(0,7)))."
} else {
    Write-Log "Pulling $REMOTE/$BRANCH ..."
    Invoke-Git pull --ff-only $REMOTE $BRANCH
    if ($global:LastGitCode -ne 0) {
        Stop-Sync 3 'git pull --ff-only failed (branches diverged? use git pull --rebase manually)'
    }
    $after = Get-GitOutput rev-parse HEAD
    Write-Log "Updated: $($before.Substring(0,7)) -> $($after.Substring(0,7))"
    Invoke-Git log --oneline "$before..$after"
}

Restore-Stash

Write-Log '=== git-sync done ==='
if (-not $NoPause) { Read-Host 'Press Enter to close' | Out-Null }
exit 0
