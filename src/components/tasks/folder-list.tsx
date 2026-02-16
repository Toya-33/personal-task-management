"use client";

import type { FolderWithTasks } from "@/types/database";
import { formatDuration } from "@/lib/utils/time";
import { deleteFolder, updateFolder } from "@/lib/actions/folders";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

interface FolderListProps {
  folders: FolderWithTasks[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function FolderList({ folders, selectedId, onSelect }: FolderListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  async function handleRename(folderId: string) {
    const fd = new FormData();
    fd.set("name", editName);
    await updateFolder(folderId, fd);
    setEditingId(null);
  }

  return (
    <div className="space-y-1">
      {folders.map((folder) => (
        <div
          key={folder.id}
          className={`group flex items-center gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors ${
            selectedId === folder.id
              ? "bg-accent text-accent-foreground"
              : "hover:bg-accent/50"
          }`}
          onClick={() => onSelect(folder.id)}
        >
          <div
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: folder.color }}
          />
          {editingId === folder.id ? (
            <Input
              className="h-6 text-sm"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={() => handleRename(folder.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename(folder.id);
                if (e.key === "Escape") setEditingId(null);
              }}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <>
              <span className="flex-1 truncate">{folder.name}</span>
              {folder.total_seconds > 0 && (
                <span className="text-xs text-muted-foreground">
                  {formatDuration(folder.total_seconds)}
                </span>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditName(folder.name);
                      setEditingId(folder.id);
                    }}
                  >
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteFolder(folder.id);
                    }}
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
