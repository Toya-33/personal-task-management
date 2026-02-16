export interface Folder {
  id: string;
  user_id: string;
  name: string;
  color: string;
  sort_order: number;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  folder_id: string;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed";
  sort_order: number;
  created_at: string;
}

export interface Subtask {
  id: string;
  user_id: string;
  task_id: string;
  title: string;
  status: "pending" | "in_progress" | "completed";
  sort_order: number;
  created_at: string;
}

export interface TimeEntry {
  id: string;
  user_id: string;
  subtask_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  created_at: string;
}

// Extended types with relations
export interface SubtaskWithTime extends Subtask {
  total_seconds: number;
  time_entries?: TimeEntry[];
}

export interface TaskWithSubtasks extends Task {
  subtasks: SubtaskWithTime[];
  total_seconds: number;
}

export interface FolderWithTasks extends Folder {
  tasks: TaskWithSubtasks[];
  total_seconds: number;
}
