# Phase 4 — Authentication Implementation Walkthrough

## Summary of Changes

Phase 4 implements secure, production-grade JWT authentication using HTTP-only cookies, bcrypt password hashing, Zod validation, and protected route middleware for PerfectDay.

---

## 1. Architecture & Design Decisions

- **Cookie Security**:
  - Auth token stored in an `httpOnly: true` cookie named `pd_auth`.
  - Development configuration: `secure: false`, `sameSite: "lax"`, `maxAge: 1 hour`.
  - Production configuration: `secure: true`, `sameSite: "lax"`, `maxAge: 1 hour`.
  - CORS configured with `credentials: true` and `origin: env.CLIENT_ORIGIN`.
- **JWT Configuration**:
  - Signed with `env.JWT_SECRET` (strictly validated to at least 32 characters).
  - Lifetime: `1h`.
  - Payload contains minimal identity only: `{ userId: user.id }`.
  - `password`, `passwordHash`, or unnecessary personal data are never placed in JWT.
- **Password Security**:
  - Bcrypt with 12 salt rounds.
  - Policy: minimum 8 characters, maximum 72 characters.
  - `passwordHash` is never returned in any API response.
- **Transactional Onboarding**:
  - User registration creates both the `User` and their default `"Tasks"` `List` (`isDefault: true`) within a single atomic Prisma transaction.
- **Email Normalization**:
  - Emails are normalized via `email.trim().toLowerCase()` consistently before all database operations.
- **Cookie Parser**:
  - Lightweight custom cookie parser in `src/utils/token.js` extracting `pd_auth` without external `cookie-parser` overhead.

---

## 2. API Endpoints

| Method | Endpoint | Protection | Description | Response Status |
| --- | --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public | Validates input, hashes password, creates user + default list, sets `pd_auth` cookie | `201 Created` |
| `POST` | `/api/auth/login` | Public | Validates credentials, verifies bcrypt hash, sets `pd_auth` cookie | `200 OK` |
| `POST` | `/api/auth/logout` | Public | Clears `pd_auth` cookie | `200 OK` |
| `GET` | `/api/auth/me` | Protected (`requireAuth`) | Reads `pd_auth` cookie, verifies JWT, returns safe user object | `200 OK` |

---

## 3. Files Created / Modified

- **Created:**
  - `server/src/utils/password.js`: Bcrypt password hashing & comparison.
  - `server/src/utils/token.js`: JWT creation, verification, cookie setting/clearing, and extraction.
  - `server/src/schemas/auth.schema.js`: Zod validation schemas for `register` and `login`.
  - `server/src/middleware/auth.js`: `requireAuth` protected route middleware.
  - `server/src/services/auth.service.js`: Authentication business logic & database queries.
  - `server/src/controllers/auth.controller.js`: HTTP handlers managing cookies and responses.
  - `server/src/routes/auth.routes.js`: Route mappings and middleware chaining.
- **Modified:**
  - `server/package.json`: Added `bcrypt` and `jsonwebtoken`.
  - `server/src/config/env.js`: Added validation for `JWT_SECRET` (min 32 chars) and `JWT_EXPIRES_IN`.
  - `server/src/routes/index.js`: Mounted `/auth` routes under `/api/auth`.
  - `server/.env.example`: Added `JWT_SECRET` and `JWT_EXPIRES_IN`.
  - `PROJECT_CONTEXT.md`: Updated Phase status to Phase 4 complete.
  - `README.md`: Documented authentication endpoints and environment variables.

---

## 4. Verification Results

| Test Case | Expected Result | Actual Result |
| --- | --- | --- |
| `GET /api/health` | `200 OK` | `200 OK` (Status: `ok`) |
| `POST /api/auth/register` (Password < 8 chars) | `400 VALIDATION_ERROR` | `400 Bad Request` |
| `POST /api/auth/register` (Valid payload) | `201 Created` + `pd_auth` cookie + default list | `201 Created` (Safe user profile, cookie set, "Tasks" list created) |
| `POST /api/auth/register` (Duplicate email) | `409 CONFLICT` | `409 Conflict` ("Email is already registered") |
| `POST /api/auth/login` (Wrong password) | `401 UNAUTHORIZED` | `401 Unauthorized` ("Invalid email or password") |
| `POST /api/auth/login` (Non-existent user) | `401 UNAUTHORIZED` | `401 Unauthorized` ("Invalid email or password") |
| `POST /api/auth/login` (Valid credentials) | `200 OK` + `pd_auth` cookie | `200 OK` (Email normalized, cookie set) |
| `GET /api/auth/me` (With `pd_auth` cookie) | `200 OK` + safe user | `200 OK` (User object returned, no `passwordHash`) |
| `GET /api/auth/me` (Without cookie) | `401 UNAUTHORIZED` | `401 Unauthorized` ("Authentication required") |
| `POST /api/auth/logout` | `200 OK` + clear cookie | `200 OK` (`Set-Cookie: pd_auth=; Max-Age=0`) |
| Client Build (`npm run build`) | `0 errors` | `0 errors` |
