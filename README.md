# TaskBoard

Веб-приложение для управления задачами: доски, проекты, канбан, календарь, шаблоны задач, гайды, группы, лидерборд, магазин косметики и профили.

- **Backend:** Java 21, Spring Boot 3.3.5, Spring Security (JWT), JPA/Hibernate, Liquibase, PostgreSQL 16
- **Frontend:** React 19, Vite, React Router, Redux Toolkit, MobX, axios
- **Прод:** Docker Compose — PostgreSQL + Spring Boot + nginx (раздаёт собранный SPA и проксирует `/api`, `/uploads`)

Репозиторий: <https://github.com/sto1en/taskboard> (ветка `master`)

---

## Если ты агент и тебе дали этот README

Задача — развернуть проект на новом сервере. Порядок:

1. Уточни у человека: домен, e-mail для TLS, желаемый пароль БД (или сгенерируй), нужно ли HTTPS.
2. Выполни раздел [Быстрый деплой через Docker](#быстрый-деплой-через-docker).
3. Обязательно выполни раздел [Ручные шаги после первого запуска](#ручные-шаги-после-первого-запуска) — без них часть функций не работает.
4. Проверь [Чек-лист приёмки](#чек-лист-приёмки).
5. **Не коммить `.env`** и не вставляй секреты в репозиторий.

Все команды ниже — для Linux-сервера (Ubuntu/Debian). Для Windows-разработки см. [Локальная разработка](#локальная-разработка).

---

## Структура репозитория

```
taskBoard/
├── backend/                  Spring Boot API
│   ├── src/main/java/...     код
│   ├── src/main/resources/
│   │   ├── application.properties
│   │   └── db/changelog/     миграции Liquibase (001…033)
│   ├── Dockerfile            multi-stage: Maven build → JRE 21
│   └── .env.example          подсказка по переменным (не подключается автоматически)
├── frontend/                 React + Vite
│   ├── src/
│   ├── nginx.conf            конфиг nginx для Docker (proxy → backend:8080)
│   ├── Dockerfile            multi-stage: npm build → nginx
│   └── .env.example          VITE_API_BASE_URL (по умолчанию /api)
├── docker-compose.yml        db + backend + frontend
├── .env.docker.example       шаблон .env для compose
├── nginx.conf                конфиг для bare-metal nginx на Windows (не для Docker)
├── DOCKER.md                 расширенная инструкция по Docker
├── RUN.md                    локальный запуск на Windows + ngrok
└── README.md                 этот файл
```

---

## Быстрый деплой через Docker

### Требования

- Linux-сервер (Ubuntu 22.04+ / Debian 12+), 2 ГБ RAM минимум (сборка Maven требует памяти)
- Docker Engine 20.10+ и Docker Compose v2
- Открытые порты: `80` (или `FRONTEND_PORT`) и `443`, если ставите HTTPS
- Доступ в интернет при первой сборке (Maven/npm зависимости)

```bash
# установка Docker (если ещё нет)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker "$USER"   # затем перелогиниться
docker --version && docker compose version
```

### Шаги

```bash
git clone https://github.com/sto1en/taskboard /opt/taskboard
cd /opt/taskboard

cp .env.docker.example .env
nano .env          # заполнить DB_PASSWORD, APP_JWT_SECRET, при необходимости FRONTEND_PORT

docker compose up -d --build
docker compose ps  # все сервисы должны быть running/healthy
docker compose logs -f   # при проблемах
```

Сайт: `http://SERVER_IP` (или `http://SERVER_IP:FRONTEND_PORT`).

Первый запуск занимает несколько минут: собираются образы backend и frontend, затем Liquibase применяет все миграции и `DataInitializerConfig` создаёт стартовые данные (статусы, MIME-типы, ачивки, аватары, рамки, скины деревьев, акценты, гайды).

### Переменные `.env`

| Переменная | Обязательна | По умолчанию | Назначение |
|---|---:|---|---|
| `POSTGRES_DB` | нет | `taskboard` | имя БД |
| `DB_USERNAME` | нет | `postgres` | пользователь PostgreSQL |
| `DB_PASSWORD` | **да** | — | пароль PostgreSQL (compose не стартует без него) |
| `APP_JWT_SECRET` | **да** | — | секрет подписи JWT, ≥ 32 байт |
| `APP_JWT_EXPIRATION_MS` | нет | `86400000` | время жизни токена (24 ч) |
| `FRONTEND_PORT` | нет | `80` | порт, который публикует nginx |

Сгенерировать JWT-секрет:

```bash
openssl rand -base64 48
```

> **Важно:** `DB_PASSWORD` из `.env` сейчас используется только контейнером `db`. Backend читает пароль из `spring.datasource.password`, а переменные `DB_USERNAME`/`DB_PASSWORD` Spring **не подхватывает**. Пока пароль равен `postgres`, всё работает. Если меняете пароль — примените патч из раздела [Известные проблемы](#известные-проблемы-и-их-решения).

---

## Ручные шаги после первого запуска

Это то, чего **нет** в репозитории и что нельзя автоматизировать текущим compose.

### 1. Назначить администратора

На чистой БД миграция `018` выполняется до регистрации пользователей, поэтому первый пользователь **не получит** `is_admin` автоматически (в `DOCKER.md` написано иначе — это неточно).

1. Зарегистрируй первого пользователя через сайт.
2. Выполни SQL:

```bash
docker compose exec db psql -U postgres -d taskboard \
  -c "UPDATE users SET is_admin = TRUE WHERE id = (SELECT MIN(id) FROM users);"
```

> Если в `.env` меняли `DB_USERNAME`, подставь его вместо `postgres`.

3. Перелогинься в UI — появится доступ к админ-разделу магазина.

### 2. Настроить публичный URL загрузок

`app.upload.base-url` по умолчанию `http://localhost:8082/uploads`. Backend отдаёт абсолютные ссылки на аватарки/вложения, а фронтенд (`resolveUrl`) не переписывает абсолютные URL. На удалённом сервере картинки будут битыми.

Добавь в `docker-compose.yml` в блок `backend.environment`:

```yaml
APP_UPLOAD_BASE_URL: /uploads
```

Либо полный публичный URL: `https://taskboard.example.com/uploads`. После изменения:

```bash
docker compose up -d backend
```

### 3. Часовой пояс (для корректных дедлайнов)

Многие расчёты (`LocalDate.now()`, планировщик просрочек, дневные цели) используют зону сервера. В контейнере по умолчанию обычно UTC — границы дня сместятся на 3 часа относительно МСК.

Добавь в `backend.environment`:

```yaml
TZ: Europe/Moscow
```

### 4. Домен и HTTPS

В репозитории нет TLS-конфига. Вариант с Caddy на хосте:

```bash
sudo apt install -y caddy
```

`/etc/caddy/Caddyfile`:

```
taskboard.example.com {
    reverse_proxy 127.0.0.1:8080
}
```

Тогда в `.env` укажи `FRONTEND_PORT=8080`, а порт 80/443 оставь Caddy. Перед этим направь A-запись домена на IP сервера. Caddy сам получит Let's Encrypt-сертификат.

Альтернатива — nginx + certbot на хосте, проксирующий на `127.0.0.1:8080`.

### 5. Бэкапы

Автоматических бэкапов в репозитории нет. Нужно сохранять:

- базу (`pgdata`);
- загруженные файлы (том `uploads`).

Пример:

```bash
# база
docker compose exec -T db pg_dump -U postgres taskboard > backup-$(date +%F).sql

# загрузки (имя тома зависит от имени каталога проекта)
docker run --rm \
  -v taskboard_uploads:/data:ro \
  -v "$PWD":/backup \
  alpine tar czf /backup/uploads-$(date +%F).tgz -C /data .
```

Поставь это в cron и проверь восстановление на тестовой БД.

### 6. Файрвол

Наружу — только `80`/`443` (или `FRONTEND_PORT`). Порты `8080` (backend) и `5432` (PostgreSQL) в compose наружу не публикуются — так и должно остаться.

---

## Чек-лист приёмки

```bash
docker compose ps
# db (healthy), backend (healthy), frontend (running)

curl -s -o /dev/null -w '%{http_code}\n' http://localhost/        # 200
curl -s -o /dev/null -w '%{http_code}\n' http://localhost/api/ping # 200/401/403 — главное, что не 502/000
```

В браузере:

1. Открывается главная, работает регистрация/вход.
2. Создаётся доска (автоматически создаётся проект `main`).
3. Создаётся задача, дедлайн, подзадача, комментарий.
4. Загружается аватар — в DevTools URL картинки **не** содержит `localhost:8082` (см. шаг 2 выше).
5. Работает календарь и шаблоны задач.
6. У первого пользователя есть админ-доступ (см. шаг 1).

---

## Известные проблемы и их решения

### Backend не подключается к БД при смене пароля

`docker-compose.yml` передаёт backend'у `DB_USERNAME`/`DB_PASSWORD`, но Spring ищет `spring.datasource.username/password`. Исправление — добавить в `backend.environment`:

```yaml
SPRING_DATASOURCE_USERNAME: ${DB_USERNAME:-postgres}
SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD}
```

### Ссылки на файлы ведут на localhost

См. [Настроить публичный URL загрузок](#2-настроить-публичный-url-загрузок).

### `UPLOAD_DIR` и `JPA_SHOW_SQL` не работают

Переменные в compose не соответствуют property-именам Spring:

| В compose | Реальное имя для Spring | Работает? |
|---|---|---|
| `SERVER_PORT` | `server.port` | да |
| `SPRING_DATASOURCE_URL` | `spring.datasource.url` | да |
| `APP_JWT_SECRET` | `app.jwt.secret` | да |
| `APP_JWT_EXPIRATION_MS` | `app.jwt.expiration-ms` | да |
| `DB_USERNAME`, `DB_PASSWORD` | `spring.datasource.*` | **нет** |
| `UPLOAD_DIR` | `APP_UPLOAD_DIR` (`app.upload.dir`) | **нет** |
| `JPA_SHOW_SQL` | `SPRING_JPA_SHOW_SQL` (`spring.jpa.show-sql`) | **нет** |

`UPLOAD_DIR` сейчас «совпадает случайно»: `WORKDIR=/app`, дефолт `uploads` → `/app/uploads`, куда и смонтирован том. `JPA_SHOW_SQL` тоже игнорируется — SQL-логи остаются включёнными (`spring.jpa.show-sql=true`). Рекомендуется:

```yaml
APP_UPLOAD_DIR: /app/uploads
SPRING_JPA_SHOW_SQL: "false"
```

### `DOCKER.md` про первого администратора

На чистой БД первый пользователь не становится админом автоматически. Используй SQL из шага 1.

### Bare-metal nginx

Корневой `nginx.conf` содержит абсолютный путь `D:/projects/...` и backend на `:8082` — он предназначен для Windows-разработки. Для Docker используется `frontend/nginx.conf`. Для Linux bare-metal скопируй `frontend/nginx.conf` и поправь `proxy_pass` на `127.0.0.1:8082`.

### Windows-скрипт `frontend-run.bat`

Содержит абсолютные пути `D:\projects\taskBoard` и `D:\utilities\nginx-1.30.4`. На другом компьютере не заработает без правки.

---

## Локальная разработка

### Требования

- JDK 21, Maven 3.9+
- Node.js 22 + npm
- PostgreSQL 16

### База

```sql
CREATE DATABASE taskboard;
```

Настройки по умолчанию — в `backend/src/main/resources/application.properties`:

```
jdbc:postgresql://localhost:5432/taskboard
username: postgres
password: postgres
```

### Backend

```bash
cd backend
mvn spring-boot:run
# API: http://localhost:8082
# health: http://localhost:8082/api/ping
```

Liquibase применит миграции автоматически. `ddl-auto=validate` — схему менять только миграциями, не через Hibernate.

### Frontend

```bash
cd frontend
npm ci
npm run dev
# http://localhost:5173
```

Vite проксирует `/api` и `/uploads` на `http://localhost:8082` (см. `vite.config.js`), поэтому CORS в dev не мешает.

### Сборка и проверки

```bash
cd frontend
npm run lint
npm run build          # dist/
npm run check:imports

cd ../backend
mvn test
mvn -DskipTests package
```

### Windows: nginx на :8081

```bat
frontend-run.bat          :: nginx + frontend\dist → http://localhost:8081
frontend-run.bat --dev    :: Vite → http://localhost:5173
```

Требует локальный nginx в `D:\utilities\nginx-1.30.4` (пути захардкожены в скрипте).

---

## Порты и сеть

| Сервис | Внутри Docker | Наружу |
|---|---|---|
| frontend (nginx) | 80 | `${FRONTEND_PORT}` (по умолчанию 80) |
| backend (Spring) | 8080 | нет |
| PostgreSQL | 5432 | нет |
| Vite (dev) | 5173 | только локально |
| backend (dev) | 8082 | только локально |

---

## Данные и миграции

- Миграции: `backend/src/main/resources/db/changelog/db.changelog-master.yaml`, changeset'ы `001`…`033`. Применяются автоматически при старте backend.
- Каталог магазина (аватары, рамки, акценты, скины деревьев, фоны профиля, категории, связи и недельный подарок) засевается changeset'ом `033-seed-shop-catalog` из `db/changelog/sql/033-shop-catalog.sql`. Скрипт идемпотентен: записи с существующим `code` не дублируются, ID берутся из sequence. На чистой БД после миграций каталог уже полный — вручную ничего заливать не нужно.
- Два изображения каталога лежат в репозитории: `frontend/public/avatars/a-8ab7b714.jpg` и `frontend/public/backgrounds/bg-2a91ef39.jpg`. Остальные аватары — в `frontend/public/avatars/`, фоны по умолчанию рисуются CSS-классами.
- Стартовые данные: `DataInitializerConfig` — создаёт записи только если соответствующая таблица пуста. Повторный запуск безопасен. Базовые акценты, статусы, MIME-типы, достижения и гайды он создаёт сам; каталог магазина уже приходит из миграции `033`.
- Если меняли каталог через админку на рабочей БД и хотите перенести изменения на другой сервер — экспортируйте таблицы магазина в новый changeset (или SQL-дамп), не полагайтесь на `DataInitializerConfig`: он не перезаписывает непустые таблицы.
- Тома Docker: `pgdata` (БД) и `uploads` (файлы). `docker compose down` их **не удаляет**; `docker compose down -v` — удаляет безвозвратно.
- Пользовательские загрузки: 5 МБ на файл, 10 МБ на запрос (nginx пропускает до 20 МБ).

### Обновление версии

```bash
cd /opt/taskboard
git pull
docker compose up -d --build
docker image prune -f   # опционально
```

Миграции применятся сами. Тома не затрагиваются.

---

## Безопасность

Перед публикацией в интернет проверь:

- [ ] `APP_JWT_SECRET` — уникальный, ≥ 32 байт (не дефолтный из `application.properties`)
- [ ] `DB_PASSWORD` — сильный, и backend реально получает его (см. патч выше)
- [ ] HTTPS включён, HTTP редиректит на HTTPS
- [ ] Наружу открыты только 80/443
- [ ] Первый пользователь назначен админом
- [ ] Настроены бэкапы БД и `uploads`
- [ ] CORS: сейчас `allowedOriginPatterns("*")` + `allowCredentials(true)` — для same-origin за nginx это не нужно; при желании ограничь доменом в `SecurityConfig`
- [ ] SQL-логи выключены (`SPRING_JPA_SHOW_SQL=false`)
- [ ] `.env` не попал в git (`/ .env` уже в `.gitignore`)

---

## Полезные команды

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
docker compose restart backend
docker compose up -d --build
docker compose exec db psql -U postgres -d taskboard
docker compose down          # остановить, данные сохранить
docker compose down -v       # ОПАСНО: удалить БД и загрузки
```

---

## Что уже есть в репозитории

- Dockerfile'ы backend и frontend (multi-stage, без установки Java/Node на сервер)
- `docker-compose.yml` с healthcheck'ами и томами
- nginx-конфиг для Docker: SPA-fallback, gzip, кэш `/assets`, proxy `/api` и `/uploads`
- Все миграции Liquibase и стартовые данные
- `.env.docker.example`
- `DOCKER.md` — расширенный гайд по Docker
- `RUN.md` — локальный запуск на Windows и ngrok
