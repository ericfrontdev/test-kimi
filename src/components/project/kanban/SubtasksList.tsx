"use client";

import { useState } from "react";
import { useProjectStore } from "@/stores/project";
import { SubtaskCard } from "./SubtaskCard";
import { SubtaskDetailDialog } from "./SubtaskDetailDialog";
import type { Task } from "./types";

interface SubtasksListProps {
  storyId: string;
  storyType: string;
  storyNumber: number;
}

// Référence stable — évite de créer un nouveau [] à chaque appel du selector Zustand
const EMPTY_TASKS: Task[] = [];

export function SubtasksList({ storyId, storyType, storyNumber }: SubtasksListProps) {
  const tasks = useProjectStore((s) => s.storyTasks[storyId] ?? EMPTY_TASKS);
  const isLoading = useProjectStore((s) => s.loadingTasks.has(storyId));

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
            />
          </div>
        ))}
      </div>

      <SubtaskDetailDialog
        task={selectedTask}
        storyId={storyId}
        storyType={storyType}
        storyNumber={storyNumber}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
