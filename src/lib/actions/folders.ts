"use server";

import { revalidatePath } from "next/cache";
import { query } from "@/lib/db";

export async function createFolder(formData: FormData) {
  const name = formData.get("name") as string;
  const color = (formData.get("color") as string) || "#6366f1";

  const rows = await query<{ max: number | null }>(
    "select max(sort_order) as max from folders"
  );
  const sortOrder = (rows[0]?.max ?? -1) + 1;

  await query(
    "insert into folders (name, color, sort_order) values ($1, $2, $3)",
    [name, color, sortOrder]
  );

  revalidatePath("/tasks");
}

export async function updateFolder(folderId: string, formData: FormData) {
  const name = formData.get("name") as string;
  const color = formData.get("color") as string | null;

  if (color) {
    await query("update folders set name = $1, color = $2 where id = $3", [
      name,
      color,
      folderId,
    ]);
  } else {
    await query("update folders set name = $1 where id = $2", [name, folderId]);
  }

  revalidatePath("/tasks");
}

export async function deleteFolder(folderId: string) {
  await query("delete from folders where id = $1", [folderId]);
  revalidatePath("/tasks");
}

// Persist a new folder order. `orderedIds` is the full list of folder ids in
// their new order; each row's sort_order becomes its index.
export async function reorderFolders(orderedIds: string[]) {
  if (orderedIds.length === 0) return;
  await query(
    `update folders as f
        set sort_order = v.ord
       from unnest($1::uuid[], $2::int[]) as v(id, ord)
      where f.id = v.id`,
    [orderedIds, orderedIds.map((_, i) => i)]
  );
  revalidatePath("/tasks");
}
