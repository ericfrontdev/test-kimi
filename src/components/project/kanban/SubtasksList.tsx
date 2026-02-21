"use client";

import { useState } from "react";
import { useKanbanStore } from "@/stores/kanban";
import { SubtaskCard } from "./SubtaskCard";
import { SubtaskDetailDialog } from "./SubtaskDetailDialog";
import type { Task, ProjectUser, TaskStatus } from "./types";

interface SubtasksListProps {
  tasks: Task[];
  isLoading: boolean;
  storyId: string;
  storyType: string;
  storyNumber: number;
  projectUsers: ProjectUser[];
  onTaskAssigneeChange?: (storyId: string, taskId: string, assigneeId: string | null, assignee?: { name: string | null; email: string } | null) => void;
  onTaskStatusChange?: (storyId: string, taskId: string, status: TaskStatus) => void;
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
  const projectId = useKanbanStore((state) => state.currentProjectId);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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

  function handleTaskClick(task: Task) {
    setSelectedTask(task);
    setDialogOpen(true);
  }

  return (
    <>
      <div className="p-2 space-y-2">
        {tasks.map((task) => (
          <div 
            key={task.id} 
            className="pl-4 border-l-2 border-muted-foreground/20 cursor-pointer"
            onClick={() => handleTaskClick(task)}
          >
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

      <SubtaskDetailDialog
        task={selectedTask}
        storyId={storyId}
        storyType={storyType}
        storyNumber={storyNumber}
        projectId={projectId || ""}
        projectUsers={projectUsers}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAssigneeChange={onTaskAssigneeChange}
        onStatusChange={onTaskStatusChange}
      />
    </>
  );
}
