"use client";

import { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDuration } from "@/lib/utils/time";
import type { TimeEntryWithRelations } from "./dashboard-content";

interface TimeEntriesTableProps {
  entries: TimeEntryWithRelations[];
}

interface AggregatedRow {
  subtaskId: string;
  folderName: string;
  folderColor: string;
  taskTitle: string;
  subtaskTitle: string;
  totalSeconds: number;
}

export function TimeEntriesTable({ entries }: TimeEntriesTableProps) {
  const rows = useMemo(() => {
    const map = new Map<string, AggregatedRow>();

    for (const entry of entries) {
      const subtask = entry.subtask;
      if (!subtask) continue;

      const existing = map.get(subtask.id);
      if (existing) {
        existing.totalSeconds += entry.duration_seconds ?? 0;
      } else {
        map.set(subtask.id, {
          subtaskId: subtask.id,
          folderName: subtask.task.folder.name,
          folderColor: subtask.task.folder.color,
          taskTitle: subtask.task.title,
          subtaskTitle: subtask.title,
          totalSeconds: entry.duration_seconds ?? 0,
        });
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => b.totalSeconds - a.totalSeconds
    );
  }, [entries]);

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        No time entries for this period.
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Folder</TableHead>
            <TableHead>Task</TableHead>
            <TableHead>Sub Task</TableHead>
            <TableHead className="text-right">Time Spent</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.subtaskId}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: row.folderColor }}
                  />
                  {row.folderName}
                </div>
              </TableCell>
              <TableCell>{row.taskTitle}</TableCell>
              <TableCell>{row.subtaskTitle}</TableCell>
              <TableCell className="text-right font-mono">
                {formatDuration(row.totalSeconds)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
