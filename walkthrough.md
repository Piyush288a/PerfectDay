# Phase 7A — Backend Core Tasks & Lists API Walkthrough

## Summary of Implementation

Phase 7A implements the backend REST APIs for **Lists** and **Tasks** for PerfectDay. All endpoints are protected by JWT authentication cookies (`requireAuth`) and enforce strict user ownership checks using `req.user.userId`. Request payloads and queries are strictly validated with Zod, and business logic is isolated in dedicated service layers using Prisma.

---

## 1. Architecture & Layered Request Flow

```
Request (with pd_auth cookie)
  │
  ▼
requireAuth (Middleware) ──► Validates JWT & injects req.user = { userId }
  │
  ▼
validate (Middleware)    ──► Validates req.body, req.params, req.query via Zod
  │
  ▼
Controller               ──► Extracts validated inputs & delegates to service
  │
  ▼
Service                  ──► Enforces ownership & business rules
  │
  ▼
Prisma Client            ──► Scoped PostgreSQL queries (`where: { id, userId }`)
  │
  ▼
Response                 ──► Standard JSON envelope via sendSuccess()
```

---

## 2. API Contracts & Endpoints

### Lists Endpoints (`/api/lists`)

| Method | Endpoint | Description | Request Body / Params | Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/lists` | Get all lists for authenticated user (ordered with default first) | None | `200 OK` + List array with `_count.tasks` |
| `POST` | `/api/lists` | Create a new custom list (`isDefault: false`) | `{ name: string }` | `201 Created` + List object |
| `PATCH` | `/api/lists/:id` | Rename custom list (ownership-enforced) | `{ name: string }` | `200 OK` + Updated list |
| `DELETE` | `/api/lists/:id` | Delete custom list (default & non-empty lists rejected) | `id: UUID` | `200 OK` + Success message |

### Tasks Endpoints (`/api/tasks`)

| Method | Endpoint | Description | Request Body / Query / Params | Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/tasks` | Get user tasks with query filters | Query: `listId`, `isCompleted`, `priority`, `myDay`, `due`, `search`, `sortBy`, `sortOrder` | `200 OK` + Tasks array with list metadata |
| `POST` | `/api/tasks` | Create task (auto-assigns to default list if `listId` omitted) | `{ title, notes?, listId?, isCompleted?, dueDate?, myDayOn?, priority?, order?, recurrenceRule?, recurrenceInterval?, recurrenceEndsOn? }` | `201 Created` + Task object |
| `GET` | `/api/tasks/:id` | Get task details by ID with subtasks and list metadata | `id: UUID` | `200 OK` + Detailed task |
| `PATCH` | `/api/tasks/:id` | Update task fields (auto-populates/clears `completedAt` on toggle) | Partial task fields | `200 OK` + Updated task |
| `DELETE` | `/api/tasks/:id` | Delete task (ownership-enforced) | `id: UUID` | `200 OK` + Success message |

---

## 3. Security & Ownership Rules

1. **Strict User Ownership**:
   - Every database query scopes access by `userId: req.user.userId`.
   - Attempting to view, modify, or delete another user's task or list yields an immediate `404 Not Found`.
   - Creating a task targeting another user's `listId` is rejected with `404 Not Found`.
2. **Default List Protection**:
   - The user's default `"Tasks"` list cannot be deleted (returns `400 Bad Request`).
3. **ON DELETE RESTRICT Preservation**:
   - Deleting a custom list that still contains tasks is rejected (returns `409 Conflict`), preserving task integrity.
4. **My Day Semantics**:
   - Managed directly via `Task.myDayOn` without introducing a redundant database model.
   - Filtered via `GET /api/tasks?myDay=true`.

---

## 4. Files Created / Modified

- **Created:**
  - [`server/src/schemas/list.schema.js`](file:///d:/IGNORE/PROJECTS/PerfectDay/server/src/schemas/list.schema.js): Zod schemas for list creation, updates, and UUID parameter validation.
  - [`server/src/schemas/task.schema.js`](file:///d:/IGNORE/PROJECTS/PerfectDay/server/src/schemas/task.schema.js): Zod schemas for task creation, updates, and query filters.
  - [`server/src/services/list.service.js`](file:///d:/IGNORE/PROJECTS/PerfectDay/server/src/services/list.service.js): List business logic, default list protection, and task count queries.
  - [`server/src/services/task.service.js`](file:///d:/IGNORE/PROJECTS/PerfectDay/server/src/services/task.service.js): Task business logic, dynamic filtering, sorting, and completion timestamp management.
  - [`server/src/controllers/list.controller.js`](file:///d:/IGNORE/PROJECTS/PerfectDay/server/src/controllers/list.controller.js): List route handlers.
  - [`server/src/controllers/task.controller.js`](file:///d:/IGNORE/PROJECTS/PerfectDay/server/src/controllers/task.controller.js): Task route handlers.
  - [`server/src/routes/list.routes.js`](file:///d:/IGNORE/PROJECTS/PerfectDay/server/src/routes/list.routes.js): List route declarations with middleware binding.
  - [`server/src/routes/task.routes.js`](file:///d:/IGNORE/PROJECTS/PerfectDay/server/src/routes/task.routes.js): Task route declarations with middleware binding.
- **Modified:**
  - [`server/src/routes/index.js`](file:///d:/IGNORE/PROJECTS/PerfectDay/server/src/routes/index.js): Mounted `/lists` and `/tasks` routers.
  - [`server/src/middleware/validate.js`](file:///d:/IGNORE/PROJECTS/PerfectDay/server/src/middleware/validate.js): Updated `req.query` validation handling for Express 5.
  - [`PROJECT_CONTEXT.md`](file:///d:/IGNORE/PROJECTS/PerfectDay/PROJECT_CONTEXT.md): Status updated to Phase 7A complete.
  - [`README.md`](file:///d:/IGNORE/PROJECTS/PerfectDay/README.md): Documented Lists and Tasks API endpoints.

---

## 5. Verification & Test Results

```
=== PerfectDay Phase 7A: Backend Core Tasks & Lists API Verification ===

✅ [PASS] GET /api/health online
✅ [PASS] GET /api/lists without auth returns 401
✅ [PASS] GET /api/tasks without auth returns 401
✅ [PASS] User A registered with cookie
✅ [PASS] User B registered with cookie
✅ [PASS] User A has default 'Tasks' list
✅ [PASS] User A creates custom list
✅ [PASS] User A renames custom list
✅ [PASS] Empty list name rejected with 400 Validation Error
✅ [PASS] Default list deletion rejected (400)
✅ [PASS] Task created in custom list
✅ [PASS] Task created without listId auto-assigns to default list
✅ [PASS] GET /api/tasks?myDay=true filters My Day tasks
✅ [PASS] GET /api/tasks?listId=... filters tasks by list
✅ [PASS] Task completion sets completedAt timestamp
✅ [PASS] Uncompleting task clears completedAt timestamp
✅ [PASS] GET /api/tasks/:id returns detailed task with list info
✅ [PASS] User B cannot GET User A's task (404)
✅ [PASS] User B cannot PATCH User A's task (404)
✅ [PASS] User B cannot DELETE User A's task (404)
✅ [PASS] User B cannot PATCH User A's list (404)
✅ [PASS] User B cannot DELETE User A's list (404)
✅ [PASS] User B cannot create task targeting User A's list (404)
✅ [PASS] Deleting list with tasks rejected with 409 Conflict
✅ [PASS] User A deletes task
✅ [PASS] User A deletes empty custom list successfully

=== Phase 7A Verification Results: 26/26 Passed ===
🎉 ALL PHASE 7A TESTS PASSED!
```

- **Client Production Build**: `npm run build` in `client/` built in `1.21s` with **0 errors**.
