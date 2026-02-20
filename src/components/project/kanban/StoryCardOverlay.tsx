"use client";

import { CheckSquare, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Story } from "./types";
import { priorityColors } from "./types";

interface StoryCardOverlayProps {
  story: Story;
}

export function StoryCardOverlay({ story }: StoryCardOverlayProps) {
  const hasSubtasks = story.subtasks > 0;

  return (
    <Card className="border shadow-lg cursor-grabbing rotate-2 scale-105 ring-2 ring-primary/30 py-0 gap-0">
      <CardContent className="p-0 px-0">
        <div className="px-2.5 py-2">
          {/* Grid layout: ID/Title left, Avatar/Priority right - aligned columns */}
          <div className="grid grid-cols-[1fr_auto] gap-x-2">
            {/* Row 1: ID */}
            <span className="text-[10px] font-mono text-muted-foreground font-medium leading-none mt-2">
              {story.type}-{story.storyNumber}
            </span>
            {/* Row 1: Avatar placeholder - centered in its column */}
            <div className="h-5 w-5" />
            {/* Row 2: Title with top margin for spacing */}
            <p className="text-sm font-medium leading-snug mt-3">{story.title}</p>
            {/* Row 2: Priority - centered in its column, aligned with title */}
            <div className="flex justify-center items-start mt-3">
              <div 
                className={cn(
                  "w-2.5 h-2.5 rounded-full",
                  priorityColors[story.priority as 0 | 1 | 2 | 3] || priorityColors[2]
                )}
              />
            </div>
          </div>

          {/* Bottom Row */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <CheckSquare className="h-3 w-3" />
              <span>{story.completedSubtasks}/{story.subtasks}</span>
            </div>
            
            {hasSubtasks && (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
