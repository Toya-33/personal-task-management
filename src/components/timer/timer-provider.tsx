"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { createClient } from "@/lib/supabase/client";
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
      const supabase = createClient();
      const { data: entry } = await supabase
        .from("time_entries")
        .select("*, subtask:subtasks(*, task:tasks(title))")
        .is("ended_at", null)
        .order("started_at", { ascending: false })
        .limit(1)
        .single();

      if (entry) {
        const subtask = entry.subtask as unknown as Subtask & { task: { title: string } };
        const elapsed = Math.floor(
          (Date.now() - new Date(entry.started_at).getTime()) / 1000
        );
        setState({
          activeSubtask: { ...subtask, task_title: subtask.task?.title },
          activeTimeEntry: entry,
          elapsed,
          isRunning: true,
        });
      }
    }
    recover();
  }, []);

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
      const supabase = createClient();

      // Stop any running timer first
      if (state.activeTimeEntry) {
        const now = new Date().toISOString();
        const duration = Math.floor(
          (Date.now() - new Date(state.activeTimeEntry.started_at).getTime()) / 1000
        );
        await supabase
          .from("time_entries")
          .update({ ended_at: now, duration_seconds: duration })
          .eq("id", state.activeTimeEntry.id);
      }

      const { data: entry } = await supabase
        .from("time_entries")
        .insert({
          subtask_id: subtask.id,
          user_id: subtask.user_id,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (entry) {
        // Update subtask status to in_progress
        await supabase
          .from("subtasks")
          .update({ status: "in_progress" })
          .eq("id", subtask.id);

        setState({
          activeSubtask: subtask,
          activeTimeEntry: entry,
          elapsed: 0,
          isRunning: true,
        });
      }
    },
    [state.activeTimeEntry]
  );

  const stopTimer = useCallback(async () => {
    if (!state.activeTimeEntry) return;

    const supabase = createClient();
    const now = new Date().toISOString();
    const duration = Math.floor(
      (Date.now() - new Date(state.activeTimeEntry.started_at).getTime()) / 1000
    );

    await supabase
      .from("time_entries")
      .update({ ended_at: now, duration_seconds: duration })
      .eq("id", state.activeTimeEntry.id);

    setState({
      activeSubtask: null,
      activeTimeEntry: null,
      elapsed: 0,
      isRunning: false,
    });
  }, [state.activeTimeEntry]);

  const completeTimer = useCallback(async () => {
    if (!state.activeTimeEntry || !state.activeSubtask) return;

    const supabase = createClient();
    const now = new Date().toISOString();
    const duration = Math.floor(
      (Date.now() - new Date(state.activeTimeEntry.started_at).getTime()) / 1000
    );

    await supabase
      .from("time_entries")
      .update({ ended_at: now, duration_seconds: duration })
      .eq("id", state.activeTimeEntry.id);

    await supabase
      .from("subtasks")
      .update({ status: "completed" })
      .eq("id", state.activeSubtask.id);

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
