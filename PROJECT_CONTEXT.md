# PerfectDay — Project Context & Specification

> **Single Source of Truth** for product vision, architecture, user experience direction, design system, development guidelines, and phase planning.

---

## 1. Product Overview

PerfectDay is a fast, elegant, keyboard-friendly personal productivity and to-do web application. It combines the focus of Microsoft To Do's "My Day" concept with the clean efficiency of Google Tasks, while establishing its own unique design language: **"Apple-Inspired Glassmorphism + Ambient Daylight"**.

### Core Value Proposition
- **Ambient Focus**: A warm, calming workspace with genuine frosted-glass surfaces, atmospheric background depth, and subtle amber accents.
- **Speed & Simplicity**: Fast task entry with fixed/sticky bottom composer, keyboard navigation, inline editing, and predictable state transitions.
- **Privacy & Security**: Secure JWT authentication with HTTP-only cookies, robust cross-account data isolation, and server-side authorization enforcement.

---

## 2. Technical Stack & Architecture

- **Frontend**:
  - Vanilla ES Modules (Modern JavaScript)
  - Pure CSS3 Custom Properties (Design tokens, glassmorphism hierarchy, responsive grid)
  - Vite (Fast development and production bundling)
  - Lucide Icons (Unified stroke icons)
- **Backend**:
  - Node.js & Express 5 (REST API under `/api`)
  - Prisma ORM with PostgreSQL
  - JWT Authentication via HTTP-only secure cookies (`pd_auth`)
  - Zod request validation and centralized error handling architecture
- **Data Flow & State Isolation**:
  - Browser communicates exclusively with the REST API using native `fetch` with `credentials: "include"`.
  - Frontend stores (`authStore`, `taskStore`, `listStore`) manage reactive local UI state, optimistic updates, automatic rollback on error, and identity-based state isolation (`reset()`).

---

## 3. Development Phases

| Phase | Focus | Status |
| :--- | :--- | :--- |
| **0** | Project specification and architecture. | ✅ Complete |
| **1** | Project initialization and development environment. | ✅ Complete |
| **2** | Database schema and Prisma setup. | ✅ Complete |
| **3** | Backend foundation and REST API structure. | ✅ Complete |
| **4** | Authentication (JWT HTTP-only cookies, bcrypt). | ✅ Complete |
| **5** | Frontend design system ("Apple Glassmorphism + Ambient Daylight"). | ✅ Complete |
| **6** | Login / Register UI and authentication integration. | ✅ Complete |
| **7A** | Backend Core Tasks & Lists REST API. | ✅ Complete |
| **7B** | Frontend Real Tasks & Lists API Integration. | ✅ Complete |
| **7C** | Task Interaction & Productivity UX (Detail panel, dates, priorities). | ✅ Complete |
| **7.5** | Stabilization, Security Isolation & Major Dashboard UI Refinement. | ✅ Complete |
| **7.9** | UI Refinement & Final Polish (Glassmorphism, Scheduling Semantics, Hover Clipping Fix, Fixed Composer). | ✅ Complete |
| **7.9.1** | Final UI Bug Fix / Visual QA Pass (Single-line Title, Truly Fixed Composer, Clean Scrollbars, Optimistic Rename). | ✅ Complete |
| **7.9.5** | Final Fix: True Fixed App Chrome & Strict Viewport Isolation. | ✅ Complete |
| **8A** | **Authentication Enhancements: Real Remember Me & Server-Side Session Management (DB-backed refresh tokens, rotating session cookies, silent auto-refresh).** | ✅ Complete |
| **8B** | Continue with Google (ID Token verification via `POST /api/auth/google`, safe account conflict protection, Remember Me support; production Google credentials deferred to D1+). | ✅ Complete (API) |
| **D0** | **Production Deployment Contract Preparation (Environment contract, variable scoping & matrix, production migration script).** | ✅ Complete |
| **9** | Advanced search, filtering, and sorting. | Planned |
| **10** | Performance optimization, polish, and production release. | Planned |

**Current status:** **Phase 8A, Phase 8B API, and D0 Production Deployment Contract Complete**. Verified across backend test suites, browser acceptance tests, and environment contract specifications.


---

## 4. Verification Breakdown (Phase 8A)

### 4.1 Automated Test Suites (125/125 Passed)
- **Phase 8A Remember Me & Session Management Suite** (`27/27`): Remember Me OFF session cookie behavior, Remember Me ON 30-day persistent session creation, DB bcrypt token hash storage, transparent token rotation (`POST /api/auth/refresh`), silent auto-refresh on expired access token via `pd_refresh` cookie, session revocation on logout, revoked token rejection (`401 Unauthorized`), cross-account session isolation.
- **Phase 7A Backend REST API Suite** (`26/26`): Unauthenticated route protection, default list generation, custom list CRUD, task CRUD, filter queries (`myDay`, `listId`), authorization enforcement (`404/403` on cross-user ID access), conflict protection on non-empty list deletion.
- **Phase 7B Frontend Real API Integration Suite** (`25/25`): Real backend communication via `fetch`, session restoration from cookie, optimistic completion/priority toggle with rollback, default list loading, list counter reconciliation.
- **Phase 7C Task Interaction & Productivity UX Suite** (`19/19`): Right detail panel metadata binding, title autosave, multi-line notes persistence, priority transitions (`HIGH`, `MEDIUM`, `LOW`, `NONE`), due date updating/clearing (`null`), task deletion with confirmation.
- **Phase 7.5 Regression & Security Isolation Suite** (`28/28`): Multi-user account isolation in database, immediate My Day add/remove filtering, rapid multi-character notes autosave, custom list rename via `PATCH /api/lists/:id`, default Tasks list protection (`400 BadRequestError`), overdue date retention.

### 4.2 Browser & DOM Verified (47/47 Tests)
- **Cross-Account Identity Transition (Security P0)**: User A login -> open task detail -> edit notes -> logout -> User B login. Verified that User B sees zero User A state, `selectedTaskId` is null, `selectedTask` is null, detail panel is closed in DOM, and no stale responses or pending debounce timers repopulate state. Logging back in as User A fully restores User A's data from PostgreSQL.
- **My Day Immediate Removal (P0)**: In My Day view, toggling "Add to My Day" off immediately splices the task from the DOM task list without requiring a page refresh. Persists across refresh.
- **Continuous Multi-Character Notes Typing (P0)**: Focused notes textarea accepts continuous rapid typing without losing focus, resetting input value, or being destroyed by re-renders. Flushes to DB on blur.
- **Planned View Scheduling Semantics (Phase 7.9)**:
  - Task with `dueDate == today` -> Today column.
  - Task with `dueDate == tomorrow` -> Tomorrow column.
  - Task with future `dueDate` -> corresponding date column.
  - Task with overdue `dueDate` -> Overdue column.
  - Task with `myDayOn == today` AND no `dueDate` -> appears in Today column with My Day badge without inventing a fake `dueDate` in database.
  - Task with `myDayOn == today` AND future `dueDate` -> remains scheduled in its future date column with a My Day badge.
- **Tasks View Ordering (Phase 7.9)**: Tasks master view renders groups in strict deterministic order: `OVERDUE` -> `TODAY` -> `TOMORROW` -> `UPCOMING` -> `NO DUE DATE` -> `COMPLETED`.
- **Hover & Clipping Prevention (Phase 7.9)**: Task card hover and selection glows render without top, bottom, or lateral clipping by scroll container boundaries.
- **Fixed/Sticky Bottom Composer (Phase 7.9)**: Bottom Quick Add task bar stays firmly anchored at the bottom of the workspace while task cards scroll smoothly behind it.
- **Translucent Navigation Rail (Phase 7.9)**: Frosted sidebar with `backdrop-filter: blur(24px)` sits above content with horizontal scrolling content passing visually behind it. Collapses to 64px compact icon rail and expands to 260px navigation rail.
- **User Profile Popover**: Popover displays current authenticated user's name, email, member since date, and timezone. Sign out button logs user out cleanly.

### 4.3 Not Implemented / Out of Scope (Remaining for Future Phases)
- **Profile Editing**: No backend profile update endpoint (`PATCH /api/auth/profile`) is in scope for Phase 7.x. Profile popover is display and logout only.
- **Subtasks & Checklists**: Scheduled for Phase 8.
- **Tags & Category Labels**: Scheduled for Phase 8.
- **Reminders & Push Notifications**: Scheduled for Phase 8.
- **Recurring / Repeating Tasks**: Scheduled for Phase 8.
- **Full Month Calendar View**: Scheduled for Phase 8 / 10.

---

## 5. Production Environment & Deployment Contract (D0)

- **Frontend Public Config**: `VITE_API_URL` (included in client Vite bundle).
- **Backend Runtime Config**: `NODE_ENV`, `PORT`, `CLIENT_ORIGIN`, `JWT_EXPIRES_IN`, `REFRESH_TOKEN_EXPIRES_DAYS`.
- **Backend Secrets**: `DATABASE_URL`, `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `GOOGLE_CLIENT_SECRET`.
- **Google Auth Config**: `GOOGLE_CLIENT_ID` (audience verification string), `GOOGLE_CLIENT_SECRET` (backend secret fallback). Implemented via ID Token verification (`POST /api/auth/google`); production Google Cloud OAuth setup deferred to D1+.
- **Production Database Migration Command**: `npm run prisma:migrate:deploy` (`prisma migrate deploy`).

