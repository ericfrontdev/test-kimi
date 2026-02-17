"use client";

import { Layers } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Story {
  id: string;
  title: string;
  status: string;
  subtasks: number;
  completedSubtasks: number;
}

interface BoardTabProps {
  stories: Story[];
}

const columns = [
  { id: "TODO", title: "À faire" },
  { id: "IN_PROGRESS", title: "En cours" },
  { id: "IN_REVIEW", title: "En révision" },
  { id: "DONE", title: "Terminé" },
];

export function BoardTab({ stories }: BoardTabProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column) => {
        const columnStories = stories.filter((s) => s.status === column.id);

        return (
          <div
            key={column.id}
            className="min-w-[260px] flex-1 rounded-lg bg-muted/30 p-3"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">{column.title}</h3>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                {columnStories.length}
              </span>
            </div>

            <div className="space-y-2">
              {columnStories.map((story) => (
                <Card
                  key={story.id}
                  className="cursor-pointer border transition-shadow hover:shadow-sm"
                >
                  <CardContent className="p-3">
                    <p className="text-sm font-medium">{story.title}</p>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Layers size={14} />
                      {story.completedSubtasks > 0 && (
                        <span className="font-medium text-primary">
                          {story.completedSubtasks}/
                        </span>
                      )}
                      <span>{story.subtasks}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {columnStories.length === 0 && (
                <div className="rounded-md border-2 border-dashed p-4 text-center">
                  <p className="text-xs text-muted-foreground">No stories</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
