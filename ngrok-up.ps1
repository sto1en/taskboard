<#
.SYNOPSIS
    Поднимает ngrok-туннель к TaskBoard (vite preview / nginx), пишет лог и актуальный URL.

.DESCRIPTION
    Идемпотентно: если туннель уже поднят и отдаёт 200 — ничего не делает.
    ngrok.exe ищется в таком порядке:
      1. -NgrokExe (явный путь)
      2. %LOCALAPPDATA%\Microsoft\WinGet\Links\ngrok.exe (shim winget)
      3. PATH
      4. winget-папки пакета (берётся самая свежая версия)
      5. ngrok.exe рядом со скриптом
    URL пишется в .ngrok\url.txt и в лог .ngrok\ngrok-up.log.

.PARAMETER Port
    Локальный порт TaskBoard. По умолчанию 4173 (vite preview).

.PARAMETER NgrokExe
    Явный путь к ngrok.exe.

.PARAMETER Domain
    Статический домен ngrok (--url). По умолчанию берётся из .ngrok\domain.txt,
    если файл есть; иначе ngrok выдаёт случайный адрес.

.PARAMETER Once
    Один цикл: поднять (или проверить) туннель и выйти. Без флага — супервизор.

.PARAMETER IntervalSec
    Интервал проверки в режиме супервизора (по умолчанию 30).

.PARAMETER NoPause
    Не ждать Enter (для планировщика).

.EXAMPLE
    .\ngrok-up.ps1
    .\ngrok-up.ps1 -Port 8081
    .\ngrok-up.ps1 -Once
    .\ngrok-up.ps1 -Domain my-name.ngrok-free.dev
#>
[CmdletBinding()]
param(
    [int]$Port = 4173,
    [string]$NgrokExe = '',
    [string]$Domain = '',
    [switch]$Once,
    [int]$IntervalSec = 30,
    [switch]$NoPause
)

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$runDir = Join-Path $here '.ngrok'
New-Item -ItemType Directory -Force -Path $runDir | Out-Null
$logFile   = Join-Path $runDir 'ngrok-up.log'
$urlFile   = Join-Path $runDir 'url.txt'
$domainFile= Join-Path $runDir 'domain.txt'
$stdout    = Join-Path $runDir 'ngrok.log'
$stderr    = Join-Path $runDir 'ngrok.err'
$lockFile  = Join-Path $runDir 'ngrok-up.lock'

function Write-Log {
    param([string]$Message, [string]$Level = 'INFO')
    $line = "[{0}] {1,-5} {2}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Level, $Message
    Add-Content -Path $logFile -Value $line -Encoding UTF8
    if (-not $Once) { Write-Host $line }
}

# ---------- единственный экземпляр супервизора ----------
if (-not $Once) {
    try {
        $fs = [System.IO.File]::Open($lockFile, 'OpenOrCreate', 'ReadWrite', 'None')
        $fs.SetLength(0)
        $writer = New-Object System.IO.StreamWriter($fs)
        $writer.WriteLine($PID); $writer.Flush()
        $script:lockStream = $fs
        $script:lockWriter = $writer
    } catch {
        Write-Log "Другой экземпляр супервизора уже работает — выхожу." 'WARN'
        return
    }
}

# ---------- поиск ngrok.exe ----------
function Get-NgrokVersion {
    param([string]$Path)
    try {
        $v = (& $Path --version 2>$null) -replace '[^0-9\.]', ''
        if ($v) { return [version]$v }
    } catch { }
    return [version]'0.0'
}

function Resolve-NgrokExe {
    if ($NgrokExe -and (Test-Path $NgrokExe)) { return (Resolve-Path $NgrokExe).Path }

    $candidates = @()
    $links = Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Links\ngrok.exe'
    if (Test-Path $links) { $candidates += $links }

    $inPath = Get-Command ngrok.exe -ErrorAction SilentlyContinue
    if ($inPath) { $candidates += $inPath.Source }

    $pkgRoot = Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Packages'
    if (Test-Path $pkgRoot) {
        $candidates += (Get-ChildItem -Path $pkgRoot -Recurse -Filter ngrok.exe -ErrorAction SilentlyContinue |
                       Sort-Object LastWriteTime -Descending | ForEach-Object { $_.FullName })
    }

    $local = Join-Path $here 'ngrok.exe'
    if (Test-Path $local) { $candidates += $local }

    # shim в WinGet\Links имеет размер 0 байт и реального файла не даёт — сразу пропускаем такие
    $candidates = $candidates | Where-Object { $_ } | ForEach-Object { (Resolve-Path $_ -ErrorAction SilentlyContinue).Path } | Select-Object -Unique
    $best = $null; $bestVer = [version]'0.0'
    foreach ($c in $candidates) {
        $item = Get-Item $c -ErrorAction SilentlyContinue
        if (-not $item -or $item.Length -lt 1024) { continue }
        $v = Get-NgrokVersion $c
        if ($v -gt $bestVer) { $best = $c; $bestVer = $v }
    }
    if ($best) {
        if ($bestVer -lt [version]'3.20.0') {
            Write-Log "Внимание: найден ngrok $bestVer, ngrok требует минимум 3.20.0 — проверьте обновление" 'WARN'
        }
        return $best
    }
    throw "ngrok.exe не найден. Установите: winget install Ngrok.Ngrok  (или укажите -NgrokExe)"
}

# ---------- health ----------
function Test-LocalApp {
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/" -UseBasicParsing -TimeoutSec 5
        return ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500)
    } catch { return $false }
}

function Get-TunnelUrl {
    try {
        $res = Invoke-RestMethod -Uri 'http://127.0.0.1:4040/api/tunnels' -TimeoutSec 5
        $t = $res.tunnels | Where-Object { $_.proto -eq 'https' } | Select-Object -First 1
        if ($t) { return $t.public_url }
    } catch { }
    return $null
}

function Test-PublicUrl {
    param([string]$Url)
    if (-not $Url) { return $false }
    try {
        $r = Invoke-WebRequest -Uri "$Url/" -UseBasicParsing -TimeoutSec 20 `
             -Headers @{ 'ngrok-skip-browser-warning' = '1' }
        return ($r.StatusCode -eq 200)
    } catch { return $false }
}

function Stop-Ngrok {
    $procs = Get-Process ngrok -ErrorAction SilentlyContinue
    if ($procs) {
        Write-Log "Останавливаю ngrok (pid $($procs.Id -join ', '))"
        $procs | Stop-Process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
}

function Get-TargetDomain {
    if ($Domain) { return $Domain }
    if (Test-Path $domainFile) {
        $d = (Get-Content $domainFile -Raw).Trim()
        if ($d) { return $d }
    }
    return ''
}

# ---------- поднять туннель ----------
function Start-Tunnel {
    $exe = Resolve-NgrokExe

    $existing = Get-TunnelUrl
    if ($existing) {
        if (Test-PublicUrl $existing) {
            Set-Content -Path $urlFile -Value $existing -Encoding UTF8
            Write-Log "Туннель уже работает: $existing" 'OK'
            return $existing
        }
        Write-Log "Туннель $existing не отвечает — перезапускаю" 'WARN'
        Stop-Ngrok
    }

    if (-not (Test-LocalApp)) {
        Write-Log "Порт $Port не отвечает локально — приложение TaskBoard не запущено. Проверю позже." 'WARN'
    }

    if (Test-Path $stderr) { Remove-Item $stderr -Force -ErrorAction SilentlyContinue }

    $args = @('http', "$Port", '--log=stdout', '--log-format=logfmt')
    $target = Get-TargetDomain
    if ($target) { $args += "--url=$target" }

    Write-Log "Запускаю: $exe $($args -join ' ')"

    Start-Process -FilePath $exe -ArgumentList $args `
        -RedirectStandardOutput $stdout -RedirectStandardError $stderr `
        -WorkingDirectory $here -WindowStyle Hidden | Out-Null

    for ($i = 1; $i -le 20; $i++) {
        Start-Sleep -Seconds 1
        $url = Get-TunnelUrl
        if ($url) {
            Set-Content -Path $urlFile -Value $url -Encoding UTF8
            $ok = Test-PublicUrl $url
            Write-Log "Туннель поднят: $url  (публичная проверка: $(if ($ok) {'OK 200'} else {'не ответил сразу, продолжу мониторинг'}))" 'OK'
            return $url
        }
    }

    $err = if (Test-Path $stderr) { (Get-Content $stderr -Raw).Trim() } else { 'нет вывода' }
    Write-Log "ngrok не поднялся. Вывод: $err" 'ERROR'
    Stop-Ngrok
    return $null
}

# ---------- основной цикл ----------
Write-Log "=== старт: порт=$Port домен=$(if (Get-TargetDomain) {Get-TargetDomain} else {'случайный'}) режим=$(if ($Once) {'once'} else {'supervisor'}) ==="

$script:cycle = 0
$first = $true
while ($true) {
    $running = Get-Process ngrok -ErrorAction SilentlyContinue
    if (-not $running) {
        $null = Start-Tunnel
    } elseif ($first) {
        $url = Get-TunnelUrl
        if ($url -and (Test-PublicUrl $url)) {
            Set-Content -Path $urlFile -Value $url -Encoding UTF8
            Write-Log "Найден живой туннель: $url" 'OK'
        } else {
            $null = Start-Tunnel
        }
    }
    $first = $false

    if ($Once) { break }

    # раз в 10 циклов (~5 мин) проверяем, что публичный URL реально отвечает
    $script:cycle++
    if ($script:cycle % 10 -eq 0) {
        $url = Get-TunnelUrl
        if (-not $url -or -not (Test-PublicUrl $url)) {
            Write-Log "Публичная проверка не прошла — перезапускаю туннель" 'WARN'
            Stop-Ngrok
            $null = Start-Tunnel
        }
    }

    Start-Sleep -Seconds $IntervalSec
}

if ($script:lockWriter) { $script:lockWriter.Dispose(); $script:lockStream.Dispose(); Remove-Item $lockFile -Force -ErrorAction SilentlyContinue }
