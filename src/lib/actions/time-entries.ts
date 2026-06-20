"use server";

import { revalidatePath } from "next/cache";
import { query } from "@/lib/db";
import type { Subtask, TimeEntry } from "@/types/database";

export interface ActiveTimer {
  entry: TimeEntry;
  subtask: Subtask & { task_title?: string };
}

const CLOSE_ENTRY = `set ended_at = now(),
        duration_seconds = floor(extract(epoch from (now() - started_at)))::int`;

/** The most recent still-running entry (ended_at IS NULL), with its subtask + task title. */
export async function getActiveTimeEntry(): Promise<ActiveTimer | null> {
  const rows = await query<{
    id: string;
    subtask_id: string;
    started_at: string;
    ended_at: string | null;
    duration_seconds: number | null;
    created_at: string;
    st_id: string;
    st_task_id: string;
    st_title: string;
    st_status: Subtask["status"];
    st_sort_order: number;
    st_created_at: string;
    st_updated_at: string;
    task_title: string;
  }>(
    `select te.id, te.subtask_id, te.started_at, te.ended_at, te.duration_seconds, te.created_at,
            s.id as st_id, s.task_id as st_task_id, s.title as st_title, s.status as st_status,
            s.sort_order as st_sort_order, s.created_at as st_created_at, s.updated_at as st_updated_at,
            t.title as task_title
       from time_entries te
       join subtasks s on s.id = te.subtask_id
       join tasks t on t.id = s.task_id
      where te.ended_at is null
      order by te.started_at desc
      limit 1`
  );

  const row = rows[0];
  if (!row) return null;

  return {
    entry: {
      id: row.id,
      subtask_id: row.subtask_id,
      started_at: row.started_at,
      ended_at: row.ended_at,
      duration_seconds: row.duration_seconds,
      created_at: row.created_at,
    },
    subtask: {
      id: row.st_id,
      task_id: row.st_task_id,
      title: row.st_title,
      status: row.st_status,
      sort_order: row.st_sort_order,
      created_at: row.st_created_at,
      updated_at: row.st_updated_at,
      task_title: row.task_title,
    },
  };
}

/** Close any running entry, start a new one for `subtaskId`, mark the subtask in_progress. */
export async function startTimer(subtaskId: string): Promise<TimeEntry> {
  await query(`update time_entries ${CLOSE_ENTRY} where ended_at is null`);

  const rows = await query<TimeEntry>(
    `insert into time_entries (subtask_id, started_at)
     values ($1, now())
     returning id, subtask_id, started_at, ended_at, duration_seconds, created_at`,
    [subtaskId]
  );

  await query(`update subtasks set status = 'in_progress' where id = $1`, [
    subtaskId,
  ]);

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return rows[0];
}

/** Stop a running entry: stamp ended_at and compute duration_seconds. */
export async function stopTimer(entryId: string): Promise<void> {
  await query(
    `update time_entries ${CLOSE_ENTRY} where id = $1 and ended_at is null`,
    [entryId]
  );
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

/** Fetch all completed time entries for a subtask, newest first. */
export async function getTimeEntriesForSubtask(
  subtaskId: string
): Promise<TimeEntry[]> {
  return query<TimeEntry>(
    `select id, subtask_id, started_at, ended_at, duration_seconds, created_at
       from time_entries
      where subtask_id = $1 and ended_at is not null
      order by started_at desc`,
    [subtaskId]
  );
}

/** Update a completed entry's duration and recalculate ended_at. */
export async function updateTimeEntry(
  entryId: string,
  durationSeconds: number
): Promise<void> {
  await query(
    `update time_entries
        set duration_seconds = $1,
            ended_at = started_at + ($1::int * interval '1 second')
      where id = $2 and ended_at is not null`,
    [durationSeconds, entryId]
  );
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

/** Delete a single time entry. */
export async function deleteTimeEntry(entryId: string): Promise<void> {
  await query("delete from time_entries where id = $1", [entryId]);
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

/** Stop a running entry and mark its subtask completed. */
export async function completeTimer(
  entryId: string,
  subtaskId: string
): Promise<void> {
  await query(
    `update time_entries ${CLOSE_ENTRY} where id = $1 and ended_at is null`,
    [entryId]
  );
  await query(`update subtasks set status = 'completed' where id = $1`, [
    subtaskId,
  ]);
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}
