"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateStoryDialog } from "./CreateStoryDialog";
import { DescriptionTab } from "./DescriptionTab";
import { BacklogTab } from "./BacklogTab";
import { BoardTab } from "./BoardTab";
import { ArchivedTab } from "./ArchivedTab";
import { useRouter } from "next/navigation";
import type { Story } from "./kanban/types";

interface Project {
  id: string;
  name: string;
  description: string | null;
}

interface ProjectPageClientProps {
  project: Project;
  stories: Story[];
}

export function ProjectPageClient({ project, stories }: ProjectPageClientProps) {
  const router = useRouter();

  function handleStoryCreated() {
    router.refresh();
  }

  function handleStoryStatusChange(storyId: string, newStatus: string) {
    // Optimistic update would go here if needed
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <CreateStoryDialog
          projectId={project.id}
          variant="button"
          onSuccess={handleStoryCreated}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="description" className="w-full">
        <TabsList>
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="backlog">Backlog</TabsTrigger>
          <TabsTrigger value="board">Tableau</TabsTrigger>
          <TabsTrigger value="archived">Archivées</TabsTrigger>
        </TabsList>

        <TabsContent value="description" className="mt-6">
          <DescriptionTab
            project={{ name: project.name, description: project.description }}
            stories={stories}
            projectId={project.id}
            onStoryCreated={handleStoryCreated}
          />
        </TabsContent>

        <TabsContent value="backlog" className="mt-6">
          <BacklogTab 
            stories={stories} 
            projectId={project.id}
            onStoryStatusChange={handleStoryStatusChange}
          />
        </TabsContent>

        <TabsContent value="board" className="mt-6">
          <BoardTab 
            stories={stories} 
            projectId={project.id}
            onStoryStatusChange={handleStoryStatusChange}
          />
        </TabsContent>

        <TabsContent value="archived" className="mt-6">
          <ArchivedTab stories={stories} projectId={project.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
