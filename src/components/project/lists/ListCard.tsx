"use client";

import { CheckSquare, Flag, User } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import type { ProjectList } from "@/stores/project-list";
import { priorityColors } from "@/components/project/kanban/types";

interface ListCardProps {
  list: ProjectList;
  projectId: string;
  onClick: () => void;
}

export function ListCard({ list, onClick }: ListCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: list.id,
    data: { type: "List", list },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const doneCount = list.items.filter((i) => i.status === "DONE").length;
  const totalCount = list.items.length;
  const priorityColor = priorityColors[list.priority as keyof typeof priorityColors] ?? "bg-gray-400";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-lg border bg-card p-3 shadow-sm cursor-pointer hover:shadow-md transition-all space-y-2",
        isDragging && "opacity-30"
      )}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium leading-snug truncate flex-1">{list.title}</span>
        <div className={cn("mt-0.5 h-2 w-2 flex-shrink-0 rounded-full", priorityColor)} />
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {totalCount > 0 && (
          <div className="flex items-center gap-1">
            <CheckSquare size={12} />
            <span>{doneCount}/{totalCount}</span>
          </div>
        )}
        {list.assignee && (
          <div className="flex items-center gap-1 ml-auto">
            <User size={12} />
            <span>{list.assignee.name ?? list.assignee.email}</span>
          </div>
        )}
      </div>
    </div>
  );
}
