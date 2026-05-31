import { query } from "@/lib/db";
import {
  DashboardContent,
  type TimeEntryWithRelations,
} from "@/components/dashboard/dashboard-content";
import type { Task, Folder } from "@/types/database";

// Reads live data from Postgres on every request — never prerender at build time.
export const dynamic = "force-dynamic";

interface EntryRow {
  id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  subtask_id: string;
  subtask_title: string;
  task_id: string;
  task_title: string;
  folder_id: string;
  folder_name: string;
  folder_color: string;
}

export default async function DashboardPage() {
  const [entryRows, tasks, folders] = await Promise.all([
    query<EntryRow>(
      `select te.id, te.started_at, te.ended_at, te.duration_seconds,
              s.id as subtask_id, s.title as subtask_title,
              t.id as task_id, t.title as task_title,
              f.id as folder_id, f.name as folder_name, f.color as folder_color
         from time_entries te
         join subtasks s on s.id = te.subtask_id
         join tasks t on t.id = s.task_id
         join folders f on f.id = t.folder_id
        where te.ended_at is not null`
    ),
    query<Task>("select * from tasks"),
    query<Folder>("select * from folders"),
  ]);

  const timeEntries: TimeEntryWithRelations[] = entryRows.map((r) => ({
    id: r.id,
    started_at: r.started_at,
    ended_at: r.ended_at,
    duration_seconds: r.duration_seconds,
    subtask: {
      id: r.subtask_id,
      title: r.subtask_title,
      task: {
        id: r.task_id,
        title: r.task_title,
        folder: {
          id: r.folder_id,
          name: r.folder_name,
          color: r.folder_color,
        },
      },
    },
  }));

  return (
    <div className="p-4 md:p-6 pt-14 md:pt-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Analytics and time tracking overview
        </p>
      </div>
      <DashboardContent
        timeEntries={timeEntries}
        tasks={tasks}
        folders={folders}
      />
    </div>
  );
}
