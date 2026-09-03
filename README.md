# PerfectDay

A modern personal productivity and to-do application: Apple-inspired glassmorphism UI, REST API, and PostgreSQL. Inspired by Microsoft To Do and Google Tasks — not a copy of either.

**Status:** **Phase 8A Complete** — Authentication Enhancements: Real Remember Me & Server-Side Session Management (DB-backed refresh tokens, rotating session cookies, silent auto-refresh).

---

## Highlights of Phase 8A
- **Real Remember Me**: Enabled "Remember me" control in login UI. Unchecked uses normal short-lived session cookie; checked creates a 30-day persistent session.
- **Server-Side Session Architecture**: Refresh tokens are cryptographically random 48-byte hex values stored in HTTP-only `pd_refresh` cookies, backed by bcrypt hashes in the `Session` PostgreSQL table (raw tokens are never stored in DB).
- **Session Rotation**: Calling `POST /api/auth/refresh` invalidates the previous session (`revokedAt`) and creates a new rotated session atomically.
- **Silent Auto-Refresh**: If an access token (`pd_auth`) expires, backend `requireAuth` middleware automatically validates and rotates `pd_refresh` to issue a new access cookie transparently without prompting the user.
- **Logout Revocation**: Logging out revokes active session records in PostgreSQL and clears both `pd_auth` and `pd_refresh` cookies.
- **True Fixed App Chrome**: Left navigation rail, workspace header, and bottom Add Task composer remain strictly fixed to their respective viewport anchors during deep vertical or horizontal scrolling.
- **Apple-Inspired Glassmorphism**: Translucent frosted surfaces with layered depth, high-contrast readable typography, subtle borders, and warm amber accents.

---

## Stack

- **Frontend:** HTML5, CSS3 Custom Properties, Vanilla JavaScript (ES Modules), Vite, Lucide Icons
- **Backend:** Node.js, Express 5, REST (`/api`), Zod Validation
- **Data:** PostgreSQL, Prisma ORM
- **Auth:** JWT (HTTP-only secure cookies `pd_auth`), Refresh Tokens (`pd_refresh`), bcrypt session hashing

The browser communicates exclusively with the REST API. The API communicates with the database.

---

## Setup & Running

### Prerequisites
- Node.js >= 20.x
- PostgreSQL database running locally or remotely

### Backend Setup
```bash
cd server
npm install
cp .env.example .env # Configure DATABASE_URL and JWT_SECRET
npm run prisma:migrate # Applies development migrations (prisma migrate dev)
npm run start
```

### Production Database Migration
To apply pending database migrations in a production environment:
```bash
cd server
npm run prisma:migrate:deploy # Applies production migrations (prisma migrate deploy)
```

### Frontend Setup
```bash
cd client
npm install
npm run dev # Starts Vite dev server on http://localhost:5173
npm run build # Production bundle verification
```

---

## Production Environment & Deployment Contract (D0 Preparation)

### Environment Variable Classification & Matrix

| Variable | Scope | Description | Default / Example | Classification |
| :--- | :--- | :--- | :--- | :--- |
| `VITE_API_URL` | Frontend | Base URL of the PerfectDay REST API. Baked into client bundle at build time. | `http://localhost:3000` | **Public** |
| `NODE_ENV` | Backend | Environment mode (`development`, `test`, `production`). | `development` | **Backend Runtime** |
| `PORT` | Backend | Port on which Express REST API server listens. | `3000` | **Backend Runtime** |
| `CLIENT_ORIGIN` | Backend | Allowed CORS origin for frontend requests. | `http://localhost:5173` | **Backend Runtime** |
| `DATABASE_URL` | Backend | PostgreSQL connection URI for Prisma ORM. | `postgresql://user:pass@host:5432/db?schema=public` | **Secret** |
| `JWT_SECRET` | Backend | Secret key for signing short-lived access JWTs (`pd_auth`). Min 32 chars. | `your-super-secret-jwt-key-min-32-characters` | **Secret** |
| `JWT_EXPIRES_IN` | Backend | Lifetime of access JWT cookies. | `1h` | **Backend Runtime** |
| `REFRESH_TOKEN_SECRET` | Backend | Secret key for persistent refresh token validation (`pd_refresh`). Min 32 chars. | `your-separate-refresh-token-secret-min-32-chars` | **Secret** |
| `REFRESH_TOKEN_EXPIRES_DAYS` | Backend | Lifetime of persistent Remember Me sessions in days. | `30` | **Backend Runtime** |
| `GOOGLE_CLIENT_ID` | Backend | Google OAuth Client ID string for ID Token audience verification. | `mock-google-client-id.apps.googleusercontent.com` | **Backend Config / Public ID** |
| `GOOGLE_CLIENT_SECRET` | Backend | Google OAuth Client Secret (Backend secret fallback). | `mock-google-client-secret` | **Secret (Optional)** |

> [!NOTE]
> **Google Sign-In Implementation Contract (Phase 8B & D1+)**:
> The backend implements Google authentication via `POST /api/auth/google`, accepting a Google ID token / Credential JWT. It verifies tokens using Google's tokeninfo endpoint (`https://oauth2.googleapis.com/tokeninfo`) or dev/test mock tokens. It does **NOT** use OAuth 2.0 PKCE / Authorization Code Flow (no redirect URI required). Production Google Cloud Console credentials and live Google Sign-In SDK button setup are explicitly deferred to the **D1+** deployment milestone.

### Cloud Backend Readiness (D2 Preparation)
- **Host Binding**: Express server explicitly binds to `"0.0.0.0"` in `server/src/index.js` to listen on all IPv4 network interfaces as required by cloud PaaS web service hosts (e.g., Render).
- **Production Start Command**: `npm run start` executes `node src/index.js` relying on platform-injected `process.env` without requiring a `.env` file on container filesystems.
- **Graceful Termination**: Captures `SIGTERM` and `SIGINT` signals to close open HTTP listener connections and invoke `prisma.$disconnect()` cleanly upon container shutdown.
- **Health Monitoring**: `GET /api/health` continuously verifies application state and PostgreSQL database connection (`SELECT 1`).

### Frontend Deployment Readiness (D4 Preparation)
- **Render Service Type**: Render Static Site
- **Root Directory**: `client`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Production API Configuration**: `VITE_API_URL=https://perfectday.onrender.com`
  > [!IMPORTANT]
  > `VITE_API_URL` is a **public build-time environment variable** compiled directly into frontend JavaScript assets during `npm run build`. It contains zero backend secrets, database connection strings, or private API keys.
- **SPA Routing Rewrite**: Render Static Site rewrite rule `/*` -> `/index.html` (200 Rewrite) to support single-page application routing and deep link fallback.



---

## Verification Test Suites

### Automated Test Suites (125/125 Tests Passed)
- Phase 8A Remember Me & Session Suite: `node --env-file=server/.env scratch/test_phase8a.js` (27 tests)
- Phase 7A Backend API Suite: `node --env-file=server/.env scratch/test_phase7a.js` (26 tests)
- Phase 7B Frontend Integration Suite: `node --env-file=server/.env scratch/test_phase7b.js` (25 tests)
- Phase 7C Task Interaction Suite: `node --env-file=server/.env scratch/test_phase7c.js` (19 tests)
- Phase 7.5 Security & Regression Suite: `node --env-file=server/.env scratch/test_phase7_5.js` (28 tests)

### Browser & UI Acceptance Suite (43/43 Tests Passed)
- Full Browser & DOM Acceptance Suite: `cd client && node --env-file=../server/.env test_browser_acceptance.js` (43 tests)