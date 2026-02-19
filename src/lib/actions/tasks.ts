"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createTask(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const title = formData.get("title") as string;
  const description = formData.get("description") as string | null;
  const folderId = formData.get("folder_id") as string;

  const { data: maxOrder } = await supabase
    .from("tasks")
    .select("sort_order")
    .eq("folder_id", folderId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  await supabase.from("tasks").insert({
    user_id: user.id,
    folder_id: folderId,
    title,
    description: description || null,
    sort_order: (maxOrder?.sort_order ?? -1) + 1,
  });

  revalidatePath("/tasks");
}

export async function updateTask(
  taskId: string,
  data: { title?: string; description?: string; status?: string }
) {
  const supabase = await createClient();
  await supabase.from("tasks").update({ ...data, updated_at: new Date().toISOString() }).eq("id", taskId);
  revalidatePath("/tasks");
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient();
  await supabase.from("tasks").delete().eq("id", taskId);
  revalidatePath("/tasks");
}
