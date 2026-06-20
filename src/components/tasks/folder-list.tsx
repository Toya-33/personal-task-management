"use client";

import type { FolderWithTasks } from "@/types/database";
import { formatDuration } from "@/lib/utils/time";
import {
  deleteFolder,
  updateFolder,
  reorderFolders,
} from "@/lib/actions/folders";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GripVertical, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
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

interface FolderListProps {
  folders: FolderWithTasks[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function FolderList({ folders, selectedId, onSelect }: FolderListProps) {
  // Local copy so a drag reorders instantly; reset to the server order when fresh
  // data arrives (adjusted during render, not in a sync effect).
  const [items, setItems] = useState(folders);
  const [prevFolders, setPrevFolders] = useState(folders);
  const [, startTransition] = useTransition();

  if (prevFolders !== folders) {
    setPrevFolders(folders);
    setItems(folders);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((f) => f.id === active.id);
    const newIndex = items.findIndex((f) => f.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    startTransition(() => {
      reorderFolders(next.map((f) => f.id));
    });
  }

  return (
    <DndContext
      id="dnd-folders"
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((f) => f.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-1">
          {items.map((folder) => (
            <SortableFolderRow
              key={folder.id}
              folder={folder}
              selected={selectedId === folder.id}
              onSelect={onSelect}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableFolderRow({
  folder,
  selected,
  onSelect,
}: {
  folder: FolderWithTasks;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: folder.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    zIndex: isDragging ? 10 : undefined,
  };

  async function handleRename() {
    const trimmed = editName.trim();
    if (!trimmed || trimmed === folder.name) {
      setIsEditing(false);
      return;
    }
    const fd = new FormData();
    fd.set("name", trimmed);
    await updateFolder(folder.id, fd);
    setIsEditing(false);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex items-center gap-1 rounded-lg px-2 py-2 text-sm cursor-pointer transition-colors ${
        selected
          ? "bg-accent text-accent-foreground"
          : "hover:bg-accent/50"
      }`}
      onClick={() => onSelect(folder.id)}
    >
      <button
        type="button"
        className="flex h-5 w-5 shrink-0 cursor-grab touch-none items-center justify-center text-muted-foreground/40 opacity-0 transition-opacity hover:text-muted-foreground group-hover:opacity-100 active:cursor-grabbing"
        aria-label="Drag to reorder folder"
        onClick={(e) => e.stopPropagation()}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: folder.color }}
      />
      {isEditing ? (
        <Input
          className="h-6 text-sm"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleRename();
            if (e.key === "Escape") setIsEditing(false);
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
                  setIsEditing(true);
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
  );
}
