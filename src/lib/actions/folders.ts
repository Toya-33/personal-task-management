"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createFolder(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const name = formData.get("name") as string;
  const color = (formData.get("color") as string) || "#6366f1";

  const { data: maxOrder } = await supabase
    .from("folders")
    .select("sort_order")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  await supabase.from("folders").insert({
    user_id: user.id,
    name,
    color,
    sort_order: (maxOrder?.sort_order ?? -1) + 1,
  });

  revalidatePath("/tasks");
}

export async function updateFolder(folderId: string, formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;
  const color = formData.get("color") as string | null;

  const update: Record<string, string> = { name };
  if (color) update.color = color;

  await supabase.from("folders").update(update).eq("id", folderId);
  revalidatePath("/tasks");
}

export async function deleteFolder(folderId: string) {
  const supabase = await createClient();
  await supabase.from("folders").delete().eq("id", folderId);
  revalidatePath("/tasks");
}
