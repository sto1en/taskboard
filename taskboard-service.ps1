<#
.SYNOPSIS
    Единая точка управления автозапуском TaskBoard: бэкенд, фронтенд, ngrok, git-watch.

.DESCRIPTION
    Задачи планировщика (все - при входе пользователя Admin, HighestAvailable):
      taskboard-api        api-up.ps1  -> Spring Boot :8082
      taskboard-web        web-up.ps1  -> vite preview :4173
      taskboard-ngrok      ngrok-up.ps1-> публичный туннель
      taskboard-git-watch  git-watch.ps1 (существующая)

.EXAMPLE
    .\taskboard-service.ps1 status
    .\taskboard-service.ps1 install
    .\taskboard-service.ps1 install -LogonKind Password -Password '...'
    .\taskboard-service.ps1 restart
    .\taskboard-service.ps1 stop
    .\taskboard-service.ps1 health
#>
[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [ValidateSet('status', 'health', 'start', 'stop', 'restart', 'install', 'uninstall')]
    [string]$Action = 'status',

    [ValidateSet('InteractiveToken', 'Password')]
    [string]$LogonKind = 'InteractiveToken',
    [string]$Password,

    [string]$User = "$env:COMPUTERNAME\Admin"
)

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$runDir = Join-Path $here '.ngrok'

# порядок важен только для читаемости: задачи независимы
$tasks = @(
    @{ Name = 'taskboard-api';       Bat = 'run-api.bat';       Delay = 'PT20S'; Port = 8082 },
    @{ Name = 'taskboard-web';       Bat = 'run-web.bat';       Delay = 'PT30S'; Port = 4173 },
    @{ Name = 'taskboard-ngrok';     Bat = 'run-ngrok.bat';     Delay = 'PT60S'; Port = 4040 },
    @{ Name = 'taskboard-git-watch'; Bat = 'run-git-watch.bat'; Delay = 'PT60S'; Port = 0 }
)

function Get-TaskState {
    param([string]$Name)
    $t = Get-ScheduledTask -TaskName $Name -ErrorAction SilentlyContinue
    if (-not $t) { return $null }
    $info = Get-ScheduledTaskInfo -TaskName $Name -ErrorAction SilentlyContinue
    [pscustomobject]@{
        Name    = $Name
        State   = $t.State
        LastRun = $info.LastRunTime
        Result  = $info.LastTaskResult
    }
}

function Test-PortOpen {
    param([int]$P)
    if (-not $P) { return $null }
    return [bool](Get-NetTCPConnection -LocalPort $P -State Listen -ErrorAction SilentlyContinue)
}

switch ($Action) {
    'status' {
        Write-Host "=== Задачи планировщика ===" -ForegroundColor Cyan
        foreach ($t in $tasks) {
            $st = Get-TaskState $t.Name
            if (-not $st) { Write-Host ("{0,-20} {1}" -f $t.Name, 'НЕ УСТАНОВЛЕНА') -ForegroundColor Red; continue }
            $color = if ($st.State -eq 'Running') { 'Green' } else { 'Yellow' }
            Write-Host ("{0,-20} {1,-10} last {2}  result {3}" -f $st.Name, $st.State, $st.LastRun, $st.Result) -ForegroundColor $color
        }

        Write-Host "`n=== Процессы ===" -ForegroundColor Cyan
        $api = Get-CimInstance Win32_Process -Filter "Name='java.exe'" -ErrorAction SilentlyContinue |
               Where-Object { $_.CommandLine -match 'taskboard-.*\.jar|TaskBoardApplication' }
        Write-Host ("backend  : {0}" -f ($(if ($api) { "pid $($api.ProcessId -join ',')" } else { 'не запущен' })))
        $node = Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue |
                Where-Object { $_.CommandLine -match 'vite.*preview' }
        Write-Host ("frontend : {0}" -f ($(if ($node) { "pid $($node.ProcessId -join ',')" } else { 'не запущен' })))
        $ng = Get-Process ngrok -ErrorAction SilentlyContinue
        Write-Host ("ngrok    : {0}" -f ($(if ($ng) { "pid $($ng.Id -join ',')" } else { 'не запущен' })))
        $gw = Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" -ErrorAction SilentlyContinue |
              Where-Object { $_.CommandLine -match 'git-watch.ps1' }
        Write-Host ("git-watch: {0}" -f ($(if ($gw) { "pid $($gw.ProcessId -join ',')" } else { 'не запущен' })))

        Write-Host "`n=== Порты ===" -ForegroundColor Cyan
        foreach ($p in 5432, 8082, 4173, 4040) {
            Write-Host ("{0,-5} {1}" -f $p, $(if (Test-PortOpen $p) { 'LISTEN' } else { '-' }))
        }

        if (Test-Path (Join-Path $runDir 'url.txt')) {
            Write-Host "`nПубличный адрес: $((Get-Content (Join-Path $runDir 'url.txt') -Raw).Trim())" -ForegroundColor Green
        }
        Write-Host "`nЛоги: $runDir\*.log"
    }

    'health' {
        Write-Host "=== Проверка живости ===" -ForegroundColor Cyan
        $bad = 0
        function Check {
            param([string]$Name, [scriptblock]$Test)
            try { $r = & $Test; if ($r) { Write-Host ("{0,-10} OK" -f $Name) -ForegroundColor Green } else { Write-Host ("{0,-10} FAIL" -f $Name) -ForegroundColor Red; $script:bad++ } }
            catch { Write-Host ("{0,-10} FAIL ({1})" -f $Name, $_.Exception.Message) -ForegroundColor Red; $script:bad++ }
        }
        Check 'postgres' { [bool](Get-NetTCPConnection -LocalPort 5432 -State Listen -ErrorAction SilentlyContinue) }
        Check 'backend'  {
            try { $null = Invoke-WebRequest 'http://127.0.0.1:8082/api/auth/me' -UseBasicParsing -TimeoutSec 5; $true }
            catch { [int]$_.Exception.Response.StatusCode -in 200, 401, 403, 404 }
        }
        Check 'frontend' { (Invoke-WebRequest 'http://127.0.0.1:4173/' -UseBasicParsing -TimeoutSec 5).StatusCode -eq 200 }
        Check 'proxy'    {
            try { $null = Invoke-WebRequest 'http://127.0.0.1:4173/api/auth/me' -UseBasicParsing -TimeoutSec 5; $true }
            catch { [int]$_.Exception.Response.StatusCode -in 200, 401, 403, 404 }
        }
        Check 'ngrok'    {
            $u = if (Test-Path (Join-Path $runDir 'url.txt')) { (Get-Content (Join-Path $runDir 'url.txt') -Raw).Trim() } else { $null }
            if (-not $u) { $false } else {
                (Invoke-WebRequest -Uri "$u/" -UseBasicParsing -TimeoutSec 20 -Headers @{ 'ngrok-skip-browser-warning' = '1' }).StatusCode -eq 200
            }
        }
        if ($bad -eq 0) { Write-Host "`nВсё работает." -ForegroundColor Green } else { Write-Host "`nПроблем: $bad — смотрите $runDir\*.log" -ForegroundColor Yellow }
        exit $bad
    }

    'start'   { $tasks | ForEach-Object { Start-ScheduledTask -TaskName $_.Name -ErrorAction SilentlyContinue; "start $($_.Name)" } }
    'stop'    { $tasks | ForEach-Object { Stop-ScheduledTask -TaskName $_.Name -ErrorAction SilentlyContinue; "stop  $($_.Name)" } }
    'restart' {
        $tasks | ForEach-Object { Stop-ScheduledTask -TaskName $_.Name -ErrorAction SilentlyContinue }
        Start-Sleep 5
        # убиваем «сирот», иначе супервизоры не встанут (порты и lock-файлы заняты)
        Get-CimInstance Win32_Process -Filter "Name='java.exe'" | Where-Object { $_.CommandLine -match 'taskboard-.*\.jar|TaskBoardApplication' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
        Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -match 'vite.*preview' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
        Get-Process ngrok -ErrorAction SilentlyContinue | Stop-Process -Force
        # cmd-обёртки держат stdout перенаправленным в .log -> файл «занят», пока жив cmd
        Get-CimInstance Win32_Process | Where-Object {
            ($_.Name -eq 'cmd.exe' -and $_.CommandLine -match 'run-(api|web|ngrok)\.bat') -or
            ($_.Name -eq 'powershell.exe' -and $_.CommandLine -match '(api|web|ngrok)-up\.ps1')
        } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
        Start-Sleep 3
        Remove-Item (Join-Path $runDir '*.lock') -Force -ErrorAction SilentlyContinue
        # гасим старые лог-файлы только у остановленных процессов — у перезапущенных ok
        $tasks | ForEach-Object { Start-ScheduledTask -TaskName $_.Name -ErrorAction SilentlyContinue; "start $($_.Name)" }
    }

    'install' {
        foreach ($t in $tasks) {
            $bat = Join-Path $here $t.Bat
            if (-not (Test-Path $bat)) { Write-Warning "нет $bat — пропускаю $($t.Name)"; continue }
            $action = New-ScheduledTaskAction -Execute 'cmd.exe' -Argument "/c `"$bat`"" -WorkingDirectory $here
            $trigger = New-ScheduledTaskTrigger -AtLogOn -User $User
            $trigger.Delay = $t.Delay
            $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
                        -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) `
                        -ExecutionTimeLimit ([TimeSpan]::Zero)
            if ($LogonKind -eq 'Password') {
                if (-not $Password) { throw "Для -LogonKind Password нужен -Password (вводится локально, в файлы не пишется)" }
                Register-ScheduledTask -TaskName $t.Name -Action $action -Trigger $trigger -Settings $settings `
                    -RunLevel Highest -User $User -Password $Password -Force | Out-Null
            } else {
                Register-ScheduledTask -TaskName $t.Name -Action $action -Trigger $trigger -Settings $settings `
                    -RunLevel Highest -User $User -Force | Out-Null
            }
            "installed $($t.Name) [$(if ($LogonKind -eq 'Password') {'Password — работает без входа'} else {'InteractiveToken — после входа'})]"
        }
    }

    'uninstall' {
        $tasks | ForEach-Object {
            Unregister-ScheduledTask -TaskName $_.Name -Confirm:$false -ErrorAction SilentlyContinue
            "removed $($_.Name)"
        }
    }
}
