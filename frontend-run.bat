@echo off
chcp 65001 >nul
setlocal

REM ============================================================
REM  TaskBoard — сборка + перезапуск Nginx + открытие браузера
REM ============================================================

set "PROJECT_ROOT=D:\projects\taskBoard"
set "FRONTEND_DIR=%PROJECT_ROOT%\frontend"
set "NGINX_DIR=D:\utilities\nginx-1.30.4"
set "NGINX_EXE=%NGINX_DIR%\nginx.exe"
set "TASKBOARD_URL=http://localhost:8081"

echo.
echo ============================================================
echo   TaskBoard - пересборка фронтенда
echo ============================================================
echo.

if not exist "%FRONTEND_DIR%\package.json" (
    echo [ОШИБКА] Не найден %FRONTEND_DIR%\package.json
    goto :error
)

if not exist "%NGINX_EXE%" (
    echo [ОШИБКА] Не найден Nginx: %NGINX_EXE%
    goto :error
)

echo [1/4] Сборка React...
cd /d "%FRONTEND_DIR%"
call npm run build
if errorlevel 1 (
    echo.
    echo [ОШИБКА] Сборка React не удалась
    goto :error
)
echo       OK
echo.

echo [2/4] Проверка dist\index.html...
if not exist "%FRONTEND_DIR%\dist\index.html" (
    echo [ОШИБКА] Не найден %FRONTEND_DIR%\dist\index.html
    goto :error
)
echo       OK
echo.

echo [3/4] Перезапуск Nginx...
cd /d "%NGINX_DIR%"

REM проверяем, есть ли nginx в процессах
tasklist /FI "IMAGENAME eq nginx.exe" 2>NUL | find /I "nginx.exe" >NUL
if errorlevel 1 (
    echo       Nginx не запущен, стартуем
    start "" /B "%NGINX_EXE%"
    ping -n 3 127.0.0.1 >nul
) else (
    echo       Nginx работает, перезагружаем конфиг
    "%NGINX_EXE%" -s reload
    if errorlevel 1 (
        echo       Reload не сработал, полный рестарт
        "%NGINX_EXE%" -s stop
        ping -n 2 127.0.0.1 >nul
        start "" /B "%NGINX_EXE%"
        ping -n 3 127.0.0.1 >nul
    )
)
echo       OK
echo.

echo [4/4] Проверка конфига Nginx...
"%NGINX_EXE%" -t
echo.

echo ============================================================
echo   Открываю браузер: %TASKBOARD_URL%
echo ============================================================
start "" "%TASKBOARD_URL%"

echo.
echo Всё готово. Нажмите любую клавишу для выхода.
pause >nul
exit /b 0

:error
echo.
echo ============================================================
echo   СКРИПТ ЗАВЕРШИЛСЯ С ОШИБКОЙ
echo ============================================================
pause
exit /b 1