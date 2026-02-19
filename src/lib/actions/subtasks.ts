"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createSubtask(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const title = formData.get("title") as string;
  const taskId = formData.get("task_id") as string;

  const { data: maxOrder } = await supabase
    .from("subtasks")
    .select("sort_order")
    .eq("task_id", taskId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  await supabase.from("subtasks").insert({
    user_id: user.id,
    task_id: taskId,
    title,
    sort_order: (maxOrder?.sort_order ?? -1) + 1,
  });

  revalidatePath("/tasks");
}

export async function updateSubtask(
  subtaskId: string,
  data: { title?: string; status?: string }
) {
  const supabase = await createClient();
  await supabase.from("subtasks").update({ ...data, updated_at: new Date().toISOString() }).eq("id", subtaskId);
  revalidatePath("/tasks");
}

export async function deleteSubtask(subtaskId: string) {
  const supabase = await createClient();
  await supabase.from("subtasks").delete().eq("id", subtaskId);
  revalidatePath("/tasks");
}
