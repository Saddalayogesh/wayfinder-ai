<div align="center">

# 🧭 Wayfinder AI

**Personalized, AI-crafted itineraries — from a passing thought to a fully planned adventure.**

[![Build Status](https://img.shields.io/badge/CI-GitHub%20Actions-2088FF.svg)](.github/workflows/ci-cd.yml)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Java](https://img.shields.io/badge/Java-21-orange.svg)](#-tech-stack)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5-green.svg)](#-tech-stack)
[![Node](https://img.shields.io/badge/Node-22-green.svg)](#-tech-stack)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](#-tech-stack)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6.svg)](#-tech-stack)

**[Overview](#-overview) · [Features](#-features) · [Screenshots](#-screenshots) · [Tech Stack](#-tech-stack) · [Architecture](#-architecture) · [Getting Started](#-getting-started) · [API Docs](#-api-documentation) · [Testing](#-testing) · [Deployment](#-deployment) · [Contributing](#-contributing) · [License](#-license)**

</div>

---

## 📖 Overview

**Wayfinder AI** is a production-style, **monolithic full-stack travel planner**: a Spring Boot 3 backend serves a React SPA as static resources, so the entire product ships as **one JAR, one container, one port** — no separate frontend server to operate.

Tell Wayfinder AI where you want to go and what you love to do, and it designs a **day-by-day itinerary with Google Gemini**, plots every place on an **interactive map**, tracks your **budget in real time**, and lets you **share or export** any trip as a PDF.

| | |
|---|---|
| 🔐 **Auth** | JWT sign-up/sign-in with roles and per-user ownership |
| 🤖 **AI** | Full itinerary generation + per-day regeneration (Gemini) |
| 🗺️ **Maps** | Leaflet with day-colored pins & highlighted list sync |
| 💰 **Budget** | Estimated vs. planned spend with category breakdown |
| 🔗 **Sharing** | Public read-only trip links (token-based, no sign-in) |
| 📄 **Export** | Printable day-by-day PDF itinerary (OpenPDF) |

---

## ✨ Features

### Core product

- **JWT authentication** — register/sign in, BCrypt-hashed passwords, stateless `USER` / `ADMIN` roles, protected endpoints with a strict cross-user ownership model (403 on foreign resources).
- **AI itineraries (Gemini)** — describe destination, dates, travelers, budget, travel style and interests; get a structured day-by-day plan with activities, costs, coordinates and visit durations. Regenerate **any single day** independently with free-form instructions.
- **Trip CRUD** — trips, days and itinerary items with validated payloads, and full ownership enforcement throughout.
- **Interactive maps** — Leaflet + CARTO dark tiles, custom day-colored markers and surface-styled popups; clicking a marker highlights the matching list entry (and vice versa).
- **Places enrichment** — provider-pluggable search: **OpenStreetMap Nominatim** (free, default) or **Google Places** (optional key). Results are cached (Redis or in-memory) for 24h.
- **Budget tracking** — estimated total vs. budget with a per-category breakdown, recomputed live after any edit or regeneration.
- **Trip sharing** — public read-only links via random, non-guessable 48-hex-char tokens.
- **PDF export** — printable itinerary via OpenPDF.
- **Favorites & profiles** — save places across trips; update display name and password.

### Product & UX

- **Premium design system** — boutique dark palette (`#070B17` background, `#8B5CF6` primary, `#22D3EE` accent), Fraunces serif + Plus Jakarta Sans typography, gradient-border panels, custom calendar date-picker, animated interest chips, and hover/focus states on every control.
- **Live trip preview** — the planner page shows a destination photo and a running summary (dates, travelers, budget) that update as you type.
- **Fully responsive** — 375 px → 1440 px+; 45/55 split auth screens, horizontally scrolling destination-inspiration rail, sticky summary panel on the planner page.
- **Brand identity** — custom Wayfinder AI compass mark across the navbar, footer, auth screens, and favicon.

---

## 📸 Screenshots

> **TODO** — replace with real captures before publishing. Suggested set:

| View | What to capture |
| --- | --- |
| **Home** | Hero, destination-inspiration rail, "How it works" |
| **Plan a trip** | Form + live destination preview + running summary |
| **Trip details** | Cover banner, budget metrics, map, day-by-day itinerary |
| **Auth** | Login split-screen with the photo panel |

---

## 🧰 Tech Stack

| Layer | Technology |
| --- | --- |
| **Backend** | Java 21 · Spring Boot 3.5 · Spring Security + JJWT 0.12 · Spring Data JPA · MySQL · springdoc-openapi |
| **AI** | Google Gemini (Generative Language API) with defensive JSON parsing |
| **Frontend** | React 18 · TypeScript 5.6 · Vite · Tailwind CSS · React Router v6 · Axios · Leaflet · Lucide |
| **Caching** | Spring Cache — Redis (`CACHE_TYPE=redis`) or in-memory (`simple`) |
| **Maps** | Leaflet + CARTO dark tiles · custom markers & styled popups |
| **PDF** | OpenPDF 3.x (LGPL/MPL fork of iText) |
| **Build** | Maven `frontend-maven-plugin` (SPA embedded into the JAR) |
| **DevOps** | Multi-stage Dockerfile · docker-compose · GitHub Actions · GHCR |
| **Testing** | JUnit 5 · Mockito · MockMvc · H2 · JaCoCo · Vitest · React Testing Library |

---

## 🏗️ Architecture

A deliberate **monolith**: the React build is embedded in the Spring Boot JAR under `BOOT-INF/classes/static` and served by Spring Boot's static-resource handling. A `WebConfig` SPA fallback forwards every non-API, non-static path to `index.html`, so deep links like `/trips/7` survive hard refreshes.

```text
┌────────────────────────────────────────────────────────────────────┐
│                           One container                             │
│                                                                     │
│   Browser ──▶ React SPA (embedded) ──▶ REST /api/* ──▶ Spring Boot  │
│                                                         │           │
│                                   ┌─────────────────────┼─────────┐ │
│                                   ▼                     ▼         ▼ │
│                               MySQL (JPA)           Redis      Gemini│
│                             docker-compose        (optional)   Places│
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

**Key design decisions**

- **No separate frontend container** — one deployable unit reduces the ops surface to a single image.
- **Provider pluggability** — `places.provider=osm|google` switches providers at runtime; the app is fully functional with **zero paid keys**.
- **Cache discipline** — only *place enrichment* data is cached (24h TTL), never user trips; empty search results are deliberately not cached so a provider outage can't poison the cache.
- **Defensive AI parsing** — malformed Gemini responses are salvaged rather than failing the request; budgets are recomputed server-side.
- **Rate limiting** — token-bucket limits protect AI generation per user.

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| Docker + Compose | ≥ 2.x | **Recommended** path — nothing else needed |
| JDK | 21+ | Local dev only |
| Maven | 3.9+ | Local dev only |
| Node.js | 22+ | Local dev only |

> ⚠️ **AI requires `GEMINI_API_KEY`** (get one at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)). Everything else — accounts, trips, maps, places, sharing, PDF — works without it.

### Option A — Docker (recommended)

```bash
cp .env.example .env      # set GEMINI_API_KEY inside
docker compose up --build
```

Open **http://localhost:8080**. Compose brings up MySQL, Redis, and the single app container.

### Option B — Local development

```bash
# Terminal 1 — backend API on http://localhost:8080
cd backend && mvn spring-boot:run

# Terminal 2 — frontend dev server on http://localhost:5173
cd frontend && npm install && npm run dev
```

The Vite dev server proxies `/api/*` to the backend. The MySQL schema is created automatically (`createDatabaseIfNotExist=true`).

### Useful scripts

**Frontend** (`frontend/`)

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with HMR + `/api` proxy |
| `npm test` | Vitest + React Testing Library (24 tests) |
| `npm run typecheck` | `tsc --noEmit` strict check |
| `npm run build` | typecheck + production build to `dist/` |

**Backend** (`backend/`)

| Command | What it does |
| --- | --- |
| `mvn spring-boot:run` | Run the API on :8080 |
| `mvn test` | Full JUnit 5 + MockMvc suite (22 test classes, H2) |
| `mvn package` | Build the runnable JAR with the SPA embedded |

### Environment variables

<details>
<summary>Full configuration reference (click to expand)</summary>

All values are environment-overridable — see `backend/src/main/resources/application.yml` and `.env.example`.

| Variable | Default | Description |
| --- | --- | --- |
| `GEMINI_API_KEY` | — | **Required for AI.** Never hardcode. |
| `GEMINI_MODEL` | `gemini-flash-latest` | Always resolves to the newest Flash model |
| `GEMINI_BASE_URL` | `https://generativelanguage.googleapis.com` | API base |
| `GEMINI_TIMEOUT_MS` | `60000` | AI request timeout |
| `DB_URL` | `jdbc:mysql://localhost:3306/wayfinder_ai…` | JDBC URL (compose overrides) |
| `DB_USERNAME` / `DB_PASSWORD` | `root` / dev default | MySQL credentials |
| `MYSQL_DATABASE` | `wayfinder_ai` | Compose database name |
| `MYSQL_USER` / `MYSQL_PASSWORD` / `MYSQL_ROOT_PASSWORD` | `tripapp` / `tripapp` / `root` | Compose MySQL users |
| `REDIS_HOST` / `REDIS_PORT` | `localhost` / `6379` | Redis connection |
| `CACHE_TYPE` | `simple` | `simple` (in-memory) or `redis` |
| `JWT_SECRET` | dev-only default | **Set a long random value in production** |
| `JWT_EXPIRATION_MS` | `86400000` | Token lifetime (24h) |
| `PLACES_PROVIDER` | `osm` | `osm` (free) or `google` |
| `GOOGLE_PLACES_API_KEY` | — | Required only for `google` provider |
| `GOOGLE_PLACES_BASE_URL` | `https://places.googleapis.com` | Google Places API base |
| `NOMINATIM_BASE_URL` | `https://nominatim.openstreetmap.org` | OSM geocoding base |
| `NOMINATIM_USER_AGENT` | `Wayfinder-AI/0.1` | OSM policy-compliant UA |

</details>

---

## 📁 Project Structure

```text
.
├── backend/                          # Spring Boot application
│   ├── pom.xml                       # builds backend AND embeds the SPA
│   └── src/main/java/com/tripplanner/
│       ├── auth/  security/  user/   # JWT auth, filter chain, roles, profiles
│       ├── trip/                     # trips, days, items, sharing, PDF endpoint
│       ├── ai/                       # Gemini client, prompt builder, JSON parsing
│       ├── places/  favorite/        # place providers (OSM/Google), favorites
│       ├── cache/  admin/            # logging cache manager, admin eviction
│       ├── config/  common/          # OpenAPI, SPA fallback, health, rate limit
│       └── exception/                # consistent {status, message, timestamp} errors
├── frontend/                         # React SPA (Vite)
│   └── src/
│       ├── pages/                    # Home, Login, CreateTrip, MyTrips, TripDetails, …
│       ├── components/               # Navbar, Footer, MapView, TripForm, common/
│       ├── context/  hooks/  utils/  # AuthContext, destinationImage, cn, …
│       └── services/                 # typed API clients (axios)
├── Dockerfile                        # multi-stage: node → maven → slim JRE
├── docker-compose.yml                # mysql + redis + one app container
├── .env.example                      # copy to .env, fill in values
└── .github/workflows/ci-cd.yml       # test → package → docker image → GHCR
```

---

## 📡 API Documentation

The API is fully annotated with springdoc + OpenAPI (`@Tag`, `@Operation`, `@Schema` examples, JWT `bearerAuth` scheme). Docs are **public**:

| Resource | URL |
| --- | --- |
| Swagger UI | http://localhost:8080/swagger-ui.html |
| OpenAPI JSON | http://localhost:8080/v3/api-docs |

All protected routes require `Authorization: Bearer <token>`. Every error uses one envelope — `{ "status": 400, "message": "…", "timestamp": "…" }` — across 400/401/403/404/409/500/503.

<details>
<summary>Full endpoint reference (click to expand)</summary>

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/health` | — | Liveness check (`UP`/`DOWN`) |
| `POST` | `/api/auth/register` | — | Create an account |
| `POST` | `/api/auth/login` | — | Sign in → JWT + user |
| `GET` | `/api/users/me` | JWT | Current user profile |
| `PUT` | `/api/users/me` | JWT | Update name and/or password |
| `GET` | `/api/users` | ADMIN | List all users |
| `POST` | `/api/trips/generate` | JWT | Generate a full AI itinerary (Gemini) |
| `POST` | `/api/trips` | JWT | Create a trip (draft) |
| `GET` | `/api/trips` | JWT | List my trips |
| `GET` | `/api/trips/{tripId}` | JWT | Get one trip (403 if another user's) |
| `PUT` | `/api/trips/{tripId}` | JWT | Update trip + days/items |
| `DELETE` | `/api/trips/{tripId}` | JWT | Delete a trip and its itinerary |
| `GET` | `/api/trips/{tripId}/export/pdf` | JWT | Download the itinerary as PDF |
| `POST` | `/api/trips/{tripId}/days` | JWT | Add a day |
| `POST` | `/api/trips/{tripId}/days/{dayId}/items` | JWT | Add an item to a day |
| `DELETE` | `/api/trips/{tripId}/days/{dayId}` | JWT | Delete a day |
| `DELETE` | `/api/trips/{tripId}/days/{dayId}/items/{itemId}` | JWT | Delete an item |
| `POST` | `/api/trips/{tripId}/days/{dayNumber}/regenerate` | JWT | Re-plan one day with Gemini |
| `POST` | `/api/trips/{tripId}/share` | JWT | Create a public share link |
| `GET` | `/api/shared/trips/{token}` | — | View a shared trip (read-only) |
| `GET` | `/api/places/search?q=…&limit=…` | JWT | Search places via the active provider |
| `GET` | `/api/places/{placeId}` | JWT | Place details |
| `GET` | `/api/places/{placeId}/photo?maxWidthPx=400` | — | Proxy a place's photo (keys stay server-side) |
| `POST` | `/api/favorites` | JWT | Save a place |
| `GET` | `/api/favorites` | JWT | List my favorites |
| `DELETE` | `/api/favorites/{favoriteId}` | JWT | Remove a favorite |
| `DELETE` | `/api/admin/cache/places` | ADMIN | Evict the places cache |

</details>

---

## 🧪 Testing

```bash
# Backend — 22 test classes (JUnit 5 + Mockito + MockMvc, in-memory H2)
cd backend && mvn test

# Frontend — 7 test files / 24 tests (Vitest + React Testing Library)
cd frontend && npm test
```

**Coverage highlights**

- Backend: auth flow, trip ownership (403), AI parsing, places provider fallback, cache behavior, cost breakdown, PDF generation, share tokens, rate limiting, and an OpenAPI smoke test that guards the Swagger document.
- Frontend: `AuthContext`, `ProtectedRoute`, `TripForm` validation, `DatePicker`, `TripCover`, `Button`, `destinationImage`.

Reports: JaCoCo → `backend/target/site/jacoco/index.html`.

---

## 🚢 Deployment

### CI/CD pipeline

`.github/workflows/ci-cd.yml` runs on push/PR to `main` and `develop` (stale runs auto-cancel):

1. Backend tests — `mvn -B test` (JDK 21, Temurin)
2. Frontend tests — `npm ci && npm test` (Node 22)
3. Frontend typecheck + production build — `tsc` + Vite
4. JAR packaging with the SPA embedded
5. `docker compose config` validation
6. Docker image build (multi-stage: node → maven → JRE)
7. On `main` only — push image to **GHCR** (`latest` + commit SHA)

### Production JAR

```bash
cd backend && mvn package
java -jar backend/target/wayfinder-ai-0.0.1-SNAPSHOT.jar
```

---

## 🤝 Contributing

Contributions are welcome! Here's how to get involved:

1. **Fork** the repository and create a branch: `feat/my-feature` or `fix/my-bug`.
2. **Follow conventional commits** — `feat:`, `fix:`, `test:`, `docs:`, `refactor:`, `chore:`.
3. **Make your change** and keep the diff focused.
4. **Add or update tests** — new logic ships with tests (frontend: Vitest; backend: JUnit 5).
5. **Validate locally** before opening the PR:
   ```bash
   cd frontend && npm run typecheck && npm test
   cd backend  && mvn test
   ```
6. Open a pull request against `main` — the CI pipeline runs automatically.

**Code style** — TypeScript/React follows the project's Prettier + Tailwind conventions; Java follows standard Spring Boot formatting. Keep API changes documented in the OpenAPI annotations and this README.

---

## 📜 Changelog

<details>
<summary>Phase history (click to expand)</summary>

| Phase | What shipped |
| --- | --- |
| 01 | Monolith foundation — SPA + API in one JAR |
| 02 | JWT authentication, roles, profiles |
| 03 | Trip planning, places, favorites, interactive maps |
| 04 | AI itinerary generation + day regeneration + budget breakdown |
| 05 | Sharing, PDF export, error consistency, Swagger polish |
| 06 | Containerization, CI/CD, README |
| 07 | Redis caching for places |
| 08 | Frontend polish — premium dark design system |
| 09 | Comprehensive backend & frontend test suites |
| 10 | Sharing, PDF export, Docker and CI/CD hardening |

</details>

---

## 🛡️ Security

- Passwords hashed with **BCrypt**; override `JWT_SECRET` with a long random value in production.
- Trip/day/item endpoints enforce **per-user ownership** — cross-user access returns **403**, never data leakage.
- AI prompt inputs are **sanitized** to reduce prompt-injection risk.
- The Nominatim provider respects OSM's user-agent policy.
- Per-user **rate limiting** guards AI generation endpoints.

To report a vulnerability, please **open a private issue** rather than a public one.

---

## ❓ FAQ

<details>
<summary>Does the app work without a Gemini API key?</summary>
Yes. Everything except AI itinerary generation works: accounts, trips, maps, places, sharing, PDF export.
</details>

<details>
<summary>Why MySQL on port 3307 in docker-compose?</summary>
The compose file maps the host's `3307` to the container's `3306` to avoid clashing with a locally installed MySQL on the default port.
</details>

<details>
<summary>How are place photos served without leaking API keys?</summary>
The backend proxies photo bytes through `/api/places/{id}/photo`; provider keys never reach the browser.
</details>

<details>
<summary>Where does the SPA live at runtime?</summary>
Inside the JAR under `BOOT-INF/classes/static`. There is no separate frontend server.
</details>

---

## 📄 License

Released under the **MIT License** — see [LICENSE](LICENSE). Copyright © 2026 **Saddala Yogesh**.

<div align="center">

**Made for travelers · planned by AI** — 🧭 Wayfinder AI

</div>
