"use client";

import { useState, useTransition } from "react";
import type { FolderWithTasks, TaskWithSubtasks } from "@/types/database";
import { FolderList } from "./folder-list";
import { TaskCard } from "./task-card";
import { CreateFolderDialog } from "./create-folder-dialog";
import { CreateTaskDialog } from "./create-task-dialog";
import { Button } from "@/components/ui/button";
import { Plus, FolderOpen } from "lucide-react";
import { reorderTasks } from "@/lib/actions/tasks";
import { mergeVisibleOrder } from "@/lib/utils/reorder";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

export function TaskManager({ folders }: { folders: FolderWithTasks[] }) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
    folders[0]?.id ?? null
  );
  const [viewFilter, setViewFilter] = useState<"pending" | "completed">("pending");
  const [, startTransition] = useTransition();

  const selectedFolder = folders.find((f) => f.id === selectedFolderId);

  // Local copy of the selected folder's tasks so a drag reorders instantly.
  // Reset to the server order when the folder changes or fresh data arrives —
  // adjusted during render (React's recommended alternative to a sync effect).
  const [orderedTasks, setOrderedTasks] = useState<TaskWithSubtasks[]>(
    () => selectedFolder?.tasks ?? []
  );
  const [syncedFrom, setSyncedFrom] = useState({ folders, selectedFolderId });
  if (
    syncedFrom.folders !== folders ||
    syncedFrom.selectedFolderId !== selectedFolderId
  ) {
    setSyncedFrom({ folders, selectedFolderId });
    setOrderedTasks(selectedFolder?.tasks ?? []);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Compute filtered tasks based on view filter
  const filteredTasks =
    viewFilter === "pending"
      ? orderedTasks.filter((t) => t.status !== "completed")
      : orderedTasks.filter(
          (t) =>
            t.status === "completed" ||
            t.subtasks.some((s) => s.status === "completed")
        );

  // Compute counts for tabs
  const pendingCount = orderedTasks.filter(
    (t) => t.status !== "completed"
  ).length;
  const completedCount = orderedTasks.filter(
    (t) =>
      t.status === "completed" ||
      t.subtasks.some((s) => s.status === "completed")
  ).length;

  function handleTaskDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const visibleIds = filteredTasks.map((t) => t.id);
    const oldIndex = visibleIds.indexOf(active.id as string);
    const newIndex = visibleIds.indexOf(over.id as string);
    if (oldIndex < 0 || newIndex < 0) return;

    const newVisibleIds = arrayMove(visibleIds, oldIndex, newIndex);
    const next = mergeVisibleOrder(orderedTasks, newVisibleIds);
    setOrderedTasks(next);
    startTransition(() => {
      reorderTasks(next.map((t) => t.id));
    });
  }

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
              <DndContext
                id="dnd-tasks"
                sensors={sensors}
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis]}
                onDragEnd={handleTaskDragEnd}
              >
                <SortableContext
                  items={filteredTasks.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {filteredTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        viewFilter={viewFilter}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
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
