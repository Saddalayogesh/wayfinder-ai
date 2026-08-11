# Wayfinder AI — single monolithic image.
#
# One build produces ONE image with ONE container that serves both the React
# SPA and the Spring Boot REST API on port 8080. There is deliberately no
# separate frontend container.
#
#   Stage 1  node    -> builds the React SPA (frontend/dist)
#   Stage 2  maven   -> builds the Spring Boot JAR with the SPA embedded
#   Stage 3  JRE     -> slim runtime that runs the JAR

# ---------- Stage 1: build the React SPA -------------------------------------
FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend
# Prefer the committed lockfile for reproducible builds; fall back to a plain
# install if it is absent.
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci || npm install
COPY frontend/ ./
RUN npm run build

# ---------- Stage 2: build the Spring Boot JAR -------------------------------
FROM maven:3.9-eclipse-temurin-21 AS backend-build
WORKDIR /workspace
COPY backend/pom.xml backend/pom.xml
COPY backend/src backend/src
# The built SPA lands exactly where the pom already expects it (../frontend/dist),
# so the existing maven-resources-plugin step embeds it into the JAR untouched.
COPY --from=frontend-build /app/frontend/dist frontend/dist
# The SPA is already built in stage 1 — skip every frontend-maven-plugin goal
# (-Dskip.installnodenpm/-Dskip.npm/-Dskip.npx) so npm never runs inside the
# Maven image. -Dmaven.test.skip=true: tests run in CI, not here (and
# backend/src/test is excluded from the build context).
RUN cd backend && mvn -B package -Dmaven.test.skip=true \
    -Dskip.installnodenpm=true -Dskip.npm=true -Dskip.npx=true

# ---------- Stage 3: slim runtime --------------------------------------------
FROM eclipse-temurin:21-jre-jammy AS runtime
WORKDIR /app
# Install curl for the container healthcheck — the base JRE image ships no
# HTTP client tool (neither curl nor wget), so add it explicitly.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
# Run as a non-root user.
RUN groupadd --system app && useradd --system --gid app app
COPY --from=backend-build --chown=app:app /workspace/backend/target/wayfinder-ai-0.0.1-SNAPSHOT.jar app.jar
USER app
EXPOSE 8080
ENV JAVA_OPTS=""
# Report the container healthy once the Spring Boot API answers on the public
# /api/health probe (permitAll in SecurityConfig). Keep in sync with the
# healthcheck defined for the 'app' service in docker-compose.yml.
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=5 \
  CMD curl -fsS http://localhost:8080/api/health || exit 1
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
