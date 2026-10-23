@echo off
rem ============================================================
rem  run-api.bat - supervisor for api-up.ps1 (no window).
rem  Waits for PostgreSQL, builds jar when stale, runs Spring Boot on :8082.
rem  ВАЖНО: вывод НЕ перенаправляется в файл — этим занят PowerShell
rem  (у cmd файл оставался бы «занятым» после рестарта, отсюда
rem   "Процесс не может получить доступ к файлу").
rem ============================================================
setlocal
set "HERE=%~dp0"
if not exist "%HERE%.ngrok" mkdir "%HERE%.ngrok"

:loop
powershell -NoProfile -ExecutionPolicy Bypass -File "%HERE%api-up.ps1" -Port 8082 -NoPause
echo [%date% %time%] api-up exited code %errorlevel%, restart in 30s
timeout /t 30 /nobreak >nul
goto loop
