# Фоновый запуск наблюдателя с окном (свёрнуто): для планировщика / Startup.
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
Start-Process -FilePath 'powershell.exe' `
    -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', (Join-Path $here 'git-watch.ps1'), '-Pull',
        '-ProcessName', 'python.exe,cmd.exe', '-ProcessMatch', 'app.main') `
    -WindowStyle Minimized
