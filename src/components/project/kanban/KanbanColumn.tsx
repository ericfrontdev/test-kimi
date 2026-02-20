"use client";

import { useSortable } from "@dnd-kit/sortable";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import { KanbanCard } from "./KanbanCard";
import type { ColumnProps } from "./types";

export function KanbanColumn({
  id,
  title,
  color,
  stories,
  onStoryClick,
  expandedStories,
  storyTasks,
  loadingTasks,
  onToggleSubtasks,
  onPriorityChange,
  onAssigneeChange,
  projectUsers,
  onTaskAssigneeChange,
  onTaskStatusChange,
}: ColumnProps) {
  const { setNodeRef, isOver } = useSortable({
    id,
    data: { type: "Column" },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-w-[300px] flex-1 rounded-lg bg-muted/30 p-3 transition-colors",
        isOver && "bg-muted/50 ring-2 ring-primary/20"
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${color}`} />
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
          {stories.length}
        </span>
      </div>

      <SortableContext items={stories.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 min-h-[100px]">
          {stories.map((story) => (
            <KanbanCard
              key={story.id}
              story={story}
              onClick={() => onStoryClick(story)}
              isExpanded={expandedStories.has(story.id)}
              tasks={storyTasks[story.id] || []}
              isLoadingTasks={loadingTasks.has(story.id)}
              onToggleSubtasks={() => onToggleSubtasks(story.id)}
              onPriorityChange={(priority) => onPriorityChange(story.id, priority)}
              onAssigneeChange={(assigneeId, assignSubtasks) => onAssigneeChange(story.id, assigneeId, assignSubtasks)}
              projectUsers={projectUsers}
              onTaskAssigneeChange={onTaskAssigneeChange}
              onTaskStatusChange={onTaskStatusChange}
            />
          ))}
          
          {stories.length === 0 && (
            <div className="rounded-md border-2 border-dashed p-4 text-center">
              <p className="text-xs text-muted-foreground">Aucune story</p>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
