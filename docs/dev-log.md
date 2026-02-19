# Dev Log — Time Tracker V2

A chronological record of development progress, features added, and notable events.

---

## 2026-02-17 — Project Documentation Setup

- Created `docs/` directory with dev-log, lessons-learned, and architecture decision records
- Documented all existing features and progress up to this point

---

## Initial Development Phase

### Commit: `cd738e8` — Initial Scaffold

- Bootstrapped the project with **Create Next App** (Next.js 16, TypeScript, Tailwind CSS v4)
- Set up App Router structure under `src/app/`
- Configured path alias `@/*` → `./src/*`

### Commit: `f1fa4ef` — First Commit (Core Application)

This was the big bang commit — the entire core application was built and committed in one go. Here's everything that went in:

#### Authentication System
- Integrated **Supabase Auth** with email/password login and signup
- Built `/login` and `/signup` pages with form handling
- Added `/auth/callback` route for OAuth/email confirmation
- Implemented **Next.js middleware** to protect routes — unauthenticated users get redirected to `/login`, authenticated users on auth pages get redirected to `/tasks`

#### Database Schema (Supabase/PostgreSQL)
- Designed a 4-table relational schema: **folders → tasks → subtasks → time_entries**
- Each table scoped to users via `user_id` foreign key to `auth.users`
- Enabled **Row-Level Security (RLS)** on all tables — users can only access their own data
- Added indexes on key columns (`user_id`, `folder_id`, `task_id`, `subtask_id`, `started_at`)
- Set up cascade deletes via foreign key constraints

#### Task Management System
- Built the `/tasks` page as a **server component** that loads all data and aggregates time
- Created `<TaskManager>` client component with:
  - Folder sidebar with color-coded indicators and time totals
  - Folder CRUD (create with color picker, rename, delete)
  - Task cards with status badges, descriptions, time tracking, subtask counts
  - Subtask items with inline creation, status toggles, and timer controls
  - Tab filter for "Pending" vs "Completed" tasks
- Server actions for all mutations: `createTask`, `updateTask`, `deleteTask`, `createSubtask`, `updateSubtask`, `deleteSubtask`, `createFolder`, `updateFolder`, `deleteFolder`

#### Timer System
- Built a **TimerProvider** context to share timer state across the app
- Timer creates `time_entries` records with `started_at` timestamps
- Stopping records `ended_at` and calculates `duration_seconds`
- **Session recovery**: on mount, checks for incomplete time entries and resumes the timer
- Two display modes:
  - **Floating Timer**: draggable overlay widget with stop/complete controls
  - **PiP Timer**: uses Document Picture-in-Picture API for an OS-level floating window

#### Dashboard & Analytics
- Built `/dashboard` page with:
  - Period filtering (Today / This Week / This Month) + custom date range picker
  - Stats cards: total time, completed tasks, total tasks, folder count
  - **Time by Task** horizontal bar chart (top 10, colored by folder)
  - **Daily Time** area chart (hours per day)
  - **Task Completion** donut chart (completed vs pending)
  - **Time Entries Table** aggregated by subtask with folder/task hierarchy

#### App Shell & Navigation
- Responsive sidebar layout (fixed on desktop, drawer on mobile)
- Navigation links to `/tasks` and `/dashboard`
- Theme toggle (dark/light mode via `next-themes`)
- Sign out button

#### UI Component Library
- Installed and configured **17 shadcn/ui components**: button, card, input, dialog, tabs, badge, collapsible, dropdown-menu, sheet, separator, popover, tooltip, scroll-area, calendar, table, skeleton, sonner (toasts)

#### Utilities
- `formatDuration()` — converts seconds to "Xh Ym" format
- `formatTimer()` — converts seconds to "HH:MM:SS" for live timer display
- `cn()` — Tailwind class merging via clsx + tailwind-merge

### Commit: `36d1bd5` — Improve PiP to Be Visible on Window Level

- Fixed the Picture-in-Picture timer so it stays visible even when the browser is minimized or behind other windows
- This was the first iteration/improvement after the initial build

---

## Uncommitted Work in Progress

As of 2026-02-17, there are uncommitted changes across multiple files:

#### Modified Files
- `package.json` / `package-lock.json` — likely new dependencies added
- `src/app/(app)/tasks/page.tsx` — task page updates
- `src/components/dashboard/dashboard-content.tsx` — dashboard improvements
- `src/components/tasks/task-card.tsx` — task card changes
- `src/components/tasks/task-manager.tsx` — task manager updates
- `src/lib/actions/subtasks.ts` — subtask action changes
- `src/lib/actions/tasks.ts` — task action changes
- `src/types/database.ts` — type definition updates
- `supabase-schema.sql` — schema changes

#### New Files
- `migration-add-updated-at.sql` — migration to add `updated_at` columns to tasks and subtasks
- `src/components/dashboard/date-range-picker.tsx` — custom date range picker component
- `src/components/dashboard/time-entries-table.tsx` — time entries table component
- `src/components/ui/calendar.tsx` — calendar UI component
- `src/components/ui/popover.tsx` — popover UI component
- `src/components/ui/table.tsx` — table UI component

These changes appear to include:
1. Adding `updated_at` tracking to tasks and subtasks (with DB trigger for auto-update)
2. Building out the dashboard with date range picker and time entries table
3. Adding new UI components (calendar, popover, table) to support dashboard features
