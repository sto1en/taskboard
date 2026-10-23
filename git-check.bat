@echo off
rem Проверка новых коммитов на GitHub (без pull)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0git-check.ps1"
