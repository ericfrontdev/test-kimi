"use client";

import { useState } from "react";
import { UserPlus, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, getInitials } from "@/lib/utils";
import type { Task, ProjectUser, TaskStatus } from "./types";
import { TaskStatusDropdown } from "./TaskStatusDropdown";

interface SubtaskCardProps {
  task: Task;
  storyId: string;
  storyType: string;
  storyNumber: number;
  projectUsers: ProjectUser[];
  onAssigneeChange?: (storyId: string, taskId: string, assigneeId: string | null, assignee?: { name: string | null; email: string } | null) => void;
  onStatusChange?: (storyId: string, taskId: string, status: TaskStatus) => void;
}

export function SubtaskCard({ 
  task, 
  storyId,
  storyType, 
  storyNumber,
  projectUsers,
  onAssigneeChange,
  onStatusChange,
}: SubtaskCardProps) {
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  
  // Format: FEATURE-32-1 (story ID + task number)
  const subtaskId = `${storyType}-${storyNumber}-${task.taskNumber}`;

  function handleStatusChange(newStatus: TaskStatus) {
    onStatusChange?.(storyId, task.id, newStatus);
  }



  return (
    <Card className="border bg-card/50 shadow-none hover:bg-card transition-colors py-0 gap-0">
      <CardContent className="p-0 px-3 py-2.5">
        {/* Top Row: ID (left) - Assign button (right) */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-muted-foreground font-medium leading-none">
            {subtaskId}
          </span>
          
          {/* Assign button with dropdown */}
          <DropdownMenu open={isAssignOpen} onOpenChange={setIsAssignOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 p-0 -mr-1 cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                {task.assignee ? (
                  <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-[9px] font-medium text-primary-foreground">
                    {getInitials(task.assignee.name || task.assignee.email)}
                  </div>
                ) : (
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem
                className="text-xs cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onAssigneeChange?.(storyId, task.id, null);
                  setIsAssignOpen(false);
                }}
              >
                <span className="text-muted-foreground">Non assignée</span>
                {!task.assignee && <Check className="h-3 w-3 ml-auto" />}
              </DropdownMenuItem>
              {projectUsers.map((user) => (
                <DropdownMenuItem
                  key={user.id}
                  className="text-xs flex items-center gap-2 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    const assignee = { name: user.name, email: user.email };
                    onAssigneeChange?.(storyId, task.id, user.id, assignee);
                    setIsAssignOpen(false);
                  }}
                >
                  <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-medium">
                    {getInitials(user.name || user.email)}
                  </div>
                  <span className="truncate">{user.name || user.email}</span>
                  {task.assignee?.email === user.email && <Check className="h-3 w-3 ml-auto" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Middle: Title with status dropdown aligned right */}
        <div className="flex items-start gap-2 mt-2.5">
          <p className={cn(
            "text-xs font-medium leading-snug flex-1",
            task.status === "DONE" && "line-through text-muted-foreground"
          )}>
            {task.title}
          </p>
          
          {/* Status dropdown */}
          <TaskStatusDropdown
            currentStatus={task.status}
            onStatusChange={handleStatusChange}
            size="sm"
          />
        </div>
      </CardContent>
    </Card>
  );
}
