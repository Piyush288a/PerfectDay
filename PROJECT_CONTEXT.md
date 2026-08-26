# PerfectDay — Project Context

This document is the source of truth for product vision, tech stack, architecture, UI direction, and development process. It is **not** an implementation plan for a specific feature. Application code must not be written until a later phase is explicitly requested.

**Status:** Phase 0 — Project specification and architecture (documentation only).

---

## Product

**PerfectDay** is a full-stack personal productivity / to-do application. It is inspired by products such as Microsoft To Do and Google Tasks, but should feel more modern, premium, animated, and polished.

The product is a **personal task manager**: users authenticate, organize work into lists and views, and manage tasks with due dates, priority, notes, and later advanced features.

Visual screenshots provided by the user are **inspiration only**. Do not copy them exactly.

---

## Tech stack

### Frontend

| Technology | Role |
| --- | --- |
| HTML5 | Markup |
| CSS3 | Layout, theming, simple animations |
| Vanilla JavaScript | Application logic (no frontend framework) |
| Vite | Dev server and bundling |
| GSAP | Advanced animations where CSS is insufficient |
| Lucide | Icons |

### Backend

| Technology | Role |
| --- | --- |
| Node.js | Runtime |
| Express.js | HTTP server |
| REST API | Client–server contract |
| JavaScript | Backend language |

### Data

| Technology | Role |
| --- | --- |
| PostgreSQL | Database |
| Prisma ORM | Schema, migrations, queries |

### Authentication

| Technology | Role |
| --- | --- |
| JWT | Session / access tokens |
| bcrypt | Password hashing |

### Development

Git, GitHub, Cursor Agent.

**Dependency policy:** Do not introduce unnecessary packages. Do not install dependencies until Phase 1 is requested.

---

## Architecture

Frontend and backend are **separate**. The frontend never talks to PostgreSQL. All persistence goes through the REST API.

```
HTML / CSS / Vanilla JS  (Vite)
        ↓
    REST API  (/api)
        ↓
  Express backend
        ↓
      Prisma
        ↓
    PostgreSQL
```

### Repository structure (final)

Single Git repository. Monorepo-style layout with two top-level apps:

- `client/` — Vite + Vanilla JavaScript frontend
- `server/` — Node.js + Express.js backend

Keep frontend and backend clearly separated. Each is independently runnable in development. Do not share runtime code between them unless a later phase explicitly requires it.

### API (final)

- Style: REST
- Base prefix: `/api`
- No API versioning (`/api/v1`, etc.) until a later decision

### Database (final)

PostgreSQL with Prisma ORM. Prisma lives on the server only.

### Authentication (final, with one deferred detail)

- JWT for authentication
- bcrypt for password hashing
- **Token storage strategy is not decided yet.** Decide it before implementing Phase 4 (Authentication). Do not assume cookies, localStorage, or in-memory storage.

### Environment (final)

- Secrets and environment-specific config live in `.env`
- Never commit `.env` to Git
- Use `.env.example` (no secrets) to document required variables

### Deployment (deferred)

Deployment architecture is **undecided**. Do not choose hosts, containers, process managers, or production reverse-proxy setups yet.

### Backend layout (planned)

Keep these concerns logically separated, without extra layers:

- routes
- controllers
- services
- middleware
- utilities
- Prisma / database access

Do not over-engineer (no extra “repository” / “domain” / “use-case” layers unless a later need is discussed).

### Frontend layout (planned)

Keep a clean separation between:

- UI
- API communication
- application logic
- state / data handling

---

## Security and configuration

- Never hardcode secrets or credentials.
- Use `.env` for secrets and environment-specific configuration (database URL, JWT secret, client API base URL, ports, etc.).
- Never commit `.env` to Git.
- Authentication: register, login, logout, protected routes, persistent authentication (token **storage** still open).
- The frontend must not access the database directly.

---

## Product vision (eventual scope)

### Authentication

- Register
- Login
- Logout
- Protected routes
- Persistent authentication

### Task management

- Create, edit, delete
- Complete and restore
- Due dates
- Priority
- Notes

### Organization

- My Day
- Upcoming
- All Tasks
- Completed
- Custom lists
- Tags
- Search
- Filtering
- Sorting

### Later (advanced)

- Subtasks
- Reminders
- Recurring tasks
- Calendar view
- Statistics
- Notifications

---

## UI / UX direction

The UI should feel **modern, premium, minimal, professional, responsive, smooth, and animated**.

Required capabilities:

- Dark mode and light mode
- Responsive layouts
- Smooth transitions
- Micro-interactions
- Toast notifications
- Loading, empty, and error states
- Modals
- Hover effects

**Animation:** CSS for simple interactions; GSAP when more advanced motion is useful.

---

## Development rules

1. Do not implement the entire application at once.
2. Work phase-by-phase.
3. Before significant implementation, inspect the existing codebase.
4. For major features, provide an implementation plan before modifying files.
5. Do not make major architectural decisions without discussing them.
6. Do not introduce unnecessary dependencies.
7. Do not hardcode secrets or credentials.
8. Use environment variables for sensitive configuration.
9. Keep frontend and backend properly separated.
10. Keep code modular and maintainable.
11. Avoid unnecessary abstraction.
12. Do not modify unrelated files.
13. After implementing a feature, explain:
    - what changed
    - which files changed
    - how to test it
    - any important technical considerations

---

## Development phases

| Phase | Focus |
| --- | --- |
| **0** | Project specification and architecture (this document). |
| **1** | Project initialization and development environment. |
| **2** | Database schema and Prisma setup. |
| **3** | Backend foundation and REST API structure. |
| **4** | Authentication. |
| **5** | Frontend design system. |
| **6** | Login / Register UI and authentication integration. |
| **7** | Dashboard UI. |
| **8** | Task CRUD. |
| **9** | Lists, My Day, Upcoming, Completed, search, filtering, and sorting. |
| **10** | Subtasks, tags, reminders, recurring tasks, and calendar. |
| **11** | Testing, security, accessibility, performance, responsive design, and production polish. |

**Current phase:** 1 complete. Client (Vite) and server (Express) are initialized and independently runnable. Next: Phase 2 (database schema and Prisma) when requested.

---

## Finalized architectural decisions

Recorded before Phase 1. Do not reopen these without discussion.

| Topic | Decision |
| --- | --- |
| Repository | One Git repo; `client/` and `server/` at the root |
| Frontend | Vite + Vanilla JavaScript |
| Backend | Node.js + Express.js |
| API | REST under `/api`; no versioning yet |
| Database | PostgreSQL + Prisma |
| Auth | JWT + bcrypt; **storage strategy later** (before Phase 4) |
| Environment | `.env` for secrets; never commit `.env` |
| Development | Frontend and backend run independently |
| Deployment | Undecided; no deployment-specific work yet |
| Backend structure | Routes, controllers, services, middleware, DB access — logically separated, not over-layered |

## Open decisions (do not assume)

Still to be decided later:

- JWT token storage (httpOnly cookie vs localStorage vs memory + refresh, etc.) — **before Phase 4**
- Exact Prisma data model (users, lists, tasks, tags, My Day semantics) — **Phase 2**
- Deployment targets and production environment layout — **deferred**

---

## Out of scope until a later phase

- Prisma, PostgreSQL schema, and database access
- Authentication (JWT storage, bcrypt, protected routes)
- GSAP, Lucide, and the real PerfectDay UI
- Routes beyond `GET /api/health`
- Controllers, services, and middleware layers
- Task, list, and organization features
- Deployment architecture
