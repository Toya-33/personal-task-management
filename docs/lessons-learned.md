# Lessons Learned — Time Tracker V2

Mistakes, gotchas, and insights gathered during development.

---

## Architecture & Design

### 1. Big Bang First Commit
**What happened:** The entire core application (auth, database, task management, timer, dashboard, UI library) was built and committed as a single commit (`f1fa4ef`).

**Lesson:** Breaking work into smaller, focused commits makes it easier to:
- Track what changed and why
- Roll back specific features if something breaks
- Write meaningful commit messages
- Review code changes

**Going forward:** Aim for one feature or logical change per commit.

---

### 2. Database Schema Evolution — Adding `updated_at` After the Fact
**What happened:** The initial schema didn't include `updated_at` columns on `tasks` and `subtasks`. This was added later via a separate migration (`migration-add-updated-at.sql`).

**Lesson:** Think about what metadata you'll need for sorting, filtering, and display early on. `updated_at` is almost always useful — include it from the start.

**Tip:** A good baseline for any table: `id`, `user_id`, `created_at`, `updated_at`.

---

## Technical Insights

### 3. Picture-in-Picture API Quirks
**What happened:** The PiP timer initially wasn't visible when the browser was minimized or behind other windows. Required a fix in commit `36d1bd5`.

**Lesson:** The Document Picture-in-Picture API is relatively new and has browser-specific behaviors. Testing across different window states (minimized, behind other apps, fullscreen) is important for always-on-top features.

---

### 4. Timer Session Recovery
**Design insight:** The timer checks for incomplete time entries (where `ended_at` is null) on mount and resumes them. This handles:
- Page refreshes mid-session
- Browser crashes
- Navigation away and back

This pattern is worth reusing — any long-running operation should be recoverable from its persisted state.

---

### 5. Server Components + Client Components Boundary
**Pattern:** Pages are server components that fetch data, then pass it to client components for interactivity.

Example: `/tasks/page.tsx` (server) loads all data → `<TaskManager>` (client) handles UI interactions.

**Why it works:** Keeps data fetching on the server (faster, secure), while client components handle state and user interactions. The boundary is at the page level, which is clean and predictable.

---

### 6. Server Actions with `revalidatePath`
**Pattern:** All mutation server actions call `revalidatePath("/tasks")` after making changes.

**Gotcha:** This revalidates the entire page. If the app grows, more granular revalidation (e.g., `revalidateTag`) might be needed for performance.

---

## Process & Workflow

### 7. Uncommitted Work Tracking
**Observation:** As of the documentation date, there's a significant amount of uncommitted work (9 modified files, 6 new files).

**Lesson:** Commit frequently, even if it's a work-in-progress commit. It provides:
- A safety net (easy to revert)
- Clear progress markers
- Better context when returning to work after a break

---

*Add new entries as you discover them. Date each entry for future reference.*
