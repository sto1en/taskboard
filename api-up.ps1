<#
.SYNOPSIS
    Поднимает и держит бэкенд TaskBoard (Spring Boot, порт 8082).

.DESCRIPTION
    Идемпотентно: если health-эндпоинт/порт отвечает — ничего не делает.
    Сначала ждёт PostgreSQL (:5432), иначе Spring Boot падает на старте.
    Собирает jar (mvn -DskipTests package), если его нет или исходники новее.
    После старта раз в -IntervalSec секунд проверяет, что приложение живое,
    и при падении перезапускает.

    Логи: .ngrok\api-up.log, .ngrok\backend.log (вывод java).

.PARAMETER Port
    Порт бэкенда (по умолчанию 8082).

.PARAMETER Once
    Один цикл: поднять (или проверить) и выйти.

.PARAMETER ForceBuild
    Пересобрать jar даже если он актуален.

.PARAMETER NoPause
    Не ждать Enter (для планировщика).
#>
[CmdletBinding()]
param(
    [int]$Port = 8082,
    [switch]$Once,
    [switch]$ForceBuild,
    [int]$IntervalSec = 30,
    [int]$GraceSec = 420,
    [switch]$NoPause
)

$ErrorActionPreference = 'Stop'
$here       = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $here 'backend'
$runDir     = Join-Path $here '.ngrok'
New-Item -ItemType Directory -Force -Path $runDir | Out-Null
$logFile   = Join-Path $runDir 'api-up.log'
$javaLog   = Join-Path $runDir 'backend.log'
$javaErr   = Join-Path $runDir 'backend.err'
$lockFile  = Join-Path $runDir 'api-up.lock'
$m2Settings = Join-Path $here 'ai-assistant\config\m2-settings.xml'
$uploadDir = Join-Path $backendDir 'uploads'

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
        Write-Log "Другой экземпляр супервизора api-up уже работает — выхожу." 'WARN'
        return
    }
}

function Test-Port {
    param([int]$P)
    return [bool](Get-NetTCPConnection -LocalPort $P -State Listen -ErrorAction SilentlyContinue)
}

function Test-Api {
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/api/auth/me" -UseBasicParsing -TimeoutSec 5
        return $true
    } catch {
        # 401/403 = приложение поднялось и отвечает (JWT-защита), 5xx/таймаут — ещё нет/сломалось
        $code = 0
        if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
        return ($code -in 200, 401, 403, 404)
    }
}

function Wait-Postgres {
    param([int]$TimeoutSec = 180)
    $sw = [Diagnostics.Stopwatch]::StartNew()
    while ($sw.Elapsed.TotalSeconds -lt $TimeoutSec) {
        if (Test-Port 5432) { return $true }
        if ($Once) { Start-Sleep -Seconds 3 } else { Start-Sleep -Seconds 5 }
    }
    return $false
}

function Get-Jar {
    Get-ChildItem -Path (Join-Path $backendDir 'target') -Filter '*.jar' -File -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -notmatch 'sources|javadoc|original' } |
        Sort-Object LastWriteTime -Descending | Select-Object -First 1
}

function Test-JarFresh {
    $jar = Get-Jar
    if (-not $jar) { return $false }
    $pom = Get-Item (Join-Path $backendDir 'pom.xml') -ErrorAction SilentlyContinue
    $src = Get-ChildItem -Path (Join-Path $backendDir 'src') -Recurse -File -ErrorAction SilentlyContinue |
           Sort-Object LastWriteTimeUtc -Descending | Select-Object -First 1
    $newest = @($pom) + @($src) | Where-Object { $_ } | Sort-Object LastWriteTimeUtc -Descending | Select-Object -First 1
    if (-not $newest) { return $true }
    return ($newest.LastWriteTimeUtc -le $jar.LastWriteTimeUtc)
}

function Invoke-Build {
    $mvn = if (Test-Path 'E:\apache-maven-3.9.16\bin\mvn.cmd') { 'E:\apache-maven-3.9.16\bin\mvn.cmd' } else { 'mvn.cmd' }
    $mvnArgs = @('-B', '-DskipTests', 'package')
    if (Test-Path $m2Settings) { $mvnArgs = @('-s', $m2Settings) + $mvnArgs }
    Write-Log "Собираю бэкенд: $mvn $($mvnArgs -join ' ')"
    Push-Location $backendDir
    try {
        $out = & $mvn @mvnArgs 2>&1
        $out | Add-Content -Path (Join-Path $runDir 'mvn.log') -Encoding UTF8
        if ($LASTEXITCODE -ne 0) {
            Write-Log "Сборка бэкенда упала (exit $LASTEXITCODE). Подробности: .ngrok\mvn.log" 'ERROR'
            return $false
        }
    } finally { Pop-Location }
    Write-Log "Сборка бэкенда OK ($((Get-Jar).Name))" 'OK'
    return $true
}

function Stop-Backend {
    $found = Get-CimInstance Win32_Process -Filter "Name='java.exe'" -ErrorAction SilentlyContinue |
             Where-Object { $_.CommandLine -match 'taskboard-.*\.jar|TaskBoardApplication' }
    foreach ($p in $found) {
        Write-Log "Останавливаю бэкенд (pid $($p.ProcessId))"
        Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
    }
    if ($found) { Start-Sleep -Seconds 3 }
}

function Start-Backend {
    if (Test-Port $Port) {
        if (Test-Api) {
            $script:lastHealthy = Get-Date
            Write-Log "Бэкенд уже отвечает на :$Port — ничего не запускаю" 'OK'
            return $true
        }
        if (-not (Test-Api)) {
            $script:unhealthySince = if (-not $script:unhealthySince) { Get-Date } else { $script:unhealthySince }
            $down = ((Get-Date) - $script:unhealthySince).TotalSeconds
            Write-Log ("Порт {0} занят, API не отвечает уже {1:N0} с (порог {2} с) — жду" -f $Port, $down, $script:GraceSec)
            if ($down -lt $script:GraceSec) { return $false }
            if (-not $Once) {
                Write-Log "Порог ожидания превышен — освобождаю порт и перезапускаю" 'WARN'
                Stop-Backend
            }
        }
    }

    if (-not (Wait-Postgres)) {
        Write-Log "PostgreSQL (:5432) не отвечает — бэкенд не стартую, попробую позже" 'ERROR'
        return $false
    }

    if ($ForceBuild -or -not (Test-JarFresh)) {
        if (-not (Invoke-Build)) { return $false }
        $script:ForceBuild = $false
    } else {
        Write-Log "jar актуален, сборка не нужна"
    }

    $jar = Get-Jar
    if (-not $jar) { Write-Log "jar не найден после сборки" 'ERROR'; return $false }

    $java = (Get-Command java.exe -ErrorAction SilentlyContinue).Source
    if (-not $java) { Write-Log "java.exe не найден в PATH" 'ERROR'; return $false }

    New-Item -ItemType Directory -Force -Path $uploadDir | Out-Null
    Write-Log "Запускаю $($jar.Name) на :$Port"
    $p = Start-Process -FilePath $java -ArgumentList @('-jar', $jar.FullName) `
        -WorkingDirectory $backendDir -WindowStyle Hidden -PassThru `
        -RedirectStandardOutput $javaLog -RedirectStandardError $javaErr

    for ($i = 1; $i -le 120; $i++) {
        Start-Sleep -Seconds 1
        if (Test-Api) { Write-Log "Бэкенд поднят на :$Port (pid $($p.Id), $i с)" 'OK'; return $true }

        if ($p.HasExited) {
            # Start-Process не отдаёт лок, но HasExited/ExitCode иногда бросают — не роняем супервизор
            $code = $null
            try { $code = $p.ExitCode } catch { }
            Write-Log "Java-процесс завершился (exit $code). Хвост файла ${javaErr}:" 'ERROR'
            try { $p.WaitForExit() } catch { }
            if (Test-Path $javaErr) { (Get-Content $javaErr -Tail 15) | ForEach-Object { Write-Log $_ 'ERR' } }
            return $false
        }
    }
    Write-Log "Бэкенд не ответил за 120 с — смотрите $javaLog" 'ERROR'
    return $false
}

# ---------- основной цикл ----------
Write-Log "=== старт api: порт=$Port режим=$(if ($Once) {'once'} else {'supervisor'}) ==="

$script:unhealthySince = $null
$first = $true
while ($true) {
    if ($first -and (Test-Port $Port) -and (Test-Api)) {
        Write-Log "Бэкенд уже отвечает на :$Port — используется текущий процесс" 'OK'
    } else {
        $null = Start-Backend
    }
    $first = $false
    if ($Once) { break }
    Start-Sleep -Seconds $IntervalSec
    if (Test-Api) {
        $script:unhealthySince = $null
    } else {
        if (-not $script:unhealthySince) { $script:unhealthySince = Get-Date }
        $down = ((Get-Date) - $script:unhealthySince).TotalSeconds
        Write-Log ("API не отвечает на :{0} уже {1:N0} с" -f $Port, $down) 'WARN'
        if ($down -ge $script:GraceSec) {
            Write-Log "Порог ожидания превышен — перезапускаю бэкенд" 'WARN'
            Stop-Backend
            $script:unhealthySince = $null
        }
    }
}

if ($script:lockWriter) { $script:lockWriter.Dispose(); $script:lockStream.Dispose(); Remove-Item $lockFile -Force -ErrorAction SilentlyContinue }
