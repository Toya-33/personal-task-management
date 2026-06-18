# Time Tracker V2

A single-user time-tracking app — organize work into folders → tasks → subtasks, run a
picture-in-picture timer, and review time on a dashboard. Built with Next.js 16 (App Router),
React 19, TypeScript, Tailwind CSS v4, and a local PostgreSQL database via the `pg` driver.
No authentication — it's a single-user app.

## Local development

Requires Node.js and a local PostgreSQL (13+).

```bash
# 1. Create the database and apply the schema
createdb time_tracker
psql -d time_tracker -f schema.sql

# 2. Configure the connection
cp .env.example .env.local        # then edit DATABASE_URL for your machine

# 3. Install and run
npm install
npm run dev                       # http://localhost:3000
```

`schema.sql` is the source of truth for the database. See [CLAUDE.md](CLAUDE.md) for the
architecture and conventions.

## Run with Docker

The app connects to a PostgreSQL running on the **host**. Create `.env.docker` (gitignored)
from your `.env.local`, swapping the host so the container can reach it:

```bash
sed 's/@localhost:/@host.docker.internal:/' .env.local > .env.docker
docker compose up -d --build      # http://localhost:3001
```

## Deploy to a VM (24/7, nginx + HTTPS)

See the step-by-step runbook: **[docs/deployment.md](docs/deployment.md)** — Docker + host
PostgreSQL, an nginx reverse-proxy site, and a Let's Encrypt certificate via certbot.

## Scripts

- `npm run dev` — dev server (Turbopack)
- `npm run build` — production build
- `npm run start` — start the production build
- `npm run lint` — ESLint

## Architecture decisions

See [docs/decisions/](docs/decisions/) (ADRs), notably
[ADR-004](docs/decisions/004-drop-supabase-local-postgres.md) on moving from Supabase to local
PostgreSQL.
