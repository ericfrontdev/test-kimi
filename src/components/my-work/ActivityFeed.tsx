"use client";

import { useEffect } from "react";
import { useMyWorkStore } from "@/stores/my-work";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  
  if (hours < 1) return "À l'instant";
  if (hours < 24) return `Il y a ${hours}h`;
  return date.toLocaleDateString('fr-CA');
}

export function ActivityFeed() {
  const { activities, isLoading, fetchMyWork } = useMyWorkStore();

  useEffect(() => {
    fetchMyWork();
  }, [fetchMyWork]);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">
            Mon fil d&apos;activité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-sm text-muted-foreground">
            Chargement...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">
          Mon fil d&apos;activité
        </CardTitle>
        <button className="text-muted-foreground hover:text-foreground">
          ⚙️
        </button>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-4 border-b pb-2 text-sm">
          <button className="border-b-2 border-primary pb-2 font-medium">
            Toute l&apos;activité
          </button>
          <button className="pb-2 text-muted-foreground hover:text-foreground">
            Commentaires
          </button>
          <button className="pb-2 text-muted-foreground hover:text-foreground">
            Mentions
          </button>
        </div>

        <div className="space-y-4">
          <div className="text-sm font-medium text-muted-foreground">Aujourd'hui</div>

          {activities.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Aucune activité récente
            </p>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-medium text-white">
                  E
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm leading-snug">{activity.content}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatTime(activity.time)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
