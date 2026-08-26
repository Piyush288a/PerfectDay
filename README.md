# PerfectDay

A modern personal productivity and to-do app: premium UI, REST API, and PostgreSQL. Inspired by Microsoft To Do and Google Tasks — not a copy of either.

**Status:** Phase 4 — authentication implemented. JWT-based HTTP-only cookie authentication, bcrypt password hashing, Zod validation, and protected routes are active.

## Stack

- **Frontend:** HTML, CSS, Vanilla JS, Vite (GSAP and Lucide later)
- **Backend:** Node.js, Express, REST (`/api`)
- **Data:** PostgreSQL, Prisma ORM
- **Auth:** JWT (HTTP-only cookies), bcrypt

The browser talks only to the API. The API talks to the database.

## Docs

See [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) for product vision, architecture, UI direction, development rules, and phases.

## Setup

Requires [Node.js](https://nodejs.org/) 20 or later and [PostgreSQL](https://www.postgresql.org/) 14 or later.

```bash
# From the repository root

# Frontend
cd client
copy .env.example .env
npm install

# Backend (new terminal)
cd server
copy .env.example .env
npm install
```

On macOS or Linux, use `cp .env.example .env` instead of `copy`.

Configure environment variables in `server/.env`:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/perfectday?schema=public"
CLIENT_ORIGIN=http://localhost:5173
JWT_SECRET="your-super-secret-jwt-key-min-32-characters"
JWT_EXPIRES_IN=1h
```

Do not commit `.env` files. They are gitignored. `.env.example` has no secrets.

## Database Setup & Migrations

Inside `server/`:

```bash
# Apply migrations to PostgreSQL
npx prisma migrate deploy

# (In development) Apply/create migrations
npx prisma migrate dev

# Generate Prisma Client
npx prisma generate

# Inspect the database with Prisma Studio
npx prisma studio
```

## API Endpoints

### Health Check
- `GET /api/health` — Check server & database liveness

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new user & create default "Tasks" list (sets HTTP-only cookie `pd_auth`)
- `POST /api/auth/login` — Authenticate user (sets HTTP-only cookie `pd_auth`)
- `POST /api/auth/logout` — Logout user (clears `pd_auth` cookie)
- `GET /api/auth/me` — Get currently authenticated user profile (protected by `pd_auth` cookie)

## Run

Use two terminals. Each app starts on its own.

**Client** (http://localhost:5173):

```bash
cd client
npm run dev
```

**Server** (http://localhost:3000):

```bash
cd server
npm run dev
```

## Layout

```
PerfectDay/
  client/     Vite + Vanilla JS
  server/     Node.js + Express + Prisma ORM
```


