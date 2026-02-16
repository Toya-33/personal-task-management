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
} from "lucide-react";

interface SubtaskItemProps {
  subtask: SubtaskWithTime;
  taskTitle: string;
}

export function SubtaskItem({ subtask, taskTitle }: SubtaskItemProps) {
  const { activeSubtask, isRunning, startTimer, stopTimer, completeTimer } =
    useTimer();
  const isActive = isRunning && activeSubtask?.id === subtask.id;
  const isCompleted = subtask.status === "completed";

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

  return (
    <div
      className={`group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent/50 ${
        isActive ? "bg-primary/5" : ""
      }`}
    >
      {isCompleted ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
      ) : (
        <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}

      <span
        className={`flex-1 ${isCompleted ? "line-through text-muted-foreground" : ""}`}
      >
        {subtask.title}
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
            className="text-destructive"
            onClick={() => deleteSubtask(subtask.id)}
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
