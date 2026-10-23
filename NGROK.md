# TaskBoard — полный автозапуск (после перезагрузки поднимается всё)

Четыре задачи планировщика: PostgreSQL (служба Windows), бэкенд, фронтенд, ngrok.
Плюс существующий `taskboard-git-watch` (автопул с GitHub).

## Задачи

| Задача | Что запускает | Задержка | Порт |
|---|---|---|---|
| `postgresql-x64-18` (служба) | PostgreSQL 18 | авто (Automatic) | 5432 |
| `taskboard-api` | `run-api.bat` → `api-up.ps1` → `java -jar backend\target\taskboard-*.jar` | 20 с | 8082 |
| `taskboard-web` | `run-web.bat` → `web-up.ps1` → `vite preview` (сборка при необходимости) | 30 с | 4173 |
| `taskboard-ngrok` | `run-ngrok.bat` → `ngrok-up.ps1` → туннель | 60 с | 4040 (API ngrok) |
| `taskboard-git-watch` | `run-git-watch.bat` → `git-watch.ps1` | 60 с | — |

Все задачи: пользователь `DESKTOP-NRFSKUG\Admin`, `RunLevel HighestAvailable`,
триггер «при входе в систему», авто-рестарт при сбое.

## Единая точка управления

```powershell
.\taskboard-service.ps1 status     # задачи, процессы, порты, публичный адрес
.\taskboard-service.ps1 health     # postgres/backend/frontend/proxy/ngrok, exit-код = число проблем
.\taskboard-service.ps1 restart    # стоп всех + убийство сирот + старт
.\taskboard-service.ps1 start | stop
.\taskboard-service.ps1 install    # пересоздать задачи (InteractiveToken)
.\taskboard-service.ps1 install -LogonKind Password -Password '<пароль>'   # работа без входа
.\taskboard-service.ps1 uninstall
```

`health` при полном порядке печатает «Всё работает.» и возвращает 0.

## Логи

| Файл | Что внутри |
|---|---|
| `.ngrok\api-up.log` | решения супервизора бэкенда, ошибки java |
| `.ngrok\backend.log` / `.ngrok\backend.err` | вывод Spring Boot |
| `.ngrok\mvn.log` | вывод сборки Maven |
| `.ngrok\web-up.log` | сборка/старт фронтенда |
| `.ngrok\vite-preview.log` | вывод vite |
| `.ngrok\ngrok-up.log` | туннель |
| `.ngrok\url.txt` | текущий публичный адрес |
| `.ngrok\domain.txt` | статический домен для `--url` |

## Как устроена живучесть

- **PostgreSQL**: служба Windows с `Automatic`; `api-up.ps1` ждёт порт 5432 до 180 с, прежде чем стартовать.
- **Бэкенд**: бандл jar собирается (Maven, `-s ai-assistant\config\m2-settings.xml`), только если его нет
  или `src`/`pom.xml` новее jar. После старта проверка `GET /api/auth/me` (401/404 = живой).
  Если порт занят, но API не отвечает — супервизор ждёт **420 с** (порог `-GraceSec`), прежде чем убивать
  процесс: это защита от гонки, когда старый супервизор ещё поднимает приложение.
- **Фронтенд**: `dist` пересобирается при устаревании исходников, `strictPort`, `proxy` для `/api` и `/uploads`
  (без него статическая сборка отдавала 404 вместо запросов к бэкенду).
- **ngrok**: статический домен из `.ngrok\domain.txt`, поиск exe через `WinGet\Links` → PATH → winget-пакеты,
  проверка версии ≥ 3.20.0.

## Грабли, которые уже обойдены (важно при правках)

1. **`.bat` не сохранять в UTF-8 с BOM** — cmd выполнит `я╗┐@echo off` и упадёт.
   Файлы записаны в ANSI/UTF-8 без BOM. `.ps1` — наоборот, в UTF-8 **с BOM**, иначе PowerShell 5.1
   читает кириллицу как мусор.
2. **Не перенаправлять вывод `run-*.bat` в лог-файл.** Пока жив cmd, `.log` занят, и следующий
   `Start-Process -RedirectStandardOutput` падает с «Процесс не может получить доступ к файлу,
   так как этот файл занят другим процессом». Поэтому cmd пишет только в консоль задачи,
   а файлы логов ведёт сам PowerShell.
3. **`Start-Process` в PowerShell 5.1 не имеет `-Append`** для редиректов — только перезапись.
4. Lock-файлы `.ngrok\*.lock` держатся открытыми на запись; если супервизор убит принудительно —
   `restart` их удаляет.

## Проверено

Холодный старт: убиты java, node, ngrok и все супервизоры → `Start-ScheduledTask` для трёх задач →
через ~75 с `health`: postgres/backend/frontend/proxy/ngrok — **все OK**, туннель отдавал 200 снаружи.

## Ограничения

- Задачи — `InteractiveToken`: поднимаются после входа `Admin`, переживают RDP‑disconnect и перезагрузку
  с входом. **Не** переживают logoff/вход другого пользователя. Для этого:
  `.\taskboard-service.ps1 install -LogonKind Password -Password '<пароль>'` (пароль вводится локально).
- При пересборке фронтенда старый `dist` заменяется; момент сборки — короткая недоступность UI.
- Ngrok free: первый заход в браузере показывает страницу «Visit Site»; для скриптов —
  заголовок `ngrok-skip-browser-warning: 1`. Домен постоянный, пока живёт запись в `domain.txt`.
- `ai-assistant\`, `git-*.ps1`, `*.bat`, `NGROK.md`, `web-up.ps1`, `api-up.ps1`, `taskboard-service.ps1`
  не закоммичены — решает владелец репозитория.
