# Автообновление taskboard с GitHub (фон на сервере)

Схема: **Планировщик Windows** запускает `run-git-watch.bat` при загрузке ПК →
он держит `git-watch.ps1` в фоне (без окна) и перезапускает его при падении →
`git-watch.ps1` раз в минуту делает `git fetch --prune origin` и, если на GitHub
появились новые коммиты, обновляет рабочую копию.

## Файлы
| Файл | Назначение |
|---|---|
| `git-watch.ps1` | сам наблюдатель: fetch + (по `-Pull`) pull новых коммитов |
| `run-git-watch.bat` | супервизор для планировщика: перезапускает observer через 30 с |
| `service-task.ps1` | установка/управление задачей `taskboard-git-watch` |
| `git-sync.ps1` | обновление рабочей копии: `stash` → `pull --ff-only` → `stash pop` |
| `git-check.ps1` | разовая проверка «есть ли новые коммиты» (exit 0 = есть) |
| `start-git-watch.bat` | ручной фоновый запуск без планировщика |
| `.git-watch.log` | основной лог (ротация в `.git-watch.log.old` при 5 МБ) |
| `.git-watch-launcher.log` | «start / exited code N» от супервизора |
| `.git-watch-trace.log` | пошаговая трассировка (`-TracePath`) |

## Управление (PowerShell от администратора)
```powershell
.\service-task.ps1 install -Elevated -LogonKind Password -Password '<пароль Admin>'
                                        # работает без входа (пароль хранится планировщиком)
.\service-task.ps1 install -Elevated   # вариант с InteractiveToken: нужен вход пользователя
.\service-task.ps1 status              # регистрация, процессы, хвост лога
.\service-task.ps1 log                 # хвост лога + лог супервизора
.\service-task.ps1 stop | start | restart
.\service-task.ps1 uninstall
```
Без `-Elevated` задача создаётся с минимальными правами; `-Elevated` =
`HighestAvailable` — нужно, если папка репозитория принадлежит
`BUILTIN\Administrators` (как в `E:\projects\taskboard`), иначе запись в `.git`
(например `.git/FETCH_HEAD`) запрещена и fetch падает.

## Ручной запуск наблюдателя
```powershell
.\git-watch.ps1                 # только fetch, без изменения файлов
.\git-watch.ps1 -Pull           # fetch + обновление рабочей копии (как в задаче)
.\git-watch.ps1 -Once -Pull      # один цикл и выход
.\git-watch.ps1 -IntervalSec 15  # чаще опрашивать
```
Второй экземпляр не запустится: блокировка `.git-watch.lock`
(снимается автоматически при завершении процесса).

## Поведение при новых коммитах
1. `git pull --ff-only origin master` — безопасный fast-forward.
2. Если не получается (есть локальные правки/конфликт) — вызывается
   `git-sync.ps1`: `git stash push -u` → `pull` → `stash pop`; конфликт
   останется в `git stash list`, подробности — в `.git-watch.log`.
3. Используется ветка **`master`** — ветки `main` в репозитории нет.

## Важно
- Проверка идёт раз в 60 с (`-IntervalSec` в `run-git-watch.bat`), а не «мгновенно»:
  GitHub сам не умеет пушить в локальную папку.
- Задача переживает перезагрузку (триггер «при загрузке», задержка 1 мин)
  и работает без открытой консоли.
- **Режим `Password`** (`-LogonKind Password`): задача работает в session 0 без
  входа пользователя — переживает RDP disconnect, logoff и перезагрузку без
  логина. Пароль хранится в планировщике (в реестре TaskCache, защищён DPAPI).
- **Режим `InteractiveToken`** (по умолчанию): работает только пока пользователь
  вошёл. Disconnect RDP не убивает, а logoff / вход другого пользователя —
  останавливает до следующего входа.
