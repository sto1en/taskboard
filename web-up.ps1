<#
.SYNOPSIS
    Поднимает и держит фронтенд TaskBoard (vite build при необходимости + vite preview :4173).

.DESCRIPTION
    Идемпотентно: если порт уже отвечает — ничего не делает.
    Собирает dist, только если его нет или он старше исходников / vite.config.js.
    В режиме супервизора проверяет порт каждые -IntervalSec секунд и перезапускает preview.
    Логи: .ngrok\web-up.log, .ngrok\vite-preview.log

.PARAMETER Port
    Порт vite preview (по умолчанию 4173).

.PARAMETER Once
    Один цикл: поднять (или проверить) и выйти.

.PARAMETER ForceBuild
    Пересобрать dist даже если он актуален.

.PARAMETER NoPause
    Не ждать Enter (для планировщика).
#>
[CmdletBinding()]
param(
    [int]$Port = 4173,
    [switch]$Once,
    [switch]$ForceBuild,
    [int]$IntervalSec = 30,
    [switch]$NoPause
)

$ErrorActionPreference = 'Stop'
$here       = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendDir = Join-Path $here 'frontend'
$runDir     = Join-Path $here '.ngrok'
New-Item -ItemType Directory -Force -Path $runDir | Out-Null
$logFile  = Join-Path $runDir 'web-up.log'
$viteLog  = Join-Path $runDir 'vite-preview.log'
$lockFile = Join-Path $runDir 'web-up.lock'
$distDir  = Join-Path $frontendDir 'dist'

function Write-Log {
    param([string]$Message, [string]$Level = 'INFO')
    $line = "[{0}] {1,-5} {2}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Level, $Message
    Add-Content -Path $logFile -Value $line -Encoding UTF8
    if (-not $Once) { Write-Host $line }
}

# ---------- единственный экземпляр ----------
if (-not $Once) {
    try {
        $fs = [System.IO.File]::Open($lockFile, 'OpenOrCreate', 'ReadWrite', 'None')
        $fs.SetLength(0)
        $writer = New-Object System.IO.StreamWriter($fs)
        $writer.WriteLine($PID); $writer.Flush()
        $script:lockStream = $fs
        $script:lockWriter = $writer
    } catch {
        Write-Log "Другой экземпляр супервизора web-up уже работает — выхожу." 'WARN'
        return
    }
}

function Test-Port {
    param([int]$P)
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:$P/" -UseBasicParsing -TimeoutSec 5
        return ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500)
    } catch { return $false }
}

function Test-DistFresh {
    if (-not (Test-Path (Join-Path $distDir 'index.html'))) { return $false }
    $distTime = (Get-Item (Join-Path $distDir 'index.html')).LastWriteTimeUtc
    $src = Get-ChildItem -Path (Join-Path $frontendDir 'src') -Recurse -File -ErrorAction SilentlyContinue
    $cfg = Get-Item (Join-Path $frontendDir 'vite.config.js') -ErrorAction SilentlyContinue
    $pkg = Get-Item (Join-Path $frontendDir 'package.json') -ErrorAction SilentlyContinue
    $idx = Get-Item (Join-Path $frontendDir 'index.html') -ErrorAction SilentlyContinue
    $newest = @($src) + @($cfg) + @($pkg) + @($idx) | Where-Object { $_ } |
              Sort-Object LastWriteTimeUtc -Descending | Select-Object -First 1
    if (-not $newest) { return $true }
    return ($newest.LastWriteTimeUtc -le $distTime)
}

function Invoke-Build {
    if (-not (Test-Path (Join-Path $frontendDir 'node_modules'))) {
        Write-Log "node_modules отсутствует — npm install" 'WARN'
        Push-Location $frontendDir
        try { & cmd.exe /c 'npm install' 2>&1 | Add-Content -Path $viteLog -Encoding UTF8 } finally { Pop-Location }
    }
    Write-Log "Собираю фронтенд (npm run build)…"
    Push-Location $frontendDir
    try {
        $out = & cmd.exe /c 'npm run build 2>&1'
        $out | Add-Content -Path $viteLog -Encoding UTF8
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Сборка упала (exit $LASTEXITCODE). Подробности в $viteLog; поднимаю старый dist, если он есть." 'ERROR'
            return (Test-Path (Join-Path $distDir 'index.html'))
        }
    } finally { Pop-Location }
    Write-Log "Сборка OK" 'OK'
    return $true
}

function Stop-Preview {
    $nodeProcs = Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue |
                 Where-Object { $_.CommandLine -match 'vite' -and $_.CommandLine -match 'preview' }
    foreach ($p in $nodeProcs) {
        Write-Log "Останавливаю vite preview (pid $($p.ProcessId))"
        Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
    }
    if ($nodeProcs) { Start-Sleep -Seconds 2 }
}

function Start-Preview {
    # кто-то уже держит порт — считаем, что сайт поднят
    if (Test-Port $Port) {
        Write-Log "Порт $Port уже обслуживается — ничего не запускаю" 'OK'
        return $true
    }

    if ($ForceBuild -or -not (Test-DistFresh)) {
        if (-not (Invoke-Build)) { Write-Log "Сборки нет — vite preview не запускаю" 'ERROR'; return $false }
        $script:ForceBuild = $false
    } else {
        Write-Log "dist актуален, сборка не нужна"
    }

    Write-Log "Запускаю vite preview на :$Port (host 0.0.0.0)"
    $node = (Get-Command node.exe -ErrorAction SilentlyContinue).Source
    if (-not $node) { Write-Log "node.exe не найден в PATH" 'ERROR'; return $false }
    $viteJs = Join-Path $frontendDir 'node_modules\vite\bin\vite.js'
    if (-not (Test-Path $viteJs)) { Write-Log "Не найден $viteJs — нужен npm install" 'ERROR'; return $false }

    Start-Process -FilePath $node `
        -ArgumentList @($viteJs, 'preview', '--port', "$Port", '--strictPort', '--host', '0.0.0.0') `
        -WorkingDirectory $frontendDir -WindowStyle Hidden `
        -RedirectStandardOutput $viteLog -RedirectStandardError (Join-Path $runDir 'vite-preview.err') | Out-Null

    for ($i = 1; $i -le 25; $i++) {
        Start-Sleep -Seconds 1
        if (Test-Port $Port) { Write-Log "Фронтенд поднят: http://127.0.0.1:$Port" 'OK'; return $true }
    }
    Write-Log "Порт $Port не поднялся за 25 с — смотрите $viteLog" 'ERROR'
    return $false
}

# ---------- основной цикл ----------
Write-Log "=== старт web: порт=$Port режим=$(if ($Once) {'once'} else {'supervisor'}) ==="

$first = $true
while ($true) {
    if ($first -and (Test-Port $Port)) {
        Write-Log "Порт $Port уже отвечает — используется текущий процесс" 'OK'
    } else {
        $null = Start-Preview
    }
    $first = $false
    if ($Once) { break }
    Start-Sleep -Seconds $IntervalSec
    if (-not (Test-Port $Port)) {
        Write-Log "Порт $Port перестал отвечать — перезапускаю" 'WARN'
    }
}

if ($script:lockWriter) { $script:lockWriter.Dispose(); $script:lockStream.Dispose(); Remove-Item $lockFile -Force -ErrorAction SilentlyContinue }
