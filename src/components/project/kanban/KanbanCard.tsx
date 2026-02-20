"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CheckSquare, ChevronRight, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Story, Task, ProjectUser } from "./types";
import { AssigneeDropdown } from "./AssigneeDropdown";
import { PriorityDropdown } from "./PriorityDropdown";
import { SubtasksList } from "./SubtasksList";

interface KanbanCardProps {
  story: Story;
  onClick: () => void;
  isExpanded: boolean;
  tasks: Task[];
  isLoadingTasks: boolean;
  onToggleSubtasks: () => void;
  onPriorityChange: (priority: number) => void;
  onAssigneeChange: (assigneeId: string | null, assignSubtasks: boolean) => void;
  projectUsers: ProjectUser[];
  onTaskAssigneeChange?: (storyId: string, taskId: string, assigneeId: string | null, assignee?: { name: string | null; email: string } | null) => void;
  onTaskStatusChange?: (storyId: string, taskId: string, status: "TODO" | "DONE") => void;
}

export function KanbanCard({
  story,
  onClick,
  isExpanded,
  tasks,
  isLoadingTasks,
  onToggleSubtasks,
  onPriorityChange,
  onAssigneeChange,
  projectUsers,
  onTaskAssigneeChange,
  onTaskStatusChange,
}: KanbanCardProps) {
  const {
    setNodeRef,
    transform,
    transition,
    isDragging,
    listeners,
    attributes,
  } = useSortable({
    id: story.id,
    data: { type: "Story", story },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const hasSubtasks = story.subtasks > 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("relative", isDragging && "opacity-30")}
      {...attributes}
      {...listeners}
    >
      <Card
        className={cn(
          "border transition-shadow hover:shadow-md cursor-pointer py-0 gap-0",
          isDragging && "shadow-lg rotate-1"
        )}
        onClick={onClick}
      >
        <CardContent className="p-0 px-0">
          <div className="px-2.5 py-2">
            {/* Grid layout: ID/Title left, Avatar/Priority right - aligned columns */}
            <div className="grid grid-cols-[1fr_auto] gap-x-2">
              {/* Row 1: ID */}
              <span className="text-[10px] font-mono text-muted-foreground font-medium leading-none mt-2">
                {story.type}-{story.storyNumber}
              </span>
              {/* Row 1: Avatar - centered in its column */}
              <div className="flex justify-center">
                <AssigneeDropdown
                  assignee={story.assignee}
                  assigneeId={story.assigneeId}
                  projectUsers={projectUsers}
                  subtasksCount={story.subtasks}
                  onAssigneeChange={onAssigneeChange}
                />
              </div>
              {/* Row 2: Title with top margin for spacing */}
              <p className="text-sm font-medium leading-snug mt-3">{story.title}</p>
              {/* Row 2: Priority - centered in its column, aligned with title */}
              <div className="flex justify-center items-start mt-3">
                <PriorityDropdown
                  currentPriority={story.priority}
                  onPriorityChange={onPriorityChange}
                />
              </div>
            </div>

            {/* Bottom Row - Full width clickable button to toggle subtasks */}
            {hasSubtasks ? (
              <button
                className="w-full flex items-center justify-between mt-3 cursor-pointer group/subtasks"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSubtasks();
                }}
              >
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <CheckSquare className="h-3 w-3" />
                  <span className={story.completedSubtasks === story.subtasks && story.subtasks > 0 ? "text-emerald-600 font-medium" : ""}>
                    {story.completedSubtasks}/{story.subtasks}
                  </span>
                </div>

                <div className="h-5 w-5 flex items-center justify-center">
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-hover/subtasks:text-foreground transition-colors" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover/subtasks:text-foreground transition-colors" />
                  )}
                </div>
              </button>
            ) : (
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
                  <CheckSquare className="h-3 w-3" />
                  <span>0/0</span>
                </div>
              </div>
            )}
          </div>

          {/* Expanded Subtasks */}
          {isExpanded && hasSubtasks && (
            <div className="border-t bg-muted/30" onClick={(e) => e.stopPropagation()}>
              <SubtasksList 
                tasks={tasks} 
                isLoading={isLoadingTasks}
                storyId={story.id}
                storyType={story.type}
                storyNumber={story.storyNumber}
                projectUsers={projectUsers}
                onTaskAssigneeChange={onTaskAssigneeChange}
                onTaskStatusChange={onTaskStatusChange}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
