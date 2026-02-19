"use client";

import { useState } from "react";
import type { FolderWithTasks } from "@/types/database";
import { FolderList } from "./folder-list";
import { TaskCard } from "./task-card";
import { CreateFolderDialog } from "./create-folder-dialog";
import { CreateTaskDialog } from "./create-task-dialog";
import { Button } from "@/components/ui/button";
import { Plus, FolderOpen } from "lucide-react";

export function TaskManager({ folders }: { folders: FolderWithTasks[] }) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
    folders[0]?.id ?? null
  );
  const [viewFilter, setViewFilter] = useState<"pending" | "completed">("pending");

  const selectedFolder = folders.find((f) => f.id === selectedFolderId);

  // Compute filtered tasks based on view filter
  const filteredTasks = selectedFolder
    ? viewFilter === "pending"
      ? selectedFolder.tasks.filter((t) => t.status !== "completed")
      : selectedFolder.tasks.filter(
          (t) =>
            t.status === "completed" ||
            t.subtasks.some((s) => s.status === "completed")
        )
    : [];

  // Compute counts for tabs
  const pendingCount = selectedFolder
    ? selectedFolder.tasks.filter((t) => t.status !== "completed").length
    : 0;
  const completedCount = selectedFolder
    ? selectedFolder.tasks.filter(
        (t) =>
          t.status === "completed" ||
          t.subtasks.some((s) => s.status === "completed")
      ).length
    : 0;

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Folder sidebar */}
      <div className="w-full shrink-0 lg:w-64">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Folders
          </h2>
          <CreateFolderDialog>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Plus className="h-4 w-4" />
            </Button>
          </CreateFolderDialog>
        </div>
        <FolderList
          folders={folders}
          selectedId={selectedFolderId}
          onSelect={setSelectedFolderId}
        />
      </div>

      {/* Task list */}
      <div className="flex-1">
        {selectedFolder ? (
          <>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: selectedFolder.color }}
                />
                <h2 className="text-lg font-semibold">{selectedFolder.name}</h2>
              </div>
              <CreateTaskDialog folderId={selectedFolder.id}>
                <Button size="sm" className="gap-1">
                  <Plus className="h-4 w-4" />
                  Add Task
                </Button>
              </CreateTaskDialog>
            </div>

            {/* Tab toggle */}
            <div className="mb-4 flex gap-1 rounded-lg bg-muted p-1">
              <button
                onClick={() => setViewFilter("pending")}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewFilter === "pending"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Pending ({pendingCount})
              </button>
              <button
                onClick={() => setViewFilter("completed")}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewFilter === "completed"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Completed ({completedCount})
              </button>
            </div>

            {filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
                <FolderOpen className="mb-2 h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {viewFilter === "pending"
                    ? "No pending tasks. Create one to get started."
                    : "No completed tasks yet."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <TaskCard key={task.id} task={task} viewFilter={viewFilter} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
            <FolderOpen className="mb-2 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">
              Create a folder to organize your tasks.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
