"use client";

import type { SubtaskWithTime } from "@/types/database";
import { formatDuration } from "@/lib/utils/time";
import { deleteSubtask, updateSubtask } from "@/lib/actions/subtasks";
import { useTimer } from "@/components/timer/timer-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Play,
  Square,
  CheckCircle2,
  MoreHorizontal,
  Trash2,
  Circle,
  Pencil,
} from "lucide-react";
import { useState } from "react";
import { Input } from "../ui/input";

interface SubtaskItemProps {
  subtask: SubtaskWithTime;
  taskTitle: string;
}

export function SubtaskItem({ subtask, taskTitle }: SubtaskItemProps) {
  const { activeSubtask, isRunning, startTimer, stopTimer, completeTimer } =
    useTimer();
  const isActive = isRunning && activeSubtask?.id === subtask.id;
  const isCompleted = subtask.status === "completed";
  const [editName, setEditName] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  async function handleToggleTimer() {
    if (isActive) {
      await stopTimer();
    } else {
      await startTimer({ ...subtask, task_title: taskTitle });
    }
  }

  async function handleComplete() {
    if (isActive) {
      await completeTimer();
    } else {
      await updateSubtask(subtask.id, { status: "completed" });
    }
  }

  async function toggleComplete() {
    if (isCompleted) {
      await updateSubtask(subtask.id, { status: "in_progress" });
    } else {
      if (isActive) {
        await completeTimer();
      } else {
        await updateSubtask(subtask.id, { status: "completed" });
      }
    }
  }

  async function handleRename() {
    const trimmed = editName.trim();
    if (!trimmed || trimmed === subtask.title) {
      setIsEditing(false);
      return;
    }
    await updateSubtask(subtask.id, { title: trimmed });
    setIsEditing(false);
  }

  return (
    <div
      className={`group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent/50 ${
        isActive ? "bg-primary/5" : ""
      }`}
    >
      {isEditing ? (
        <Input
          className="h-6 text-sm"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
            if (e.key === "Escape") {
              setIsEditing(false);
            }
          }}
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <>
          <Button variant="ghost" onClick={toggleComplete}>
            {isCompleted ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
            ) : (
              <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
          </Button>
          <span className="flex-1">
            {subtask.title}
            <p className="text-xs font-mono text-muted-foreground">
              Created: {subtask.created_at.split("T")[0]} |{" "}
              {isCompleted ? (
                <span>Completed: {subtask.updated_at.split("T")[0]}</span>
              ) : (
                <span>Updated: {subtask.updated_at.split("T")[0]}</span>
              )}
            </p>
          </span>

          {subtask.total_seconds > 0 && (
            <span className="text-xs font-mono text-muted-foreground">
              {formatDuration(subtask.total_seconds)}
            </span>
          )}

          {!isCompleted && (
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${isActive ? "text-destructive" : "text-primary opacity-0 group-hover:opacity-100"}`}
              onClick={handleToggleTimer}
              title={isActive ? "Stop timer" : "Start timer"}
            >
              {isActive ? (
                <Square className="h-3.5 w-3.5" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!isCompleted && (
                <DropdownMenuItem onClick={handleComplete}>
                  <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                  Mark complete
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setEditName(subtask.title);
                  setIsEditing(true);
                }}
              >
                <Pencil className="mr-2 h-3.5 w-3.5" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => deleteSubtask(subtask.id)}
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </div>
  );
}
