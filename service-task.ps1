[CmdletBinding()]
param(
    [ValidateSet('install', 'uninstall', 'start', 'stop', 'restart', 'status', 'log')]
    [string]$Action = 'status',
    [string]$TaskName = 'taskboard-git-watch',
    [switch]$Elevated,
    [ValidateSet('InteractiveToken', 'Password')]
    [string]$LogonKind = 'InteractiveToken',
    [string]$Password = ''
)

# ============================================================
#  service-task.ps1 — task scheduler wrapper for git-watch
#
#  Task: starts at boot, no window, restarts by run-git-watch.bat.
#  Run PowerShell as Administrator:
#    .\service-task.ps1 install [-Elevated]
#    .\service-task.ps1 start | stop | restart
#    .\service-task.ps1 status | log
#    .\service-task.ps1 uninstall
# ============================================================

$ErrorActionPreference = 'Stop'
$here = $PSScriptRoot
$runner = Join-Path $here 'run-git-watch.bat'
$watchLog = Join-Path $here '.git-watch.log'
$launcherLog = Join-Path $here '.git-watch-launcher.log'

function Get-PrincipalXml {
    param([switch]$Elevated, [string]$LogonKind = 'InteractiveToken')

    $who = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
    $esc = [System.Security.SecurityElement]::Escape($who)

    # обычный режим — минимальные привилегии;
    # -Elevated — HighestAvailable (папки, куда пишут только админы)
    $runLevel = 'LeastPrivilege'
    if ($Elevated) { $runLevel = 'HighestAvailable' }

    # LogonKind:
    #   InteractiveToken — работает, пока пользователь вошёл (пароль не хранится)
    #   Password         — работает без входа (пароль хранится планировщиком),
    #                      переживает RDP disconnect, logoff и перезагрузку
    $xml = '<Principal id="Author"><UserId>' + $esc + '</UserId>'
    $xml += '<LogonType>' + $LogonKind + '</LogonType>'
    $xml += '<RunLevel>' + $runLevel + '</RunLevel></Principal>'
    return $xml
}

function New-TaskXml {
    param([string]$PrincipalXml)

    $runnerEsc = [System.Security.SecurityElement]::Escape($runner)
    $hereEsc = [System.Security.SecurityElement]::Escape($here)

    $xml = '<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">'
    $xml += '<RegistrationInfo><Author>taskboard</Author>'
    $xml += '<Description>Background git-watch: fetch taskboard from GitHub and pull new commits.</Description></RegistrationInfo>'
    $xml += '<Triggers><BootTrigger><Enabled>true</Enabled><Delay>PT1M</Delay></BootTrigger></Triggers>'
    $xml += '<Principals>' + $PrincipalXml + '</Principals>'
    $xml += '<Settings>'
    $xml += '<MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>'
    $xml += '<DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>'
    $xml += '<StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>'
    $xml += '<AllowHardTerminate>true</AllowHardTerminate>'
    $xml += '<StartWhenAvailable>true</StartWhenAvailable>'
    $xml += '<RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>'
    $xml += '<IdleSettings><StopOnIdleEnd>false</StopOnIdleEnd><RestartOnIdle>false</RestartOnIdle></IdleSettings>'
    $xml += '<AllowStartOnDemand>true</AllowStartOnDemand>'
    $xml += '<Enabled>true</Enabled>'
    $xml += '<Hidden>false</Hidden>'
    $xml += '<RunOnlyIfIdle>false</RunOnlyIfIdle>'
    $xml += '<WakeToRun>false</WakeToRun>'
    $xml += '<ExecutionTimeLimit>PT0S</ExecutionTimeLimit>'
    $xml += '<Priority>7</Priority>'
    $xml += '</Settings>'
    $xml += '<Actions Context="Author"><Exec>'
    $xml += '<Command>cmd.exe</Command>'
    $xml += '<Arguments>/c &quot;' + $runnerEsc + '&quot;</Arguments>'
    $xml += '<WorkingDirectory>' + $hereEsc + '</WorkingDirectory>'
    $xml += '</Exec></Actions></Task>'
    return $xml
}

function Stop-WatcherProcesses {
    $filter = "Name='powershell.exe' or Name='cmd.exe'"
    for ($i = 0; $i -lt 40; $i++) {
        $procs = @(Get-CimInstance Win32_Process -Filter $filter |
            Where-Object { $_.CommandLine -like '*git-watch*' -and $_.CommandLine -notlike '*Get-CimInstance*' -and $_.ProcessId -ne $PID })
        if ($procs.Count -eq 0) { break }
        $procs | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
        Start-Sleep -Milliseconds 500
    }
}

function Register-WatcherTask {
    param([string]$Xml)

    # schtasks wants the XML file as UTF-8 without BOM
    $xmlPath = Join-Path $here 'task.xml'
    [System.IO.File]::WriteAllText($xmlPath, $Xml, (New-Object System.Text.UTF8Encoding($false)))
    try {
        schtasks /Create /TN $TaskName /XML $xmlPath /F | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "schtasks /Create failed with exit $LASTEXITCODE" }
    } finally {
        Remove-Item -Force $xmlPath -ErrorAction SilentlyContinue
    }
}

function Show-Status {
    $procs = @(Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" |
        Where-Object { $_.CommandLine -like '*git-watch*' -and $_.CommandLine -notlike '*Get-CimInstance*' })
    schtasks /Query /TN $TaskName /FO LIST 2>&1 | Out-Null
    $taskExists = ($LASTEXITCODE -eq 0)

    Write-Host "Task     : $TaskName"
    if ($taskExists) {
        Write-Host 'State    : registered'
    } else {
        Write-Host 'State    : not registered'
    }
    Write-Host "Watchers : $($procs.Count) process(es) running"
    $lockPath = Join-Path $here '.git-watch.lock'
    if (Test-Path $lockPath) { Write-Host 'Lock     : present' } else { Write-Host 'Lock     : absent' }
    Write-Host "Log      : $watchLog"
    if (Test-Path $watchLog) {
        Write-Host '--- last 5 lines ---'
        Get-Content -Path $watchLog -Encoding UTF8 -Tail 5 | ForEach-Object { Write-Host "  $_" }
    }
}

switch ($Action) {

    'install' {
        if (-not (Test-Path $runner)) { throw "Not found: $runner" }
        Stop-WatcherProcesses
        $xml = New-TaskXml -PrincipalXml (Get-PrincipalXml -Elevated:$Elevated -LogonKind $LogonKind)
        Register-WatcherTask -Xml $xml
        Write-Host "Task '$TaskName' registered (boot trigger, elevated=$Elevated, logon=$LogonKind)." -ForegroundColor Green

        # Password-режим: schtasks пароль не умеет — сохраняем его через Set-ScheduledTask
        if ($LogonKind -eq 'Password') {
            if (-not $Password) { throw 'LogonKind=Password requires -Password' }
            Set-ScheduledTask -TaskName $TaskName -User ([System.Security.Principal.WindowsIdentity]::GetCurrent().Name) -Password $Password | Out-Null
            Write-Host 'Password stored in Task Scheduler.'
        }

        schtasks /Run /TN $TaskName | Out-Null
        Write-Host "Started. Log: $watchLog"
    }

    'uninstall' {
        schtasks /End /TN $TaskName 2>&1 | Out-Null
        schtasks /Delete /TN $TaskName /F 2>&1 | Out-Null
        Stop-WatcherProcesses
        Write-Host "Task '$TaskName' removed." -ForegroundColor Yellow
    }

    'start' {
        schtasks /Run /TN $TaskName | Out-Null
        Write-Host 'Started.'
    }

    'stop' {
        schtasks /End /TN $TaskName 2>&1 | Out-Null
        Stop-WatcherProcesses
        Write-Host 'Stopped.'
    }

    'restart' {
        schtasks /End /TN $TaskName 2>&1 | Out-Null
        Stop-WatcherProcesses
        Start-Sleep -Seconds 2
        schtasks /Run /TN $TaskName | Out-Null
        Write-Host 'Restarted.'
    }

    'status' { Show-Status }

    'log' {
        if (Test-Path $watchLog) { Get-Content -Path $watchLog -Encoding UTF8 -Tail 30 }
        else { Write-Host "No log yet: $watchLog" }
        if (Test-Path $launcherLog) {
            Write-Host '--- launcher ---'
            Get-Content -Path $launcherLog -Tail 10
        }
    }
}
