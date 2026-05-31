"use server";

import { revalidatePath } from "next/cache";
import { query } from "@/lib/db";

export async function createSubtask(formData: FormData) {
  const title = formData.get("title") as string;
  const taskId = formData.get("task_id") as string;

  const rows = await query<{ max: number | null }>(
    "select max(sort_order) as max from subtasks where task_id = $1",
    [taskId]
  );
  const sortOrder = (rows[0]?.max ?? -1) + 1;

  await query(
    "insert into subtasks (task_id, title, sort_order) values ($1, $2, $3)",
    [taskId, title, sortOrder]
  );

  revalidatePath("/tasks");
}

export async function updateSubtask(
  subtaskId: string,
  data: { title?: string; status?: string }
) {
  // updated_at is maintained by the subtasks_updated_at trigger.
  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  if (data.title !== undefined) {
    fields.push(`title = $${i++}`);
    values.push(data.title);
  }
  if (data.status !== undefined) {
    fields.push(`status = $${i++}`);
    values.push(data.status);
  }
  if (fields.length === 0) return;

  values.push(subtaskId);
  await query(
    `update subtasks set ${fields.join(", ")} where id = $${i}`,
    values
  );
  revalidatePath("/tasks");
}

export async function deleteSubtask(subtaskId: string) {
  await query("delete from subtasks where id = $1", [subtaskId]);
  revalidatePath("/tasks");
}
