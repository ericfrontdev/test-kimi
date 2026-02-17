"use client";

import { Layers } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Story {
  id: string;
  title: string;
  status: string;
  subtasks: number;
  completedSubtasks: number;
}

interface BacklogTabProps {
  stories: Story[];
}

export function BacklogTab({ stories }: BacklogTabProps) {
  const backlogStories = stories.filter((s) => s.status === "BACKLOG");
  const boardStories = stories.filter((s) => s.status !== "BACKLOG");

  return (
    <div className="space-y-6">
      {/* Section Backlog */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">
          Backlog
          <Badge variant="secondary" className="ml-2">
            {backlogStories.length}
          </Badge>
        </h3>
        <div className="space-y-2">
          {backlogStories.map((story) => (
            <Card key={story.id} className="cursor-pointer hover:bg-muted/50">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{story.title}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Layers size={14} />
                    <span>{story.subtasks} tasks</span>
                  </div>
                </div>
                <Badge variant="outline">Backlog</Badge>
              </CardContent>
            </Card>
          ))}
          {backlogStories.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aucune story dans le backlog
            </p>
          )}
        </div>
      </div>

      {/* Section Dans le Tableau */}
      {boardStories.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold">
            Dans le Tableau
            <Badge variant="secondary" className="ml-2">
              {boardStories.length}
            </Badge>
          </h3>
          <div className="space-y-2">
            {boardStories.map((story) => (
              <Card key={story.id} className="cursor-pointer hover:bg-muted/50">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{story.title}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <Layers size={14} />
                      <span>
                        {story.completedSubtasks}/{story.subtasks} tasks
                      </span>
                    </div>
                  </div>
                  <Badge>{story.status === "TODO" ? "À faire" : story.status === "IN_PROGRESS" ? "En cours" : story.status === "IN_REVIEW" ? "En révision" : story.status === "DONE" ? "Terminé" : story.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
