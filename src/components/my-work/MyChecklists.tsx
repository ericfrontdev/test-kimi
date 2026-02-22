"use client";

import { useEffect, useState } from "react";
import { CheckSquare } from "lucide-react";
import { useMyWorkStore } from "@/stores/my-work";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Filter = "active" | "done";
type ChecklistItemStatus = "TODO" | "IN_PROGRESS" | "DONE";

function cycleStatus(current: ChecklistItemStatus): ChecklistItemStatus {
  if (current === "TODO") return "IN_PROGRESS";
  if (current === "IN_PROGRESS") return "DONE";
  return "TODO";
}

function itemCheckedState(status: string): boolean | "indeterminate" {
  if (status === "DONE") return true;
  if (status === "IN_PROGRESS") return "indeterminate";
  return false;
}

export function MyChecklists() {
  const { checklistItems, isLoading, fetchMyWork, updateChecklistItemStatus } = useMyWorkStore();
  const [filter, setFilter] = useState<Filter>("active");

  useEffect(() => {
    fetchMyWork();
  }, [fetchMyWork]);

  const filteredItems = checklistItems.filter((item) =>
    filter === "active"
      ? item.status === "TODO" || item.status === "IN_PROGRESS"
      : item.status === "DONE"
  );

  async function handleCycle(item: typeof checklistItems[number]) {
    const newStatus = cycleStatus(item.status as ChecklistItemStatus);
    updateChecklistItemStatus(item.id, newStatus);
    await fetch(
      `/api/projects/${item.projectId}/stories/${item.storyId}/checklists/${item.checklistId}/items/${item.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      }
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">Mes checklists</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-sm text-muted-foreground">
            Chargement...
          </div>
        </CardContent>
      </Card>
    );
  }

  const header = (
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-base font-semibold">Mes checklists</CardTitle>
      <select
        className="rounded-md border px-2 py-1 text-sm"
        value={filter}
        onChange={(e) => setFilter(e.target.value as Filter)}
      >
        <option value="active">À faire et en cours</option>
        <option value="done">Terminé</option>
      </select>
    </CardHeader>
  );

  if (filteredItems.length === 0) {
    return (
      <Card>
        {header}
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <CheckSquare className="h-6 w-6 text-blue-600" />
          </div>
          <p className="text-sm font-medium">
            {filter === "active" ? "Aucun item de checklist actif" : "Aucun item terminé"}
          </p>
          <p className="text-xs text-muted-foreground">
            Ajoutez des éléments de checklist à n&apos;importe quelle story.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {header}
      <CardContent className="space-y-2">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-2 rounded-md border p-2.5"
          >
            <Checkbox
              checked={itemCheckedState(item.status)}
              onCheckedChange={() => handleCycle(item)}
              className="mt-0.5 flex-shrink-0"
            />
            <div className="min-w-0 flex-1 space-y-1">
              <p className={cn(
                "truncate text-sm",
                item.status === "DONE" && "line-through text-muted-foreground"
              )}>
                {item.title}
              </p>
              <div className="flex items-center gap-1.5">
                <Badge variant="secondary" className="text-xs font-normal">
                  {item.project}
                </Badge>
                <span className="truncate text-xs text-muted-foreground">
                  {item.story}
                </span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
