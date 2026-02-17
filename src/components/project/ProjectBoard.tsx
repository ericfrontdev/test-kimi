"use client";

import { useEffect, useState } from "react";
import { Layers } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Story {
  id: string;
  title: string;
  description: string | null;
  status: string;
  subtasks: number;
  completedSubtasks: number;
  author: string;
}

interface ProjectBoardProps {
  projectId: string;
  projectName: string;
}

const columns = [
  { id: "BACKLOG", title: "Backlog" },
  { id: "TODO", title: "To Do" },
  { id: "IN_PROGRESS", title: "In Progress" },
  { id: "IN_REVIEW", title: "In Review" },
  { id: "DONE", title: "Done" },
];

export function ProjectBoard({ projectId, projectName }: ProjectBoardProps) {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStories() {
      try {
        const response = await fetch(`/api/projects/${projectId}/stories`);
        if (response.ok) {
          const data = await response.json();
          setStories(data);
        }
      } catch (error) {
        console.error("Error fetching stories:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStories();
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">Loading board...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{projectName}</h2>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => {
          const columnStories = stories.filter(
            (s) => s.status === column.id
          );

          return (
            <div
              key={column.id}
              className="min-w-[280px] flex-1 rounded-lg bg-muted/30 p-3"
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
                      <h4 className="text-sm font-medium">{story.title}</h4>
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
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    No stories
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
