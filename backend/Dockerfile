# syntax=docker/dockerfile:1

# ============================================================
#  Backend — Spring Boot (Java 21, Maven)
#  Многоступенчатая сборка: тяжёлые build-образы не попадают
#  в финальный рантайм-слой.
# ============================================================

# ------------------------------------------------------------
# 1. Сборка jar
# ------------------------------------------------------------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build

# Сначала только pom.xml — слой с зависимостями кэшируется между сборками.
COPY pom.xml ./
RUN --mount=type=cache,target=/root/.m2 mvn -B -q dependency:go-offline

# Теперь исходники и сама сборка (тесты в образе не гоняем).
COPY src ./src
RUN --mount=type=cache,target=/root/.m2 mvn -B -q clean package -DskipTests

# ------------------------------------------------------------
# 2. Рантайм
# ------------------------------------------------------------
FROM eclipse-temurin:21-jre AS runtime

# curl нужен для healthcheck в docker-compose.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Непривилегированный пользователь: не работаем под root.
RUN groupadd --system --gid 1001 app \
    && useradd  --system --uid 1001 --gid app --create-home app

WORKDIR /app

COPY --from=build /build/target/*.jar app.jar

# Каталог загрузок. На проде это том (см. docker-compose.yml), поэтому
# сразу отдаём его пользователю app, чтобы том монтировался с нужными правами.
RUN mkdir -p /app/uploads && chown -R app:app /app

USER app

EXPOSE 8080

# Наружу слушаем 8080 (внутри контейнера), локально приложение по-прежнему
# умеет 8082 — порт задаётся переменной SERVER_PORT.
ENV SERVER_PORT=8080
ENV UPLOAD_DIR=/app/uploads

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
