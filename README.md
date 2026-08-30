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
npx prisma migrate dev
npm run start
```

### Frontend Setup
```bash
cd client
npm install
npm run dev # Starts Vite dev server on http://localhost:5173
npm run build # Production bundle verification
```

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