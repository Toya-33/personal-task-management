# ADR-002: Folders → Tasks → Subtasks → Time Entries Hierarchy

**Date:** 2026-02 (project inception)
**Status:** Accepted

## Context

Needed a data model that supports:
- Organizing work into categories
- Breaking work into trackable units
- Tracking time at a granular level
- Aggregating time up the hierarchy

## Decision

Adopted a 4-level hierarchy:

```
Folders (organizational containers, e.g., "Work", "Side Project")
  └── Tasks (work items, e.g., "Build login page")
        └── Subtasks (atomic units, e.g., "Create form component")
              └── Time Entries (tracking sessions with start/end timestamps)
```

Time is tracked at the **subtask level** and aggregated upward.

## Rationale

- Folders give high-level organization without overcomplicating things
- Tasks are the main unit of work — they have status, description, and group related subtasks
- Subtasks are what you actually *do* — they're the atomic unit that gets a timer
- Time entries are raw data — multiple sessions per subtask, each with start/end times

## Consequences

- **Positive**: Flexible enough for different workflows
- **Positive**: Aggregation is straightforward (sum time entries → subtask total → task total → folder total)
- **Negative**: 4 levels of nesting can make queries verbose (need to join across tables)
- **Negative**: The tasks page server component does in-memory aggregation, which works now but may need optimization at scale
