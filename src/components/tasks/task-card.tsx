"use client";

import { useTransition, useOptimistic, useState } from "react";
import type { TaskWithSubtasks, SubtaskWithTime } from "@/types/database";
import { SubtaskItem } from "./subtask-item";
import { formatDuration } from "@/lib/utils/time";
import { deleteTask, updateTask } from "@/lib/actions/tasks";
import { createSubtask, reorderSubtasks } from "@/lib/actions/subtasks";
import { mergeVisibleOrder } from "@/lib/utils/reorder";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  MoreHorizontal,
  Plus,
  Trash2,
  CheckCircle2,
  Pencil,
  RotateCcw,
} from "lucide-react";
import { useRouter } from "next/navigation";
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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  in_progress: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  completed: "bg-green-500/10 text-green-600 dark:text-green-400",
};

export function TaskCard({
  task,
  viewFilter = "pending",
}: {
  task: TaskWithSubtasks;
  viewFilter?: "pending" | "completed";
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Sortable wiring — connects this card to the task list's DndContext.
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });
  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    zIndex: isDragging ? 10 : undefined,
  };

  // Local state for instant UI
  const [isDeleted, setIsDeleted] = useState(false);
  const [taskStatus, setTaskStatus] = useState(task.status);
  const [open, setOpen] = useState(true);

  // Local copy of subtasks so a drag reorders instantly; reset to the server
  // order when fresh data arrives (adjusted during render, not in a sync effect).
  const [orderedSubtasks, setOrderedSubtasks] = useState(task.subtasks);
  const [prevSubtasks, setPrevSubtasks] = useState(task.subtasks);
  if (prevSubtasks !== task.subtasks) {
    setPrevSubtasks(task.subtasks);
    setOrderedSubtasks(task.subtasks);
  }
  const [optimisticSubtasks, addOptimisticSubtasks] = useOptimistic(
    orderedSubtasks,
    (state, newSubtask: SubtaskWithTime) => [...state, newSubtask],
  );

  // For renaming
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState("");

  // For adding subtask
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  if (isDeleted) return null;

  function filterSubtasks(list: SubtaskWithTime[]) {
    return viewFilter === "pending"
      ? list.filter((s) => s.status !== "completed")
      : list.filter((s) => s.status === "completed");
  }

  async function handleAddSubtask() {
    const title = newSubtaskTitle.trim();
    if (!title) return;

    setNewSubtaskTitle("");
    setAddingSubtask(false);

    const tempSubtask: SubtaskWithTime = {
      id: crypto.randomUUID(), // Temp ID for React 'key'
      title: title,
      status: "pending",
      total_seconds: 0,
      sort_order: orderedSubtasks.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      task_id: task.id,
    };

    startTransition(async () => {
      addOptimisticSubtasks(tempSubtask);
      try {
        const fd = new FormData();
        fd.set("title", title);
        fd.set("task_id", task.id);
        await createSubtask(fd);
        router.refresh();
      } catch (error) {
        console.error("Error: ", error);
      }
    });
  }

  async function handleToggleStatus() {
    const newStatus = taskStatus === "completed" ? "pending" : "completed";
    setTaskStatus(newStatus);
    await updateTask(task.id, { status: newStatus });
  }

  async function handleRenameTask() {
    const trimmed = editTitle.trim();
    if (!trimmed || trimmed === task.title) {
      setIsEditingTitle(false);
      return;
    }
    await updateTask(task.id, { title: trimmed });
    setIsEditingTitle(false);
  }

  function handleSubtaskDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Reorder against committed subtasks only — ignore any optimistic placeholder.
    const visibleIds = filterSubtasks(orderedSubtasks).map((s) => s.id);
    const oldIndex = visibleIds.indexOf(active.id as string);
    const newIndex = visibleIds.indexOf(over.id as string);
    if (oldIndex < 0 || newIndex < 0) return;

    const newVisibleIds = arrayMove(visibleIds, oldIndex, newIndex);
    const next = mergeVisibleOrder(orderedSubtasks, newVisibleIds);
    setOrderedSubtasks(next);
    startTransition(() => {
      reorderSubtasks(next.map((s) => s.id));
    });
  }

  // Use optimistic subtasks for instant UI
  const filteredSubtasks = filterSubtasks(optimisticSubtasks);

  return (
    <Card ref={setNodeRef} style={sortableStyle}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="p-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex h-6 w-6 shrink-0 cursor-grab touch-none items-center justify-center text-muted-foreground/40 transition-colors hover:text-muted-foreground active:cursor-grabbing"
              aria-label="Drag to reorder task"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4" />
            </button>

            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                {open ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {isEditingTitle ? (
                  <Input
                    className="h-7 text-sm font-medium"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={handleRenameTask}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                      if (e.key === "Escape") setIsEditingTitle(false);
                    }}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span
                    className={`font-medium ${taskStatus === "completed" ? "line-through text-muted-foreground" : ""}`}
                  >
                    {task.title}
                  </span>
                )}
                <Badge
                  variant="secondary"
                  className={`text-xs ${statusColors[taskStatus]}`}
                >
                  {taskStatus.replace("_", " ")}
                </Badge>
              </div>
              {task.description && (
                <p className="text-sm text-muted-foreground mt-0.5 truncate text-wrap">
                  {task.description}
                </p>
              )}
            </div>

            {task.total_seconds > 0 && (
              <p className="text-sm font-mono text-muted-foreground">
                {formatDuration(task.total_seconds)}
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              {filteredSubtasks.length} subtask
              {filteredSubtasks.length !== 1 ? "s" : ""}
            </p>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleToggleStatus}>
                  {taskStatus === "completed" ? (
                    <>
                      <RotateCcw className="mr-2 h-3.5 w-3.5" />
                      Reopen task
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                      Mark complete
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditTitle(task.title);
                    setIsEditingTitle(true);
                  }}
                >
                  <Pencil className="mr-2 h-3.5 w-3.5" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => deleteTask(task.id)}
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Delete task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="ml-6 space-y-1">
              <DndContext
                id={`dnd-subtasks-${task.id}`}
                sensors={sensors}
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis]}
                onDragEnd={handleSubtaskDragEnd}
              >
                <SortableContext
                  items={filteredSubtasks.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {filteredSubtasks.map((subtask) => (
                    <SubtaskItem
                      key={subtask.id}
                      subtask={subtask}
                      taskTitle={task.title}
                    />
                  ))}
                </SortableContext>
              </DndContext>

              {addingSubtask ? (
                <div className="flex items-center gap-2 pt-1">
                  <Input
                    className="h-8 text-sm"
                    placeholder="Subtask title..."
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddSubtask();
                      if (e.key === "Escape") setAddingSubtask(false);
                    }}
                    autoFocus
                  />
                  <Button size="sm" className="h-8" onClick={handleAddSubtask}>
                    Add
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs text-muted-foreground"
                  onClick={() => setAddingSubtask(true)}
                >
                  <Plus className="h-3 w-3" />
                  Add subtask
                </Button>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
