"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import type { ProjectList } from "@/stores/project-list";
import { priorityColors } from "@/components/project/kanban/types";

interface ListCardOverlayProps {
  list: ProjectList;
}

export function ListCardOverlay({ list }: ListCardOverlayProps) {
  const priorityColor = priorityColors[list.priority as keyof typeof priorityColors] ?? "bg-gray-400";

  return (
    <div className="rotate-1 scale-105 opacity-90">
      <Card className="border shadow-lg cursor-grabbing ring-2 ring-primary/30 py-0 gap-0">
        <CardContent className="p-0">
          <div className="px-2.5 py-2">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[10px] font-mono text-muted-foreground font-medium leading-none mt-0.5">
                LIST-{list.listNumber}
              </span>
              <div className={cn("mt-0.5 h-2 w-2 flex-shrink-0 rounded-full", priorityColor)} />
            </div>
            <p className="text-sm font-medium leading-snug mt-2">{list.title}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
