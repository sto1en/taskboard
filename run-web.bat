@echo off
rem ============================================================
rem  run-web.bat - supervisor for web-up.ps1 (no window).
rem  Builds frontend dist when stale and keeps vite preview on :4173.
rem  Вывод не перенаправляется в файл (см. run-api.bat).
rem ============================================================
setlocal
set "HERE=%~dp0"
if not exist "%HERE%.ngrok" mkdir "%HERE%.ngrok"

:loop
powershell -NoProfile -ExecutionPolicy Bypass -File "%HERE%web-up.ps1" -Port 4173 -NoPause
echo [%date% %time%] web-up exited code %errorlevel%, restart in 30s
timeout /t 30 /nobreak >nul
goto loop
