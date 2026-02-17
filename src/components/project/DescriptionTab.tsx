"use client";

import { Folder, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateStoryDialog } from "./CreateStoryDialog";

interface ProjectInfo {
  name: string;
  description: string | null;
}

interface Story {
  id: string;
  title: string;
  status: string;
}

interface DescriptionTabProps {
  project: ProjectInfo;
  stories: Story[];
  projectId: string;
  onStoryCreated?: () => void;
}

export function DescriptionTab({
  project,
  stories,
  projectId,
  onStoryCreated,
}: DescriptionTabProps) {
  const inProgressStories = stories.filter((s) => s.status === "IN_PROGRESS");
  const todoStories = stories.filter((s) => s.status === "TODO");
  const backlogStories = stories.filter((s) => s.status === "BACKLOG");

  return (
    <div className="space-y-6">
      {/* Project Info Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Folder size={18} />
            Informations du projet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Nom
            </label>
            <p className="text-lg font-semibold">{project.name}</p>
          </div>
          {project.description && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Description
              </label>
              <p className="text-sm">{project.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stories Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText size={18} />
            Stories
          </CardTitle>
          <CreateStoryDialog
            projectId={projectId}
            variant="icon"
            onSuccess={onStoryCreated}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          {/* In Progress */}
          {inProgressStories.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                En cours
              </h4>
              <div className="space-y-2">
                {inProgressStories.map((story) => (
                  <div
                    key={story.id}
                    className="rounded-md border p-3 hover:bg-muted/50"
                  >
                    <p className="text-sm font-medium">{story.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* To Do */}
          {todoStories.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                À faire
              </h4>
              <div className="space-y-2">
                {todoStories.map((story) => (
                  <div
                    key={story.id}
                    className="rounded-md border p-3 hover:bg-muted/50"
                  >
                    <p className="text-sm font-medium">{story.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Backlog */}
          {backlogStories.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                Backlog
              </h4>
              <div className="space-y-2">
                {backlogStories.map((story) => (
                  <div
                    key={story.id}
                    className="rounded-md border p-3 hover:bg-muted/50"
                  >
                    <p className="text-sm font-medium">{story.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stories.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Aucune story. Cliquez sur le bouton + pour en créer une.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
