# ✈️ AI Trip Planner

A **monolithic** full-stack trip planner: Spring Boot serves a React SPA build as
static resources. **One JAR, one container, one port** — no separate frontend
server in production.

```
┌─────────────────────────────────┐
│       One container / JAR       │
│  ┌───────────────────────────┐  │
│  │  Spring Boot (Java 21)    │  │
│  │  REST API  /api/*         │  │
│  │  JWT auth · AI · sharing  │  │
│  │  PDF export · caching     │  │
│  └───────────┬───────────────┘  │
│              │ serves           │
│  ┌───────────▼───────────────┐  │
│  │  React SPA (static)       │  │
│  │  /, /login, /trips, ...   │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
        http://localhost:8080
```

## Features

- **JWT authentication** — register / login, BCrypt, stateless sessions, `USER`/`ADMIN` roles
- **Trip planning** — structured CRUD for trips, days, and itinerary items; ownership enforced (403 cross-user)
- **AI itineraries** — Gemini generates day-by-day plans with activities, costs, and coordinates; per-day regeneration
- **Interactive maps** — Leaflet + OpenStreetMap, markers ↔ list highlighting
- **Places enrichment** — provider-pluggable (Google Places *or* free OpenStreetMap Nominatim), Redis/in-memory cached
- **Budget tracking** — estimated total vs budget with a category breakdown
- **Trip sharing** — public read-only links via random tokens (no sign-in needed)
- **PDF export** — printable day-by-day itinerary (OpenPDF)
- **Favorites & profiles** — saved places, name/password management

## Tech stack

| Layer    | Technology                                                                 |
| -------- | -------------------------------------------------------------------------- |
| Backend  | Java 21, Spring Boot 3.5, Spring Security + JWT, Spring Data JPA, MySQL, springdoc |
| AI       | Google Gemini (Generative Language API), defensive JSON parsing            |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router v6, Axios, Leaflet  |
| Caching  | Spring Cache — Redis (`CACHE_TYPE=redis`) or in-memory (`simple`)          |
| Build    | Maven — `frontend-maven-plugin` builds the SPA and embeds it into the JAR  |
| DevOps   | Multi-stage Dockerfile, docker-compose (mysql + redis + app), GitHub Actions |

## Project structure

```
├── backend/                        # Spring Boot application
│   ├── pom.xml                     # builds backend AND embeds the SPA
│   └── src/main/java/com/tripplanner/
│       ├── auth/  security/  user/ # JWT auth, filter chain, profiles
│       ├── trip/                   # trips, days, items, sharing, PDF endpoint
│       ├── ai/                     # Gemini client + prompt building + parsing
│       ├── places/  favorite/      # place providers (OSM/Google), favorites
│       ├── cache/  admin/          # hit/miss-logging cache manager, admin eviction
│       ├── config/  common/        # Swagger/OpenAPI, SPA fallback, health
│       └── exception/              # consistent {status, message, timestamp} errors
├── frontend/                       # React SPA (Vite)
│   └── src/
│       ├── pages/                  # Home, Login, MyTrips, TripDetails, SharedTrip, …
│       ├── components/             # Navbar, MapView, common/ (Button, Modal, …)
│       └── services/               # typed API clients (axios)
├── Dockerfile                      # multi-stage: node → maven → slim JRE
├── docker-compose.yml              # mysql + redis + one app container
└── .github/workflows/ci-cd.yml     # test → package → docker image → GHCR
```

## Quick start (Docker — the supported way)

```bash
cp .env.example .env        # then set GEMINI_API_KEY in .env
docker compose up --build
```

That's it — MySQL, Redis, and the single app container come up, and the full
product is at **http://localhost:8080**. (Build takes a few minutes the first
time while it pulls the base images and Maven dependencies.)

## Local development (no Docker)

Prerequisites: **JDK 21+**, **Maven 3.9+**, **Node.js 22+**, and a running MySQL
(database created automatically via `createDatabaseIfNotExist=true`).

```bash
# Terminal 1 — backend on http://localhost:8080
cd backend
mvn spring-boot:run

# Terminal 2 — frontend dev server on http://localhost:5173
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** — the Vite dev server proxies `/api/*` to the
backend. Environment variables are read from the environment / a `.env` file
(`GEMINI_API_KEY` is required for AI generation; without it everything else works).

## Production build — one runnable JAR

```bash
cd backend
mvn package
```

1. `frontend-maven-plugin` installs pinned Node, runs `npm install && npm run build` in `frontend/`.
2. `maven-resources-plugin` copies `frontend/dist/` into `target/classes/static`.
3. Spring Boot repackages everything into one executable JAR.

```bash
java -jar backend/target/ai-trip-planner-0.0.1-SNAPSHOT.jar
```

The SPA fallback (`WebConfig`) forwards any non-API, non-static path to
`index.html`, so deep links like `/trips/7` work when refreshed directly.

## Configuration

All values are env-overridable (see `backend/src/main/resources/application.yml`):

| Variable              | Default / notes                                            |
| --------------------- | ---------------------------------------------------------- |
| `GEMINI_API_KEY`      | **required for AI** — never hardcoded                      |
| `DB_URL` / `DB_USERNAME` / `DB_PASSWORD` | MySQL connection (compose sets these)      |
| `REDIS_HOST` / `REDIS_PORT` / `CACHE_TYPE` | `localhost` / `6379` / `simple`         |
| `JWT_SECRET`          | long random value in production                            |
| `PLACES_PROVIDER`     | `osm` (free, default) or `google` (+ `GOOGLE_PLACES_API_KEY`) |

## API documentation (Swagger)

With the app running:

- Swagger UI: **http://localhost:8080/swagger-ui.html**
- OpenAPI JSON: **http://localhost:8080/v3/api-docs**

Endpoints are grouped by tag — **Auth, Trips, AI, Places, Favorites, Sharing,
Users, Admin**. Click **Authorize** and paste the JWT from
`POST /api/auth/login`. Errors always use the same envelope:
`{ "status": 400, "message": "…", "timestamp": "…" }` across
400/401/403/404/409/500/503.

## Testing

```bash
cd backend && mvn test        # 110+ tests: JUnit 5 + Mockito + MockMvc (in-memory H2)
cd frontend && npm test       # Vitest + React Testing Library
```

Coverage (JaCoCo) report: `backend/target/site/jacoco/index.html`.

## Screenshots

> _Placeholder — add screenshots of the home page, a generated itinerary with
> map + budget panel, and the shared-trip view._

## Résumé bullets

- Built a **monolithic full-stack product** — Spring Boot + React SPA in one
  JAR, one Docker image, one container — reducing ops surface to a single
  deployable unit.
- Implemented **JWT auth, AI itinerary generation (Gemini), day-level AI
  regeneration, interactive Leaflet maps, Redis caching, PDF export, and
  public trip sharing** with strict per-user ownership (403) throughout.
- Hardened reliability: **consistent error envelope** (400–503), graceful
  provider fallback (free OSM geocoding when no paid key), prompt-injection
  sanitization, rate limiting, and defensive AI response parsing.
- Shipped **CI/CD** (GitHub Actions: tests → JAR → image → GHCR) and a
  **zero-manual-setup docker-compose stack** (MySQL + Redis + app), with a
  112-test backend suite at **~80% instruction coverage**.

## Roadmap

- [x] Phase 1 — monolith foundation: SPA + API in one JAR
- [x] Phase 2 — JWT authentication, roles, profiles
- [x] Phase 3 — trip planning, places, favorites, interactive maps
- [x] Phase 4 — AI itinerary generation + day regeneration + budget breakdown
- [x] Phase 5 — sharing, PDF export, error consistency, Swagger polish
- [x] Phase 6 — containerization, CI/CD, README
