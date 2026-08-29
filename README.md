# PerfectDay

A modern personal productivity and to-do application: Apple-inspired glassmorphism UI, REST API, and PostgreSQL. Inspired by Microsoft To Do and Google Tasks — not a copy of either.

**Status:** **Phase 7.9.5 Complete** — Final Fix: True Fixed App Chrome (Fixed Top/Nav/Composer Chrome, Strict Viewport Isolation, Independent Planned Horizontal Board, Natural Column Heights).

---

## Highlights of Phase 7.9.5
- **True Fixed App Chrome**: Left navigation rail, workspace header, and bottom Add Task composer remain strictly fixed to their respective viewport anchors during deep vertical or horizontal scrolling.
- **Independent Planned Horizontal Viewport**: Horizontal scrolling affects ONLY the date/task board; workspace header, description, sidebar, and bottom composer stay completely stationary.
- **Independent Natural Column Heights**: Planned date columns size dynamically based on their individual task counts (`align-items: flex-start`), avoiding stretched or artificial heights.
- **Single-Line Glass Title Input**: Sleek single-line glass input without resize handles, with debounced autosave and focus retention.
- **Minimal Apple-Inspired Scrollbars**: Clean, subtle glass scrollbar thumbs with native white scrollbar tracks completely eliminated.
- **Optimistic Custom List Rename**: Instant local UI update with automatic rollback on network failure.
- **Apple-Inspired Glassmorphism**: Translucent frosted surfaces with layered depth, high-contrast readable typography, subtle borders, and warm amber accents.

---

## Stack

- **Frontend:** HTML5, CSS3 Custom Properties, Vanilla JavaScript (ES Modules), Vite, Lucide Icons
- **Backend:** Node.js, Express 5, REST (`/api`), Zod Validation
- **Data:** PostgreSQL, Prisma ORM
- **Auth:** JWT (HTTP-only secure cookies `pd_auth`), bcrypt

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

### Automated Test Suites (98/98 Tests Passed)
- Phase 7A Backend API Suite: `node scratch/test_phase7a.js` (26 tests)
- Phase 7B Frontend Integration Suite: `node scratch/test_phase7b.js` (25 tests)
- Phase 7C Task Interaction Suite: `node scratch/test_phase7c.js` (19 tests)
- Phase 7.5 Security & Regression Suite: `node scratch/test_phase7_5.js` (28 tests)

### Browser & UI Acceptance Suite (60/60 Tests Passed)
- Full Browser & DOM Acceptance Suite: `node client/test_browser_acceptance.js` (60 tests)