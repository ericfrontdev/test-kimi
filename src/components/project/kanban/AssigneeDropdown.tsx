"use client";

import { useState } from "react";
import { UserPlus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/utils";
import type { ProjectUser } from "./types";

interface AssigneeDropdownProps {
  assignee: { name: string | null; email: string } | null | undefined;
  assigneeId: string | null | undefined;
  projectUsers: ProjectUser[];
  subtasksCount: number;
  onAssigneeChange: (assigneeId: string | null, assignSubtasks: boolean) => void;
}

export function AssigneeDropdown({
  assignee,
  assigneeId,
  projectUsers,
  subtasksCount,
  onAssigneeChange,
}: AssigneeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [assignSubtasks, setAssignSubtasks] = useState(true);

  const hasSubtasks = subtasksCount > 0;

  function handleSelect(userId: string | null) {
    onAssigneeChange(userId, assignSubtasks);
    setIsOpen(false);
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 p-0 cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        >
          {assignee ? (
            <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center text-[8px] font-medium text-primary-foreground">
              {getInitials(assignee.name || assignee.email).slice(0, 1)}
            </div>
          ) : (
            <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52" onClick={(e) => e.stopPropagation()}>
        {/* Checkbox for subtasks assignment - only show if there are subtasks */}
        {hasSubtasks && (
          <>
            <div className="px-2 py-2">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <Checkbox
                  checked={assignSubtasks}
                  onCheckedChange={(checked) => setAssignSubtasks(checked as boolean)}
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="text-muted-foreground">
                  Aussi assigner les {subtasksCount} sous-tâches
                </span>
              </label>
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem
          className="text-xs cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            handleSelect(null);
          }}
        >
          <span className="text-muted-foreground">Non assignée</span>
          {!assigneeId && <Check className="h-3 w-3 ml-auto" />}
        </DropdownMenuItem>

        {projectUsers.map((user) => (
          <DropdownMenuItem
            key={user.id}
            className="text-xs flex items-center gap-2 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handleSelect(user.id);
            }}
          >
            <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-medium">
              {getInitials(user.name || user.email).slice(0, 1)}
            </div>
            <span className="truncate">{user.name || user.email}</span>
            {assigneeId === user.id && <Check className="h-3 w-3 ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
