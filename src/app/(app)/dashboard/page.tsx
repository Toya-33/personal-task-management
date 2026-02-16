import { createClient } from "@/lib/supabase/server";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: timeEntries } = await supabase
    .from("time_entries")
    .select("*, subtask:subtasks(*, task:tasks(*, folder:folders(*)))")
    .not("ended_at", "is", null);

  const { data: tasks } = await supabase.from("tasks").select("*");
  const { data: folders } = await supabase.from("folders").select("*");

  return (
    <div className="p-4 md:p-6 pt-14 md:pt-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Analytics and time tracking overview
        </p>
      </div>
      <DashboardContent
        timeEntries={timeEntries ?? []}
        tasks={tasks ?? []}
        folders={folders ?? []}
      />
    </div>
  );
}
