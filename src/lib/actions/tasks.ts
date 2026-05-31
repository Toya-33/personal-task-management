"use server";

import { revalidatePath } from "next/cache";
import { query } from "@/lib/db";

export async function createTask(formData: FormData) {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string | null;
  const folderId = formData.get("folder_id") as string;

  const rows = await query<{ max: number | null }>(
    "select max(sort_order) as max from tasks where folder_id = $1",
    [folderId]
  );
  const sortOrder = (rows[0]?.max ?? -1) + 1;

  await query(
    "insert into tasks (folder_id, title, description, sort_order) values ($1, $2, $3, $4)",
    [folderId, title, description || null, sortOrder]
  );

  revalidatePath("/tasks");
}

export async function updateTask(
  taskId: string,
  data: { title?: string; description?: string; status?: string }
) {
  // updated_at is maintained by the tasks_updated_at trigger.
  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  if (data.title !== undefined) {
    fields.push(`title = $${i++}`);
    values.push(data.title);
  }
  if (data.description !== undefined) {
    fields.push(`description = $${i++}`);
    values.push(data.description);
  }
  if (data.status !== undefined) {
    fields.push(`status = $${i++}`);
    values.push(data.status);
  }
  if (fields.length === 0) return;

  values.push(taskId);
  await query(`update tasks set ${fields.join(", ")} where id = $${i}`, values);
  revalidatePath("/tasks");
}

export async function deleteTask(taskId: string) {
  await query("delete from tasks where id = $1", [taskId]);
  revalidatePath("/tasks");
}
