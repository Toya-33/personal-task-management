import { createClient } from "@/lib/supabase/server";
import { TaskManager } from "@/components/tasks/task-manager";
import type { FolderWithTasks, TaskWithSubtasks, SubtaskWithTime } from "@/types/database";

export default async function TasksPage() {
  const supabase = await createClient();

  const { data: folders } = await supabase
    .from("folders")
    .select("*")
    .order("sort_order");

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .order("updated_at", { ascending: false });

  const { data: subtasks } = await supabase
    .from("subtasks")
    .select("*")
    .order("updated_at", { ascending: false });

  const { data: timeEntries } = await supabase
    .from("time_entries")
    .select("*");

  // Aggregate time per subtask
  const subtaskTimeMap = new Map<string, number>();
  for (const entry of timeEntries ?? []) {
    const seconds = entry.duration_seconds ?? 0;
    subtaskTimeMap.set(
      entry.subtask_id,
      (subtaskTimeMap.get(entry.subtask_id) ?? 0) + seconds
    );
  }

  // Build nested structure
  const subtasksByTask = new Map<string, SubtaskWithTime[]>();
  for (const st of subtasks ?? []) {
    const arr = subtasksByTask.get(st.task_id) ?? [];
    arr.push({ ...st, total_seconds: subtaskTimeMap.get(st.id) ?? 0 });
    subtasksByTask.set(st.task_id, arr);
  }

  const tasksByFolder = new Map<string, TaskWithSubtasks[]>();
  for (const t of tasks ?? []) {
    const subs = subtasksByTask.get(t.id) ?? [];
    const totalSeconds = subs.reduce((sum, s) => sum + s.total_seconds, 0);
    const arr = tasksByFolder.get(t.folder_id) ?? [];
    arr.push({ ...t, subtasks: subs, total_seconds: totalSeconds });
    tasksByFolder.set(t.folder_id, arr);
  }

  const foldersWithTasks: FolderWithTasks[] = (folders ?? []).map((f) => {
    const folderTasks = tasksByFolder.get(f.id) ?? [];
    const totalSeconds = folderTasks.reduce((sum, t) => sum + t.total_seconds, 0);
    return { ...f, tasks: folderTasks, total_seconds: totalSeconds };
  });

  return (
    <div className="p-4 md:p-6 pt-14 md:pt-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Task Manager</h1>
        <p className="text-muted-foreground">
          Organize your work and track time
        </p>
      </div>
      <TaskManager folders={foldersWithTasks} />
    </div>
  );
}
