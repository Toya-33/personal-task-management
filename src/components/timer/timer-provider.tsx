"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  getActiveTimeEntry,
  startTimer as startTimerAction,
  stopTimer as stopTimerAction,
  completeTimer as completeTimerAction,
} from "@/lib/actions/time-entries";
import type { Subtask, TimeEntry } from "@/types/database";

interface TimerState {
  activeSubtask: (Subtask & { task_title?: string }) | null;
  activeTimeEntry: TimeEntry | null;
  elapsed: number;
  isRunning: boolean;
}

interface TimerContextType extends TimerState {
  startTimer: (subtask: Subtask & { task_title?: string }) => Promise<void>;
  stopTimer: () => Promise<void>;
  completeTimer: () => Promise<void>;
}

const TimerContext = createContext<TimerContextType | null>(null);

export function useTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error("useTimer must be used within TimerProvider");
  return ctx;
}

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TimerState>({
    activeSubtask: null,
    activeTimeEntry: null,
    elapsed: 0,
    isRunning: false,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Recover active timer on mount
  useEffect(() => {
    async function recover() {
      const active = await getActiveTimeEntry();
      if (active) {
        const elapsed = Math.floor(
          (Date.now() - new Date(active.entry.started_at).getTime()) / 1000
        );
        setState({
          activeSubtask: active.subtask,
          activeTimeEntry: active.entry,
          elapsed,
          isRunning: true,
        });
      }
    }
    recover();
  }, []);

  // Stop timer in DB when the tab/browser closes
  useEffect(() => {
    if (!state.isRunning) return;
    const handleBeforeUnload = () => navigator.sendBeacon("/api/stop-timer");
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [state.isRunning]);

  // Tick interval
  useEffect(() => {
    if (state.isRunning && state.activeTimeEntry) {
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor(
          (Date.now() - new Date(state.activeTimeEntry!.started_at).getTime()) / 1000
        );
        setState((prev) => ({ ...prev, elapsed }));
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.isRunning, state.activeTimeEntry]);

  const startTimer = useCallback(
    async (subtask: Subtask & { task_title?: string }) => {
      // The server action closes any running entry and marks this subtask in_progress.
      const entry = await startTimerAction(subtask.id);
      setState({
        activeSubtask: subtask,
        activeTimeEntry: entry,
        elapsed: 0,
        isRunning: true,
      });
    },
    []
  );

  const stopTimer = useCallback(async () => {
    if (!state.activeTimeEntry) return;
    await stopTimerAction(state.activeTimeEntry.id);
    setState({
      activeSubtask: null,
      activeTimeEntry: null,
      elapsed: 0,
      isRunning: false,
    });
  }, [state.activeTimeEntry]);

  const completeTimer = useCallback(async () => {
    if (!state.activeTimeEntry || !state.activeSubtask) return;
    await completeTimerAction(state.activeTimeEntry.id, state.activeSubtask.id);
    setState({
      activeSubtask: null,
      activeTimeEntry: null,
      elapsed: 0,
      isRunning: false,
    });
  }, [state.activeTimeEntry, state.activeSubtask]);

  return (
    <TimerContext.Provider
      value={{ ...state, startTimer, stopTimer, completeTimer }}
    >
      {children}
    </TimerContext.Provider>
  );
}
