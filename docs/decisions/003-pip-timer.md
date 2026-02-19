# ADR-003: Picture-in-Picture Timer Display

**Date:** 2026-02
**Status:** Accepted

## Context

The timer needs to be visible at all times while the user works — even when they switch to another app or minimize the browser. A simple in-page floating widget isn't sufficient because it disappears when the user leaves the tab.

## Decision

Used the **Document Picture-in-Picture API** to create an OS-level floating window for the timer display.

- Auto-opens when a timer starts
- Auto-closes when a timer stops
- Shows subtask name, elapsed time, and stop/complete controls
- Falls back to an in-page floating timer if the API is unavailable

## Rationale

- The PiP API creates a real OS window that stays on top, even when the browser is minimized
- No need for a separate Electron app or browser extension
- The fallback ensures the feature degrades gracefully

## Consequences

- **Positive**: Timer is always visible — this is the core UX value of the app
- **Negative**: Document PiP API has limited browser support (Chrome/Edge only as of 2026)
- **Negative**: Styling the PiP window requires injecting inline styles (no access to the app's CSS)
- **Lesson learned**: Initial implementation didn't stay visible at the OS window level — required a fix in commit `36d1bd5`
