"use client";

import { cn } from "@/lib/utils";
import type { ProjectList } from "@/stores/project-list";
import { priorityColors } from "@/components/project/kanban/types";

interface ListCardOverlayProps {
  list: ProjectList;
}

export function ListCardOverlay({ list }: ListCardOverlayProps) {
  const priorityColor = priorityColors[list.priority as keyof typeof priorityColors] ?? "bg-gray-400";

  return (
    <div className="rounded-lg border bg-card p-3 shadow-lg cursor-grabbing rotate-1 scale-105 ring-2 ring-primary/30 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium leading-snug truncate flex-1">{list.title}</span>
        <div className={cn("mt-0.5 h-2 w-2 flex-shrink-0 rounded-full", priorityColor)} />
      </div>
    </div>
  );
}
