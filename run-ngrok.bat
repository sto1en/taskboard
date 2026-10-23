@echo off
rem ============================================================
rem  run-ngrok.bat - supervisor for ngrok-up.ps1 (no window).
rem  Вывод не перенаправляется в файл (см. run-api.bat).
rem ============================================================
setlocal
set "HERE=%~dp0"
if not exist "%HERE%.ngrok" mkdir "%HERE%.ngrok"

:loop
powershell -NoProfile -ExecutionPolicy Bypass -File "%HERE%ngrok-up.ps1" -Port 4173 -NoPause
echo [%date% %time%] ngrok-up exited code %errorlevel%, restart in 60s
timeout /t 60 /nobreak >nul
goto loop
