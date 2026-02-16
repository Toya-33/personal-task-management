"use client";

import { useState } from "react";
import type { TaskWithSubtasks } from "@/types/database";
import { SubtaskItem } from "./subtask-item";
import { formatDuration } from "@/lib/utils/time";
import { deleteTask, updateTask } from "@/lib/actions/tasks";
import { createSubtask } from "@/lib/actions/subtasks";
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
  MoreHorizontal,
  Plus,
  Trash2,
  CheckCircle2,
} from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  in_progress: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  completed: "bg-green-500/10 text-green-600 dark:text-green-400",
};

export function TaskCard({ task }: { task: TaskWithSubtasks }) {
  const [open, setOpen] = useState(true);
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  async function handleAddSubtask() {
    if (!newSubtaskTitle.trim()) return;
    const fd = new FormData();
    fd.set("title", newSubtaskTitle.trim());
    fd.set("task_id", task.id);
    await createSubtask(fd);
    setNewSubtaskTitle("");
    setAddingSubtask(false);
  }

  async function handleMarkComplete() {
    await updateTask(task.id, { status: "completed" });
  }

  return (
    <Card>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="p-4">
          <div className="flex items-center gap-2">
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
                <span
                  className={`font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}
                >
                  {task.title}
                </span>
                <Badge
                  variant="secondary"
                  className={`text-xs ${statusColors[task.status]}`}
                >
                  {task.status.replace("_", " ")}
                </Badge>
              </div>
              {task.description && (
                <p className="text-sm text-muted-foreground mt-0.5 truncate">
                  {task.description}
                </p>
              )}
            </div>

            {task.total_seconds > 0 && (
              <span className="text-sm font-mono text-muted-foreground">
                {formatDuration(task.total_seconds)}
              </span>
            )}

            <span className="text-xs text-muted-foreground">
              {task.subtasks.length} subtask{task.subtasks.length !== 1 ? "s" : ""}
            </span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {task.status !== "completed" && (
                  <DropdownMenuItem onClick={handleMarkComplete}>
                    <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                    Mark complete
                  </DropdownMenuItem>
                )}
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
              {task.subtasks.map((subtask) => (
                <SubtaskItem
                  key={subtask.id}
                  subtask={subtask}
                  taskTitle={task.title}
                />
              ))}

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
