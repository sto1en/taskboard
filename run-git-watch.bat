@echo off
rem ============================================================
rem  run-git-watch.bat - background supervisor for git-watch.ps1
rem  Restarts git-watch if it dies. Used by Task Scheduler (no window).
rem  Logs: .git-watch.log (watcher), .git-watch-launcher.log (this file)
rem ============================================================
setlocal
set "HERE=%~dp0"
set "LOG=%HERE%.git-watch-launcher.log"

:loop
echo [%date% %time%] start git-watch>>"%LOG%"
powershell -NoProfile -ExecutionPolicy Bypass -File "%HERE%git-watch.ps1" -Pull -IntervalSec 60 -TracePath "%HERE%.git-watch-trace.log" -ProcessName python.exe,pythonw.exe,cmd.exe -ProcessMatch "tg_bot_watchdog.py" >nul 2>>"%LOG%"
echo [%date% %time%] git-watch exited code %errorlevel%, restart in 30s>>"%LOG%"
timeout /t 30 /nobreak >nul
goto loop
