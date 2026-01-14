# Health Trust Directory (MVP)

Auth-gated, admin-moderated directory with ingestion from RSS/Atom/JSON feeds + sitemaps and fast full-text search using SQLite FTS5.

## Features

- Next.js (App Router) + TypeScript
- Prisma + SQLite
- **SQLite FTS5** virtual tables for `Creator` and `Item` with triggers
- **Auth gating**
  - `/search` requires auth
  - All `/api/*` routes require auth **except** landing (`/`) and auth routes
  - Admin pages + admin API routes are **admin-only**
- NextAuth
  - Email magic link (required)
  - Optional GitHub OAuth (documented)
- In-memory rate limiting for API routes
- `robots.txt` disallows all; site-wide `noindex` meta
- Ingestion script `scripts/ingest.ts`
  - RSS/Atom/JSON feed ingestion and sitemap ingestion
  - Stores metadata and short excerpts
  - Canonicalization, UTM stripping, safe redirect resolution (HEAD when safe)
  - Dedupe by `canonicalUrl`
  - Safety gates using `DomainBlocklist` and `KeywordBlocklist`
- Seeding script `scripts/seed.ts`
  - Creates admin from `ADMIN_EMAIL`
  - Adds sample creators/feeds and minimal blocklist examples

## Quickstart (local)

### 1) Install

```bash
npm install
```

### 2) Configure environment

Create `.env`:

```bash
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-strong-random"

# Email magic link (required)
EMAIL_SERVER_HOST="smtp.example.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="user"
EMAIL_SERVER_PASSWORD="pass"
EMAIL_FROM="Health Trust Directory <no-reply@example.com>"

# Admin bootstrap
ADMIN_EMAIL="admin@example.com"

# Optional GitHub OAuth
# GITHUB_ID="..."
# GITHUB_SECRET="..."
```

Generate a secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3) Migrate + seed

```bash
npx prisma migrate dev --name init
npm run seed
```

### 4) Run

```bash
npm run dev
```

Login via email magic link. The user matching `ADMIN_EMAIL` will have admin privileges.

## Ingestion

Run ingestion for all enabled feeds:

```bash
npm run ingest
```

Notes:

- Items are deduped by `canonicalUrl`.
- Ingestion is blocked if the item domain is blocklisted in `DomainBlocklist`, or if the URL/title/content contains a blocked keyword from `KeywordBlocklist`.

## Admin

- Admin UI: `/admin`
- Admin can manage creators/feeds and blocklists.

## Optional GitHub OAuth

Create a GitHub OAuth App:

- Homepage URL: `http://localhost:3000`
- Callback URL: `http://localhost:3000/api/auth/callback/github`

Set `GITHUB_ID` and `GITHUB_SECRET` in `.env`.

## Minimal VPS deploy (example)

1. Provision a small VPS (Ubuntu).
2. Install Node 20+, nginx, and create a system user.
3. Clone repo, set `.env`.
4. Build and run under a process manager:

```bash
npm ci
npx prisma migrate deploy
npm run build
npm start
```

5. Put nginx in front (TLS via Let’s Encrypt).

SQLite is stored on disk; ensure backups.

## Security note

This is an MVP. Do not treat it as a hardened security product.

- Rate limiting is in-memory (single instance). Put Cloudflare/nginx rate limits in front for production.
- Always set strong `NEXTAUTH_SECRET`.
- Keep SMTP creds secure.
- Consider running ingestion in a constrained environment; ingestion fetches untrusted remote content.

---

## Repo scripts

- `npm run ingest` → ingest feeds/sitemaps
- `npm run seed` → seed admin + sample data
- `npx prisma studio` → inspect DB
