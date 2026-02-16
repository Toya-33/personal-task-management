"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useTimer } from "./timer-provider";
import { formatTimer } from "@/lib/utils/time";
import { Button } from "@/components/ui/button";
import { Square, CheckCircle2, GripVertical, Clock } from "lucide-react";

export function FloatingTimer() {
  const { activeSubtask, elapsed, isRunning, stopTimer, completeTimer } =
    useTimer();
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const timerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      dragOffset.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
    },
    [position]
  );

  useEffect(() => {
    if (!isDragging) return;

    function handleMouseMove(e: MouseEvent) {
      setPosition({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      });
    }

    function handleMouseUp() {
      setIsDragging(false);
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  if (!isRunning || !activeSubtask) return null;

  return (
    <div
      ref={timerRef}
      className="fixed z-50 flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-lg"
      style={{
        left: position.x,
        top: position.y,
        cursor: isDragging ? "grabbing" : "default",
        userSelect: "none",
      }}
    >
      <div
        className="cursor-grab text-muted-foreground hover:text-foreground"
        onMouseDown={handleMouseDown}
      >
        <GripVertical className="h-4 w-4" />
      </div>

      <Clock className="h-4 w-4 text-primary animate-pulse" />

      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground truncate max-w-[150px]">
          {activeSubtask.task_title && (
            <span>{activeSubtask.task_title} / </span>
          )}
          {activeSubtask.title}
        </span>
        <span className="font-mono text-lg font-semibold tabular-nums">
          {formatTimer(elapsed)}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={stopTimer}
          title="Stop timer"
        >
          <Square className="h-4 w-4 text-destructive" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={completeTimer}
          title="Complete subtask"
        >
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </Button>
      </div>
    </div>
  );
}
