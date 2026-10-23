@echo off
rem ‘оновый наблюдатель за GitHub дл€ taskboard.
rem   start-git-watch.bat          - окно свЄрнуто, fetch + подт€гивать код
rem   start-git-watch.bat -NoPull  - только fetch (без изменени€ рабочей копии)
rem Ћог: .git-watch.log
set "EXTRA=-Pull"
for %%a in (%*) do (
    if /I "%%~a"=="-NoPull" set "EXTRA="
)

start "git-watch taskboard" /min powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0git-watch.ps1" %EXTRA% -ProcessName python.exe,cmd.exe -ProcessMatch "app.main"
