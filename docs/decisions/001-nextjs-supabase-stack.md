# ADR-001: Next.js 16 + Supabase Stack

**Date:** 2026-02 (project inception)
**Status:** Accepted

## Context

Needed to build a time tracking application with:
- User authentication
- Real-time timer functionality
- Data persistence
- Analytics dashboard
- Modern, responsive UI

## Decision

Chose the following stack:
- **Next.js 16** with App Router — for server components, server actions, and file-based routing
- **Supabase** — for PostgreSQL database, authentication, and row-level security
- **Tailwind CSS v4** — for styling
- **shadcn/ui + Radix UI** — for accessible, composable UI components
- **Recharts** — for dashboard charts
- **TypeScript** — for type safety

## Rationale

- **Next.js 16**: Latest version with stable App Router, server components reduce client bundle, server actions simplify mutations
- **Supabase**: Free tier is generous, built-in auth saves time, RLS provides security at the database level, no need to build a separate backend
- **shadcn/ui**: Copy-paste components (not a dependency), easy to customize, built on Radix for accessibility
- **Recharts**: React-native charting, works well with server-rendered data

## Consequences

- **Positive**: Fast development, type-safe end-to-end, good DX with hot reload (Turbopack)
- **Positive**: RLS means security bugs are less likely — even if server code has flaws, the database enforces access control
- **Negative**: Supabase vendor lock-in for auth and database (mitigated by standard PostgreSQL underneath)
- **Negative**: shadcn/ui components are copied into the repo, so updates require manual merging
