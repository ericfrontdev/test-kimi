"use client";

import { CheckSquare, ChevronDown, ChevronRight, GripVertical, Loader2, User } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { useProjectListStore, type ProjectList } from "@/stores/project-list";
import { priorityColors } from "@/components/project/kanban/types";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

interface ListCardProps {
  list: ProjectList;
  projectId: string;
  onClick: () => void;
}

export function ListCard({ list, projectId, onClick }: ListCardProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, isDragging } = useDraggable({
    id: list.id,
    data: { type: "List", list },
  });

  const expandedLists = useProjectListStore((s) => s.expandedLists);
  const listItems = useProjectListStore((s) => s.listItems);
  const toggleListExpanded = useProjectListStore((s) => s.toggleListExpanded);
  const updateListItem = useProjectListStore((s) => s.updateListItem);

  const [isToggling, setIsToggling] = useState(false);

  const isExpanded = expandedLists.has(list.id);
  const fullItems = listItems[list.id];
  const doneCount = list.items.filter((i) => i.status === "DONE").length;
  const totalCount = list.items.length;
  const priorityColor = priorityColors[list.priority as keyof typeof priorityColors] ?? "bg-gray-400";

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  async function handleToggleExpand(e: React.MouseEvent) {
    e.stopPropagation();
    setIsToggling(true);
    await toggleListExpanded(list.id);
    setIsToggling(false);
  }

  async function handleItemCheck(itemId: string, checked: boolean) {
    const newStatus = checked ? "DONE" : "TODO";
    updateListItem(list.id, itemId, { status: newStatus });

    try {
      await fetch(`/api/projects/${projectId}/lists/${list.id}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      // rollback
      updateListItem(list.id, itemId, { status: checked ? "TODO" : "DONE" });
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-lg border bg-card shadow-sm transition-all",
        isDragging && "opacity-30"
      )}
    >
      {/* Card header — clickable for detail dialog */}
      <div
        className="p-3 space-y-2 cursor-pointer hover:bg-muted/30 rounded-t-lg"
        onClick={onClick}
      >
        <div className="flex items-start gap-2">
          {/* Drag handle */}
          <button
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            className="mt-0.5 flex-shrink-0 cursor-grab text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
            onClick={(e) => e.stopPropagation()}
            aria-label="Déplacer"
          >
            <GripVertical size={14} />
          </button>

          <span className="text-sm font-medium leading-snug truncate flex-1">{list.title}</span>
          <div className={cn("mt-0.5 h-2 w-2 flex-shrink-0 rounded-full", priorityColor)} />
        </div>

        {list.assignee && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground ml-5">
            <User size={12} />
            <span>{list.assignee.name ?? list.assignee.email}</span>
          </div>
        )}
      </div>

      {/* Expanded items panel */}
      {isExpanded && (
        <div className="border-t bg-muted/30 px-3 py-2 space-y-1.5">
          {isToggling || !fullItems ? (
            <div className="flex justify-center py-1">
              <Loader2 size={14} className="animate-spin text-muted-foreground" />
            </div>
          ) : fullItems.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-1">Aucun item</p>
          ) : (
            fullItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <Checkbox
                  checked={item.status === "DONE"}
                  onCheckedChange={(checked) => handleItemCheck(item.id, checked === true)}
                  className="h-3.5 w-3.5"
                />
                <span className={cn("text-xs truncate", item.status === "DONE" && "line-through text-muted-foreground")}>
                  {item.title}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Expand toggle button */}
      <button
        className={cn(
          "w-full flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/30 transition-colors",
          isExpanded ? "rounded-b-lg border-t" : "rounded-b-lg"
        )}
        onClick={handleToggleExpand}
      >
        {isToggling ? (
          <Loader2 size={12} className="animate-spin" />
        ) : isExpanded ? (
          <ChevronDown size={12} />
        ) : (
          <ChevronRight size={12} />
        )}
        <CheckSquare size={12} />
        <span>{doneCount}/{totalCount} items</span>
      </button>
    </div>
  );
}
