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
if not exist "%NGINX_DIR%\conf\nginx.conf" (
    echo [ОШИБКА] Не найден конфиг Nginx: %NGINX_DIR%\conf\nginx.conf
    goto :error
)

echo [0/6] Убиваем старые процессы Nginx...
taskkill /F /IM nginx.exe >nul 2>&1
echo       OK
echo.

echo [1/6] Очистка dist и кэша Vite...
if exist "%FRONTEND_DIR%\dist" (
    rmdir /s /q "%FRONTEND_DIR%\dist"
)
if exist "%FRONTEND_DIR%\node_modules\.vite" (
    rmdir /s /q "%FRONTEND_DIR%\node_modules\.vite"
)
echo       OK
echo.

echo [2/6] Сборка React...
cd /d "%FRONTEND_DIR%"
call npm run build
if errorlevel 1 (
    echo.
    echo [ОШИБКА] Сборка React не удалась
    goto :error
)
echo       OK
echo.

echo [3/6] Проверка dist\index.html...
if not exist "%FRONTEND_DIR%\dist\index.html" (
    echo [ОШИБКА] Не найден %FRONTEND_DIR%\dist\index.html
    goto :error
)
echo       OK

echo       Файлы в dist\assets:
dir /b "%FRONTEND_DIR%\dist\assets"
echo.

echo [4/6] Проверка конфига Nginx...
REM ВАЖНО: указываем -p (prefix) и -c (конфиг) явно
"%NGINX_EXE%" -p "%NGINX_DIR%" -c "%NGINX_DIR%\conf\nginx.conf" -t
if errorlevel 1 (
    echo [ОШИБКА] Конфиг Nginx некорректен
    goto :error
)
echo       OK
echo.

echo [5/6] Старт Nginx...
cd /d "%NGINX_DIR%"
start "" /B "%NGINX_EXE%" -p "%NGINX_DIR%" -c "%NGINX_DIR%\conf\nginx.conf"
ping -n 3 127.0.0.1 >nul
echo       OK
echo.

echo [6/6] Проверка HTTP:
curl -s -o nul -w "  /          %%{http_code}\n" http://localhost:8081/
curl -s -o nul -w "  /calendar  %%{http_code}\n" http://localhost:8081/calendar
curl -s -o nul -w "  /api/ping  %%{http_code}\n" http://localhost:8081/api/ping
echo.

echo ============================================================
echo   Открываю браузер: %TASKBOARD_URL%
echo ============================================================
start "" "%TASKBOARD_URL%"

echo.
echo Всё готово. Окно закроется через 3 секунды.
timeout /t 3 /nobreak >nul
exit /b 0

:error
echo.
echo ============================================================
echo   СКРИПТ ЗАВЕРШИЛСЯ С ОШИБКОЙ
echo ============================================================
pause
exit /b 1