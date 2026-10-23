@echo off
rem Запуск git-sync.ps1 из папки, где лежит этот .bat
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0git-sync.ps1"
