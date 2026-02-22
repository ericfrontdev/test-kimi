"use client";

import { useEffect, useState } from "react";
import { Calendar } from "lucide-react";
import { useMyWorkStore } from "@/stores/my-work";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Filter = "all" | "week";

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function getDaysUntil(iso: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(iso);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function urgencyClass(days: number): string {
  if (days < 0) return "text-red-600 font-semibold";
  if (days <= 2) return "text-red-500 font-medium";
  if (days <= 7) return "text-orange-500 font-medium";
  return "text-muted-foreground";
}

function dueDateLabel(days: number): string {
  if (days < 0) return `En retard de ${Math.abs(days)}j`;
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "Demain";
  return formatDate(new Date(Date.now() + days * 86400000).toISOString());
}

export function UpcomingDates() {
  const { upcomingStories, isLoading, fetchMyWork } = useMyWorkStore();
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    fetchMyWork();
  }, [fetchMyWork]);

  const filteredStories = upcomingStories.filter((story) => {
    if (filter === "week") {
      return getDaysUntil(story.dueDate) <= 7;
    }
    return true;
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">Échéances à venir</CardTitle>
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
      <CardTitle className="text-base font-semibold">Échéances à venir</CardTitle>
      <select
        className="rounded-md border px-2 py-1 text-sm"
        value={filter}
        onChange={(e) => setFilter(e.target.value as Filter)}
      >
        <option value="all">30 prochains jours</option>
        <option value="week">Cette semaine</option>
      </select>
    </CardHeader>
  );

  if (filteredStories.length === 0) {
    return (
      <Card>
        {header}
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <Calendar className="h-6 w-6 text-green-600" />
          </div>
          <p className="text-sm font-medium">Tout est à jour</p>
          <p className="text-xs text-muted-foreground">
            {filter === "week"
              ? "Aucune échéance cette semaine."
              : "Aucune échéance dans les 30 prochains jours."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {header}
      <CardContent className="space-y-2">
        {filteredStories.map((story) => {
          const days = getDaysUntil(story.dueDate);
          return (
            <div
              key={story.id}
              className="flex items-start justify-between gap-2 rounded-md border p-2.5"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <p className="truncate text-sm">{story.title}</p>
                <Badge variant="secondary" className="text-xs font-normal">
                  {story.project}
                </Badge>
              </div>
              <span className={cn("shrink-0 text-xs", urgencyClass(days))}>
                {dueDateLabel(days)}
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
