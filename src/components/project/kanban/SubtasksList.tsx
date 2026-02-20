"use client";

import { SubtaskCard } from "./SubtaskCard";
import type { Task, ProjectUser } from "./types";

interface SubtasksListProps {
  tasks: Task[];
  isLoading: boolean;
  storyId: string;
  storyType: string;
  storyNumber: number;
  projectUsers: ProjectUser[];
  onTaskAssigneeChange?: (storyId: string, taskId: string, assigneeId: string | null, assignee?: { name: string | null; email: string } | null) => void;
  onTaskStatusChange?: (storyId: string, taskId: string, status: "TODO" | "DONE") => void;
}

export function SubtasksList({ 
  tasks, 
  isLoading, 
  storyId,
  storyType, 
  storyNumber,
  projectUsers,
  onTaskAssigneeChange,
  onTaskStatusChange,
}: SubtasksListProps) {
  if (isLoading) {
    return (
      <div className="px-3 py-2 text-[10px] text-muted-foreground">
        Chargement...
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="px-3 py-2 text-[10px] text-muted-foreground">
        Aucune sous-tâche
      </div>
    );
  }

  return (
    <div className="p-2 space-y-2">
      {tasks.map((task) => (
        <div key={task.id} className="pl-4 border-l-2 border-muted-foreground/20">
          <SubtaskCard 
            task={task} 
            storyId={storyId}
            storyType={storyType}
            storyNumber={storyNumber}
            projectUsers={projectUsers}
            onAssigneeChange={onTaskAssigneeChange}
            onStatusChange={onTaskStatusChange}
          />
        </div>
      ))}
    </div>
  );
}
