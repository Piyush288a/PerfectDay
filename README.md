# PerfectDay

A modern personal productivity and to-do app: premium UI, REST API, and PostgreSQL. Inspired by Microsoft To Do and Google Tasks — not a copy of either.

**Status:** Phase 2 — database layer implemented. PostgreSQL schema and Prisma ORM are configured on the backend.

## Stack

- **Frontend:** HTML, CSS, Vanilla JS, Vite (GSAP and Lucide later)
- **Backend:** Node.js, Express, REST (`/api`)
- **Data:** PostgreSQL, Prisma ORM
- **Auth:** JWT, bcrypt (Phase 4)

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

Configure `DATABASE_URL` in `server/.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/perfectday?schema=public"
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

Health check:

```bash
curl http://localhost:3000/api/health
```

Expected response: `{"status":"ok"}`.

## Layout

```
PerfectDay/
  client/     Vite + Vanilla JS
  server/     Node.js + Express + Prisma ORM
```

