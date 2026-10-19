# TaskBoard — локальный запуск и доступ через ngrok

## Быстрый старт

```bat
:: прод: сборка frontend\dist + nginx на :8081
frontend-run.bat

:: dev: Vite с hot-reload на :5173
frontend-run.bat --dev
```

Оба режима слушают `0.0.0.0`, то есть доступны локально, по LAN и через туннель.
Бэкенд (Spring Boot) при этом должен быть запущен на `:8082` — фронтенд проксирует
`/api` и `/uploads` туда.

| Режим | Команда | Адрес | Кто отдаёт фронт |
|-------|---------|-------|------------------|
| Прод  | `frontend-run.bat` | http://localhost:8081 | nginx (`frontend/dist`) |
| Dev   | `frontend-run.bat --dev` | http://localhost:5173 | Vite (hot-reload) |

Остановить прод-nginx: `taskkill /F /IM nginx.exe`
Остановить dev: `Ctrl+C` в окне скрипта.

---

## Как это устроено

```
nginx.conf (D:\utilities\nginx-1.30.4\conf\nginx.conf)
 ├── server :80        → проксирует на Vite :5173   (старый дев-конфиг)
 └── include taskboard.conf
      └── server :8081 → отдаёт frontend/dist + проксирует /api, /uploads на :8082
```

`frontend-run.bat` запускает nginx с `-c conf\nginx.conf`, поэтому оба сервера
поднимаются одним процессом. Ничего больше «доподключить» вручную не нужно:
`server :8081` живёт в `conf\taskboard.conf` и подключается директивой `include`.

---

## Доступ через ngrok

ngrok-туннель поднимается **отдельным окном**, после того как скрипт запустил сервер:

```bat
:: прод (nginx :8081)
ngrok http 8081

:: dev (Vite :5173)
ngrok http 5173
```

ngrok выдаст адрес вида `https://xxxx-xxxx.ngrok-free.dev`. Открывать нужно его —
API и `/uploads` поедут через тот же origin.

### Почему это работает

* Vite в dev слушает `host: true` и `allowedHosts: true` — иначе ngrok-домен
  получает `Blocked request`.
* `resolveUrl()` в `frontend/src/utils/format.js` больше не подставляет
  `http://localhost:8082`, а возвращает относительный путь `/uploads/...`.
  Абсолютный `localhost` ломал бы картинки у любого, кто открыл туннель не с вашей машины.

> Если планируете принимать запросы из интернета долго — не забудьте, что
> ngrok-free домен меняется при перезапуске туннеля. Для стабильного домена
> нужен платный план либо фиксированный домен в конфиге ngrok.

---

## Если что-то не работает

| Симптом | Причина / что делать |
|---------|----------------------|
| `curl` показывает `000` | nginx не запустился: смотрите `D:\utilities\nginx-1.30.4\logs\error.log` |
| `/api/...` отдаёт `502` | Бэкенд не запущен на `:8082` |
| Картинки не грузятся | Проверьте, что `resolveUrl` отдаёт относительный путь, а `/uploads/` проксируется |
| Порт занят | `taskkill /F /IM nginx.exe`, затем повторить запуск |
