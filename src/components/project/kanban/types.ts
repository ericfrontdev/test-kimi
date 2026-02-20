"use client";

export interface Task {
  id: string;
  taskNumber: number;
  title: string;
  status: "TODO" | "DONE";
  assignee?: {
    name: string | null;
    email: string;
  } | null;
}

export interface Story {
  id: string;
  storyNumber: number;
  title: string;
  status: string;
  type: "FEATURE" | "FIX";
  priority: number;
  subtasks: number;
  completedSubtasks: number;
  assigneeId?: string | null;
  assignee?: {
    name: string | null;
    email: string;
  } | null;
}

export interface BoardTabProps {
  stories: Story[];
  projectId: string;
  onStoryStatusChange?: (storyId: string, newStatus: string) => void;
}

export interface ColumnProps {
  id: string;
  title: string;
  color: string;
  stories: Story[];
  onStoryClick: (story: Story) => void;
  expandedStories: Set<string>;
  storyTasks: Record<string, Task[]>;
  loadingTasks: Set<string>;
  onToggleSubtasks: (storyId: string) => void;
  onPriorityChange: (storyId: string, priority: number) => void;
  onAssigneeChange: (storyId: string, assigneeId: string | null, assignSubtasks: boolean) => void;
  projectUsers: ProjectUser[];
  onTaskAssigneeChange?: (storyId: string, taskId: string, assigneeId: string | null, assignee?: { name: string | null; email: string } | null) => void;
  onTaskStatusChange?: (storyId: string, taskId: string, status: "TODO" | "DONE") => void;
}

export interface ProjectUser {
  id: string;
  name: string | null;
  email: string;
}

export const columns = [
  { id: "TODO", title: "À faire", color: "bg-slate-400" },
  { id: "IN_PROGRESS", title: "En cours", color: "bg-blue-500" },
  { id: "IN_REVIEW", title: "En révision", color: "bg-amber-500" },
  { id: "DONE", title: "Terminé", color: "bg-emerald-500" },
] as const;

export const priorityColors = {
  0: "bg-red-500",
  1: "bg-orange-500",
  2: "bg-blue-500",
  3: "bg-gray-400",
} as const;

export const priorityLabels = {
  0: "P0 - Critique",
  1: "P1 - Haute",
  2: "P2 - Normale",
  3: "P3 - Basse",
} as const;
