# ✈️ AI Trip Planner

A **monolithic** full-stack application: Spring Boot serves a React SPA build as
static resources. One JAR, one deployment, **no separate frontend server in
production**.

```
┌─────────────────────────────┐
│         Single JAR          │
│  ┌───────────────────────┐  │
│  │  Spring Boot (Java)   │  │
│  │  REST API  /api/*     │  │
│  └──────────┬────────────┘  │
│             │ serves        │
│  ┌──────────▼────────────┐  │
│  │  React SPA (static)   │  │
│  │  /, /login, /register │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
        http://localhost:8080
```

## Tech stack

| Layer    | Technology                                                              |
| -------- | ----------------------------------------------------------------------- |
| Backend  | Java 25, Spring Boot 3.5, Spring Data JPA, MySQL, Lombok, springdoc      |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router v6, Axios      |
| Build    | Maven — `frontend-maven-plugin` builds the SPA and packages it into the JAR |

## Project structure

```
├── backend/                  # Spring Boot application
│   ├── pom.xml               # Maven build (also builds the frontend)
│   └── src/main/java/com/tripplanner/
│       ├── config/           # WebConfig (SPA fallback), OpenApiConfig (Swagger)
│       ├── common/           # HealthController (/api/health)
│       ├── auth/             # placeholder — next phase
│       ├── user/             # placeholder — next phase
│       ├── trip/             # placeholder — next phase
│       ├── ai/               # placeholder — next phase
│       ├── places/           # placeholder — next phase
│       ├── favorite/         # placeholder — next phase
│       ├── security/         # placeholder — next phase
│       └── exception/        # placeholder — next phase
├── frontend/                 # React SPA (Vite)
│   └── src/
│       ├── pages/            # Home, Login, Register
│       ├── components/       # Navbar
│       ├── services/         # api.ts — typed Axios instance (baseURL "/api")
│       ├── hooks/            # (empty, ready for custom hooks)
│       ├── context/          # (empty, ready for contexts)
│       └── utils/            # (empty, ready for helpers)
└── README.md
```

## Prerequisites

- **JDK 25** — for local development (no Docker needed)
- **Maven 3.9+** — for building services locally
- **Node.js 22+** — for frontend development (only needed if you run the frontend dev server yourself; `mvn package` downloads its own pinned Node v22)

## Local development (frontend dev server + backend, separately)

In two terminals:

```bash
# Terminal 1 — backend on http://localhost:8080
cd backend
mvn spring-boot:run

# Terminal 2 — frontend dev server on http://localhost:5173
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. The Vite dev server proxies every `/api/*` call
to `http://localhost:8080` (see `frontend/vite.config.js`), so the frontend and
backend talk to each other with no CORS configuration needed.

Backend API while developing:

- `GET http://localhost:8080/api/health` → `{"status":"UP"}`
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

## Production build — one runnable JAR

```bash
cd backend
mvn package
```

What happens:

1. `frontend-maven-plugin` installs a pinned Node.js (into `backend/target/node`),
   runs `npm install` and `npm run build` in `frontend/`.
2. `maven-resources-plugin` copies `frontend/dist/` into
   `backend/target/classes/static` (it never touches `src/`).
3. Spring Boot repackages everything into a single executable JAR.

Run it:

```bash
java -jar backend/target/ai-trip-planner-0.0.1-SNAPSHOT.jar
```

Then open **http://localhost:8080** — the React app *and* the API are served by
the same process and port.

### How the SPA fallback works

`WebConfig` forwards any path that is **not** an API call and **not** a real
static file to `index.html`:

- `/login` refreshed directly → React Router takes over → login page. ✅
- `/assets/app-abc123.js` → served by the static resource handler. ✅
- `/api/health` → handled by the `HealthController` (controllers take precedence). ✅

## Database (MySQL)

MySQL is **not** required to boot the app — entities arrive in a later phase.
The JAR starts cleanly with no database running: `application.yml` excludes the
JDBC/JPA auto-configurations (needed because Spring Boot 3.5 auto-configures a
Hikari DataSource when `mysql-connector-j` is on the classpath).

When you're ready, in `backend/src/main/resources/application.yml`:

1. **Delete** the `spring.autoconfigure.exclude` block at the top.
2. **Uncomment** the `spring.datasource` / `spring.jpa` block.
3. Start MySQL.

All values can be overridden with environment variables:

| Variable      | Default                                                              |
| ------------- | -------------------------------------------------------------------- |
| `DB_URL`      | `jdbc:mysql://localhost:3306/ai_trip_planner?...`                    |
| `DB_USERNAME` | `root`                                                               |
| `DB_PASSWORD` | `root`                                                               |

## Roadmap

- [x] Phase 1 — monolith foundation: SPA + API in one JAR
- [ ] Phase 2 — JWT authentication (`auth`, `security`, `user` packages)
- [ ] Phase 3 — trip planning with a database (`trip`, `places`, `favorite`)
- [ ] Phase 4 — AI itinerary generation (`ai` package)
