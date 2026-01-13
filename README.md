# Vetted Health Voices — Health Trust Directory (MVP)

Minimal Next.js (App Router) + TypeScript project implementing a **Health Trust Directory** MVP.

## Stack

- Next.js App Router
- Prisma + SQLite
- NextAuth (Email magic link)
- SQLite **FTS5** backed search (virtual table + triggers)
- Rate limiting (simple in-memory + IP based)

## Quickstart

### 1) Install

```bash
npm install
```

### 2) Configure env

Create `.env`:

```bash
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="change-me-in-prod"
EMAIL_FROM="no-reply@example.com"
EMAIL_SERVER_HOST="smtp.example.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="smtp-user"
EMAIL_SERVER_PASSWORD="smtp-password"
```

### 3) Migrate + seed

```bash
npm run prisma:migrate
npm run db:seed
```

### 4) Run

```bash
npm run dev
```

Open http://localhost:3000

## Key URLs

- `/` — Home (directory search)
- `/orgs/[slug]` — Organization profile
- `/people/[id]` — Person profile
- `/submit` — Submit a new org/person (requires sign-in)
- `/admin` — Admin dashboard (admin role only)

## Ingestion

Put data in `scripts/data/sample.json` or point the ingest script to your own JSON.

```bash
npm run db:ingest
```

## Notes

- `public/robots.txt` disallows all crawling.
- All pages include a `noindex,nofollow` meta tag via `src/app/layout.tsx`.
- Admin protections are enforced server-side.
- Moderation actions are recorded in `AuditLog`.

## Production

This MVP uses SQLite and an in-memory rate limiter. For production, use a shared store (Redis) and consider Postgres.
