"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CheckSquare, ChevronRight, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useProjectStore } from "@/stores/project";
import type { Story } from "./types";
import { AssigneeDropdown } from "./AssigneeDropdown";
import { PriorityDropdown } from "./PriorityDropdown";
import { SubtasksList } from "./SubtasksList";

interface KanbanCardProps {
  story: Story;
  onClick: () => void;
}

export function KanbanCard({ story, onClick }: KanbanCardProps) {
  const expandedStories = useProjectStore((state) => state.expandedStories);
  const storyTasks = useProjectStore((state) => state.storyTasks);
  const projectUsers = useProjectStore((state) => state.projectUsers);
  const toggleStoryExpanded = useProjectStore((state) => state.toggleStoryExpanded);
  const updateStoryPriority = useProjectStore((state) => state.updateStoryPriority);
  const updateStoryAssignee = useProjectStore((state) => state.updateStoryAssignee);
  const updateTaskAssignee = useProjectStore((state) => state.updateTaskAssignee);

  const isExpanded = expandedStories.has(story.id);
  const tasks = storyTasks[story.id] || [];

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

  async function handleAssigneeChange(assigneeId: string | null, assignSubtasks: boolean) {
    const user = assigneeId ? projectUsers.find((u) => u.id === assigneeId) : null;
    const assignee = user
      ? { name: user.name, email: user.email, avatarUrl: user.avatarUrl ?? null }
      : null;

    await updateStoryAssignee(story.id, assigneeId, assignee);

    if (assignSubtasks && tasks.length > 0) {
      await Promise.all(
        tasks.map((task) => updateTaskAssignee(story.id, task.id, assigneeId, assignee))
      );
    }
  }

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
            <div className="grid grid-cols-[1fr_auto] gap-x-2">
              <span className="text-[10px] font-mono text-muted-foreground font-medium leading-none mt-2">
                {story.type}-{story.storyNumber}
              </span>
              <div className="flex justify-center">
                <AssigneeDropdown
                  assignee={story.assignee}
                  assigneeId={story.assigneeId}
                  projectUsers={projectUsers}
                  subtasksCount={story.subtasks}
                  onAssigneeChange={handleAssigneeChange}
                />
              </div>
              <p className="text-sm font-medium leading-snug mt-3">{story.title}</p>
              <div className="flex justify-center items-start mt-3">
                <PriorityDropdown
                  currentPriority={story.priority}
                  onPriorityChange={(priority) => updateStoryPriority(story.id, priority)}
                />
              </div>
            </div>

            {hasSubtasks ? (
              <button
                className="w-full flex items-center justify-between mt-3 cursor-pointer group/subtasks"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleStoryExpanded(story.id);
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

          {isExpanded && hasSubtasks && (
            <div className="border-t bg-muted/30" onClick={(e) => e.stopPropagation()}>
              <SubtasksList
                storyId={story.id}
                storyType={story.type}
                storyNumber={story.storyNumber}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
