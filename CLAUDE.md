# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Time Tracker V2 — a Next.js 16 application for time tracking. Built with TypeScript, Tailwind CSS v4, and React 19.

## Commands

- `npm run dev` — Start dev server (Turbopack)
- `npm run build` — Production build
- `npm run start` — Start production server
- `npm run lint` — Run ESLint (flat config, `eslint.config.mjs`)

## Database

Local PostgreSQL — no authentication (single-user app). One-time setup:

```bash
createdb time_tracker
psql -d time_tracker -f schema.sql
```

Set `DATABASE_URL` in `.env.local` (template in `.env.example`). `schema.sql` is the source
of truth for the schema.

## Architecture

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 via `@tailwindcss/postcss`
- **Database**: local PostgreSQL via the `pg` driver — pooled `query()` helper in `src/lib/db.ts`. No auth, no `user_id` scoping.
- **Path alias**: `@/*` maps to `./src/*`

### Directory Structure

- `src/app/` — App Router pages and layouts
- `public/` — Static assets

### Key Conventions

- App Router: all routes live under `src/app/` using file-based routing (`page.tsx`, `layout.tsx`, `loading.tsx`, etc.)
- Server Components are the default; add `"use client"` directive only when client interactivity is needed
- ESLint uses the flat config format (`eslint.config.mjs`) with `eslint-config-next`

### Data Access

- All DB access is server-side. `src/lib/db.ts` exposes a `query()` helper over a pooled `pg` client (reads `DATABASE_URL`).
- Mutations live in Server Actions under `src/lib/actions/` (`folders`, `tasks`, `subtasks`, `time-entries`); server components read via `query()`.
- Client components (e.g. the timer in `src/components/timer/`) never touch the DB directly — they call server actions.
- The data pages (`tasks`, `dashboard`) set `export const dynamic = "force-dynamic"` so they aren't prerendered at build time.
