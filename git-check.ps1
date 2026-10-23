param(
    [switch]$NoPause,
    [string]$ProjectDir,
    [switch]$Pull,         # -Pull: сравнить и при наличии новых коммитов сделать pull
    [switch]$SkipFetch     # -SkipFetch: сравнить только с уже известным origin/* (без сети)
)

# ============================================================
#  git-check.ps1 — узнать, появились ли новые коммиты в GitHub
#
#  Работает без клонирования и без pull: `git ls-remote` спрашивает
#  у GitHub текущий коммит ветки и сравнивает его с локальным.
#
#  Результат для скриптов/CI: exit 0 — новое есть, exit 1 — новых нет,
#  exit 2 — ошибка сети/репозитория.
#
#  Запуск:
#    powershell -File git-check.ps1            # только проверить
#    powershell -File git-check.ps1 -Pull      # проверить и подтянуть
# ============================================================

$ErrorActionPreference = 'Continue'

if ($ProjectDir) { $PROJECT_DIR = $ProjectDir } else { $PROJECT_DIR = $PSScriptRoot }
$REMOTE = 'origin'
$BRANCH = 'master'          # ветка репозитория (в taskboard это master, не main)
$REF    = "$REMOTE/$BRANCH"

Set-Location $PROJECT_DIR
$env:GIT_TERMINAL_PROMPT = 0   # не висеть на запросе логина

if (-not (Test-Path (Join-Path $PROJECT_DIR '.git'))) {
    Write-Host "ERROR: not a git repository: $PROJECT_DIR" -ForegroundColor Red
    if (-not $NoPause) { Read-Host 'Press Enter to close' | Out-Null }
    exit 2
}

# 1) Узнаём, что на GitHub: fetch обновляет только refs/origin/*, рабочую копию
#    не трогает — поэтому безопасно вызывать как угодно часто.
$fetchNote = 'fetched'
if ($SkipFetch) {
    $fetchNote = 'no fetch'
} else {
    $fetchOut = & git fetch --prune $REMOTE 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: git fetch $REMOTE failed (network?)" -ForegroundColor Red
        $fetchOut | ForEach-Object { Write-Host "  $_" }
        if (-not $NoPause) { Read-Host 'Press Enter to close' | Out-Null }
        exit 2
    }
}

$remoteSha = (& git rev-parse --verify --quiet $REF 2>$null)
if (-not $remoteSha) { $remoteSha = (& git ls-remote --heads $REMOTE $BRANCH 2>$null | ForEach-Object { ($_ -split '\s+')[0] }) }
$remoteSha = "$remoteSha".Trim()
$localSha  = (& git rev-parse HEAD 2>$null).Trim()

if (-not $remoteSha) {
    Write-Host "ERROR: branch $REF not found" -ForegroundColor Red
    if (-not $NoPause) { Read-Host 'Press Enter to close' | Out-Null }
    exit 2
}

$shortRemote = $remoteSha.Substring(0, 7)
$shortLocal  = $localSha.Substring(0, 7)

# 2) Сравниваем и считаем коммиты в обе стороны
$behind = [int](& git rev-list --count "HEAD..$REF" 2>$null)
$ahead  = [int](& git rev-list --count "$REF..HEAD" 2>$null)

if ($behind -eq 0 -and $ahead -eq 0) {
    Write-Host "No changes: local == $REF ($shortLocal) [$fetchNote]" -ForegroundColor Green
    if (-not $NoPause) { Read-Host 'Press Enter to close' | Out-Null }
    exit 1
}

if ($behind -gt 0) {
    Write-Host "NEW on GitHub: $behind commit(s) behind, $ahead ahead (local $shortLocal -> remote $shortRemote) [$fetchNote]" -ForegroundColor Yellow
    & git --no-pager log --oneline "HEAD..$REF" | Select-Object -First 10 | ForEach-Object { Write-Host "   + $_" }
} else {
    Write-Host "Local is AHEAD by $ahead commit(s): remote $shortRemote, local $shortLocal - nothing to pull" -ForegroundColor Yellow
    if (-not $NoPause) { Read-Host 'Press Enter to close' | Out-Null }
    exit 1
}

if (-not $Pull) {
    Write-Host "Run with -Pull to update." -ForegroundColor Cyan
    if (-not $NoPause) { Read-Host 'Press Enter to close' | Out-Null }
    exit 0
}

# 3) Обновляем через тот же механизм, что и git-sync.ps1
$sync = Join-Path $ProjectDir 'git-sync.ps1'
if (-not (Test-Path $sync)) {
    Write-Host "ERROR: git-sync.ps1 not found next to this script" -ForegroundColor Red
    if (-not $NoPause) { Read-Host 'Press Enter to close' | Out-Null }
    exit 2
}
& powershell -NoProfile -ExecutionPolicy Bypass -File $sync -NoPause -ProjectDir $ProjectDir
$syncCode = $LASTEXITCODE
if (-not $NoPause) { Read-Host 'Press Enter to close' | Out-Null }
exit $syncCode
