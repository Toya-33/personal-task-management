# ADR-004: Drop Supabase for local PostgreSQL, remove auth

**Date:** 2026-05-31
**Status:** Accepted
**Supersedes:** [ADR-001](001-nextjs-supabase-stack.md) (database + auth portions)

## Context

The app is single-user (only the owner). Supabase was providing hosted PostgreSQL plus
email/password auth with row-level security scoped by `user_id`. The auth layer added
friction with no benefit, and the data lived on Supabase's servers rather than locally.

## Decision

- Remove Supabase entirely (`@supabase/ssr`, `@supabase/supabase-js`, the browser/server/
  middleware clients, the login/signup/auth-callback routes, and the route-protection middleware).
- Run against the local **Homebrew PostgreSQL 17** using the `pg` driver, with a pooled
  `query()` helper in `src/lib/db.ts` and `DATABASE_URL` configuration.
- Drop authentication and the `user_id` columns / RLS policies. `schema.sql` is the new,
  consolidated schema (uses built-in `gen_random_uuid()`).
- Move the timer's data access (previously direct browser→Supabase calls) into Server Actions
  in `src/lib/actions/time-entries.ts`, since a local Postgres has no browser-reachable API.

## Rationale

- No multi-tenant requirement → auth + RLS are pure overhead for a single user.
- Local Postgres keeps the data on the owner's machine and removes the hosted dependency.
- `pg` is the standard Node driver; Server Actions keep all DB access server-side.

## Consequences

- **Positive**: simpler app, no auth flows, data owned locally, no vendor lock-in.
- **Positive**: all DB access is server-side and parameterized in one place (`src/lib/db.ts`).
- **Negative**: no built-in access control — acceptable because the app is single-user and
  not exposed publicly. Anyone who can reach the app can read/write all data.
- **Negative**: requires a running local PostgreSQL; Docker deployment must reach the host DB
  via `host.docker.internal` (and the host must accept those connections).
