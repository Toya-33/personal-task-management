"use client";

import { useState, useEffect } from "react";
import type { TimeEntry } from "@/types/database";
import {
  getTimeEntriesForSubtask,
  updateTimeEntry,
  deleteTimeEntry,
} from "@/lib/actions/time-entries";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import { formatDuration } from "@/lib/utils/time";

// Parse "H:MM" or plain minutes into seconds. Returns null on invalid input.
function parseDuration(value: string): number | null {
  const trimmed = value.trim();
  const colonMatch = trimmed.match(/^(\d+):(\d{1,2})$/);
  if (colonMatch) {
    const h = parseInt(colonMatch[1], 10);
    const m = parseInt(colonMatch[2], 10);
    if (m >= 60) return null;
    return (h * 60 + m) * 60;
  }
  const numMatch = trimmed.match(/^(\d+)$/);
  if (numMatch) return parseInt(numMatch[1], 10) * 60;
  return null;
}

function toHHMM(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}:${String(m).padStart(2, "0")}`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface EditTimeDialogProps {
  subtaskId: string;
  subtaskTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function EditTimeDialog({
  subtaskId,
  subtaskTitle,
  open,
  onOpenChange,
  onSaved,
}: EditTimeDialogProps) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getTimeEntriesForSubtask(subtaskId).then((data) => {
      setEntries(data);
      const vals: Record<string, string> = {};
      data.forEach((e) => {
        vals[e.id] = toHHMM(e.duration_seconds ?? 0);
      });
      setEditValues(vals);
      setLoading(false);
    });
  }, [open, subtaskId]);

  async function handleSaveDuration(entryId: string) {
    const seconds = parseDuration(editValues[entryId] ?? "");
    if (seconds === null || seconds <= 0) {
      // Reset to original value
      const orig = entries.find((e) => e.id === entryId);
      if (orig) {
        setEditValues((prev) => ({
          ...prev,
          [entryId]: toHHMM(orig.duration_seconds ?? 0),
        }));
      }
      return;
    }

    await updateTimeEntry(entryId, seconds);
    setEntries((prev) =>
      prev.map((e) =>
        e.id === entryId ? { ...e, duration_seconds: seconds } : e,
      ),
    );
    onSaved();
  }

  async function handleDelete(entryId: string) {
    await deleteTimeEntry(entryId);
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
    onSaved();
  }

  const totalSeconds = entries.reduce(
    (sum, e) => sum + (e.duration_seconds ?? 0),
    0,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Time Entries</DialogTitle>
          <p className="text-sm text-muted-foreground text-wrap">
            {subtaskTitle}
          </p>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground text-sm">
            Loading…
          </div>
        ) : entries.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-sm">
            No time entries for this subtask.
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-md border px-3 py-2 space-y-1"
              >
                <p className="text-xs text-muted-foreground truncate">
                  {formatDateTime(entry.started_at)}
                  {entry.ended_at && (
                    <span> → {formatDateTime(entry.ended_at)}</span>
                  )}
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    className="h-7 w-24 text-right text-sm font-mono shrink-0"
                    value={editValues[entry.id] ?? ""}
                    onChange={(e) =>
                      setEditValues((prev) => ({
                        ...prev,
                        [entry.id]: e.target.value,
                      }))
                    }
                    onBlur={() => handleSaveDuration(entry.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                      if (e.key === "Escape") {
                        const orig = entries.find((en) => en.id === entry.id);
                        if (orig) {
                          setEditValues((prev) => ({
                            ...prev,
                            [entry.id]: toHHMM(orig.duration_seconds ?? 0),
                          }));
                        }
                        e.currentTarget.blur();
                      }
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(entry.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}

            <div className="flex justify-end pt-1 text-sm font-mono text-muted-foreground">
              Total: {formatDuration(totalSeconds)}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
