"use client";

import { CheckSquare, ChevronRight, ChevronDown } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useProjectListStore, type ProjectList, type ListItem } from "@/stores/project-list";
import { priorityColors } from "@/components/project/kanban/types";

interface ListCardProps {
  list: ProjectList;
  projectId: string;
  onClick: () => void;
}

export function ListCard({ list, projectId, onClick }: ListCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: list.id,
    data: { type: "List", list },
  });

  const expandedLists = useProjectListStore((s) => s.expandedLists);
  const listItems = useProjectListStore((s) => s.listItems);
  const toggleListExpanded = useProjectListStore((s) => s.toggleListExpanded);
  const updateListItem = useProjectListStore((s) => s.updateListItem);

  const isExpanded = expandedLists.has(list.id);
  const fullItems = listItems[list.id];
  const doneCount = list.items.filter((i) => i.status === "DONE").length;
  const totalCount = list.items.length;
  const hasItems = totalCount > 0;
  const priorityColor = priorityColors[list.priority as keyof typeof priorityColors] ?? "bg-gray-400";

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

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
      updateListItem(list.id, itemId, { status: checked ? "TODO" : "DONE" });
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
        <CardContent className="p-0">
          <div className="px-2.5 py-2">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[10px] font-mono text-muted-foreground font-medium leading-none mt-0.5">
                LIST-{list.listNumber}
              </span>
              <div className={cn("mt-0.5 h-2 w-2 flex-shrink-0 rounded-full", priorityColor)} />
            </div>

            <p className="text-sm font-medium leading-snug mt-2">{list.title}</p>

            {hasItems ? (
              <button
                className="w-full flex items-center justify-between mt-3 cursor-pointer group/items"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleListExpanded(list.id);
                }}
              >
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <CheckSquare className="h-3 w-3" />
                  <span className={doneCount === totalCount ? "text-emerald-600 font-medium" : ""}>
                    {doneCount}/{totalCount}
                  </span>
                </div>
                <div className="h-5 w-5 flex items-center justify-center">
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-hover/items:text-foreground transition-colors" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover/items:text-foreground transition-colors" />
                  )}
                </div>
              </button>
            ) : (
              <div className="flex items-center gap-1 mt-3 text-[10px] text-muted-foreground/50">
                <CheckSquare className="h-3 w-3" />
                <span>0/0</span>
              </div>
            )}
          </div>

          {isExpanded && hasItems && (
            <div className="border-t bg-muted/30" onClick={(e) => e.stopPropagation()}>
              {!fullItems ? (
                <div className="px-3 py-2 text-[10px] text-muted-foreground">Chargement...</div>
              ) : (
                <div className="p-2 space-y-2">
                  {fullItems.map((item) => (
                    <div
                      key={item.id}
                      className="pl-4 border-l-2 border-muted-foreground/20"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ListItemCard
                        item={item}
                        onCheck={(checked) => handleItemCheck(item.id, checked)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ListItemCard({ item, onCheck }: { item: ListItem; onCheck: (checked: boolean) => void }) {
  return (
    <Card className="border bg-card/50 shadow-none hover:bg-card transition-colors py-0 gap-0">
      <CardContent className="p-0 px-3 py-2.5">
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={item.status === "DONE"}
            onCheckedChange={(checked) => onCheck(checked === true)}
            className="h-3.5 w-3.5 flex-shrink-0"
          />
          <p className={cn(
            "text-xs font-medium leading-snug flex-1",
            item.status === "DONE" && "line-through text-muted-foreground"
          )}>
            {item.title}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
