"use client";

import { useState, useMemo } from "react";
import type { Task, Folder } from "@/types/database";
import { StatsCards } from "./stats-cards";
import { TimeByTaskChart } from "./time-by-task-chart";
import { DailyTimeChart } from "./daily-time-chart";
import { CompletedTasksChart } from "./completed-tasks-chart";
import { PeriodSelector, type Period } from "./period-selector";

interface TimeEntryWithRelations {
  id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  subtask: {
    id: string;
    title: string;
    task: {
      id: string;
      title: string;
      folder: {
        id: string;
        name: string;
        color: string;
      };
    };
  };
}

interface DashboardContentProps {
  timeEntries: TimeEntryWithRelations[];
  tasks: Task[];
  folders: Folder[];
}

function getDateRange(period: Period): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  let start: Date;

  switch (period) {
    case "day":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "week":
      start = new Date(now);
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      break;
    case "month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
  }

  return { start, end };
}

export function DashboardContent({
  timeEntries,
  tasks,
  folders,
}: DashboardContentProps) {
  const [period, setPeriod] = useState<Period>("week");
  const { start, end } = getDateRange(period);

  const filteredEntries = useMemo(
    () =>
      timeEntries.filter((e) => {
        const entryDate = new Date(e.started_at);
        return entryDate >= start && entryDate <= end;
      }),
    [timeEntries, start, end]
  );

  const totalSeconds = filteredEntries.reduce(
    (sum, e) => sum + (e.duration_seconds ?? 0),
    0
  );

  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const pendingTasks = tasks.filter((t) => t.status !== "completed").length;

  // Time by task
  const timeByTask = useMemo(() => {
    const map = new Map<string, { name: string; seconds: number; color: string }>();
    for (const entry of filteredEntries) {
      const task = entry.subtask?.task;
      if (!task) continue;
      const existing = map.get(task.id) ?? {
        name: task.title,
        seconds: 0,
        color: task.folder?.color ?? "#6366f1",
      };
      existing.seconds += entry.duration_seconds ?? 0;
      map.set(task.id, existing);
    }
    return Array.from(map.values())
      .sort((a, b) => b.seconds - a.seconds)
      .slice(0, 10);
  }, [filteredEntries]);

  // Daily time series
  const dailyTime = useMemo(() => {
    const map = new Map<string, number>();
    const current = new Date(start);
    while (current <= end) {
      const key = current.toISOString().split("T")[0];
      map.set(key, 0);
      current.setDate(current.getDate() + 1);
    }
    for (const entry of filteredEntries) {
      const key = new Date(entry.started_at).toISOString().split("T")[0];
      map.set(key, (map.get(key) ?? 0) + (entry.duration_seconds ?? 0));
    }
    return Array.from(map.entries()).map(([date, seconds]) => ({
      date,
      hours: Math.round((seconds / 3600) * 100) / 100,
    }));
  }, [filteredEntries, start, end]);

  return (
    <div className="space-y-6">
      <PeriodSelector period={period} onChange={setPeriod} />

      <StatsCards
        totalSeconds={totalSeconds}
        completedTasks={completedTasks}
        totalTasks={tasks.length}
        totalFolders={folders.length}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <TimeByTaskChart data={timeByTask} />
        <DailyTimeChart data={dailyTime} />
      </div>

      <CompletedTasksChart
        completed={completedTasks}
        pending={pendingTasks}
      />
    </div>
  );
}
