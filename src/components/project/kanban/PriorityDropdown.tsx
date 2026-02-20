"use client";

import { Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { priorityColors, priorityLabels } from "./types";

interface PriorityDropdownProps {
  currentPriority: number;
  onPriorityChange: (priority: number) => void;
}

export function PriorityDropdown({ currentPriority, onPriorityChange }: PriorityDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="shrink-0 mt-0.5 cursor-pointer" onClick={(e) => e.stopPropagation()}>
          <div 
            className={cn(
              "w-2.5 h-2.5 rounded-full",
              priorityColors[currentPriority as 0 | 1 | 2 | 3] || priorityColors[2]
            )}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40" onClick={(e) => e.stopPropagation()}>
        {([0, 1, 2, 3] as const).map((p) => (
          <DropdownMenuItem
            key={p}
            className="flex items-center gap-2 text-xs cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onPriorityChange(p);
            }}
          >
            <div className={cn("w-2 h-2 rounded-full", priorityColors[p])} />
            {priorityLabels[p]}
            {currentPriority === p && <Check className="h-3 w-3 ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
