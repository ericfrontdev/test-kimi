"use client";

import { useEffect } from "react";
import { Layers } from "lucide-react";
import { useMyWorkStore } from "@/stores/my-work";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function MyStories() {
  const { stories, isLoading, fetchMyWork } = useMyWorkStore();

  useEffect(() => {
    fetchMyWork();
  }, [fetchMyWork]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">Mes Stories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-sm text-muted-foreground">
            Chargement...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (stories.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">Mes Stories</CardTitle>
          <select className="rounded-md border px-2 py-1 text-sm">
            <option>À faire et en cours</option>
          </select>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-sm text-muted-foreground">
            Aucune story active. Créez-en une dans un projet !
          </div>
        </CardContent>
      </Card>
    );
  }

  const inProgressCount = stories.filter(
    (s) => s.status === "IN_PROGRESS"
  ).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Mes stories</CardTitle>
        <select className="rounded-md border px-2 py-1 text-sm">
          <option>À faire et en cours</option>
          <option>Toutes les stories</option>
        </select>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-md bg-muted/50 px-3 py-2 text-sm font-medium">
          En cours
          <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
            {inProgressCount}
          </span>
        </div>

        {stories.map((story) => (
          <div
            key={story.id}
            className="cursor-pointer rounded-md border p-3 transition-colors hover:bg-muted/30"
          >
            <div className="space-y-2">
              <h4 className="text-sm font-medium">{story.title}</h4>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Layers size={14} />
                {story.completedSubtasks > 0 && (
                  <span className="font-medium text-primary">
                    {story.completedSubtasks}/
                  </span>
                )}
                <span>Sous-tâche {story.subtasks}</span>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary" className="text-xs font-normal">
                  {story.project}
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
