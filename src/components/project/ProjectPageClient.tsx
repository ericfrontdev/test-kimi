"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateStoryDialog } from "./CreateStoryDialog";
import { BacklogTab } from "./BacklogTab";
import { BoardTab } from "./BoardTab";
import { ArchivedTab } from "./ArchivedTab";
import { useRouter } from "next/navigation";
import type { Story } from "./kanban/types";
import { useProjectStore } from "@/stores/project";

// Dynamically import DescriptionTab to avoid hydration issues with dnd-kit
const DescriptionTab = dynamic(() => import("./DescriptionTab").then((mod) => mod.DescriptionTab), {
  ssr: false,
});

interface Project {
  id: string;
  name: string;
  description: string | null;
}

interface ProjectPageClientProps {
  project: Project;
  stories: Story[];
}

export function ProjectPageClient({ project, stories: initialStories }: ProjectPageClientProps) {
  const router = useRouter();
  const setProject = useProjectStore((state) => state.setProject);

  // Initialize / sync store with server-rendered data
  useEffect(() => {
    setProject(project.id, initialStories);
  }, [project.id, initialStories, setProject]);

  function handleStoryCreated() {
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
            projectId={project.id}
            onStoryCreated={handleStoryCreated}
          />
        </TabsContent>

        <TabsContent value="backlog" className="mt-6">
          <BacklogTab projectId={project.id} />
        </TabsContent>

        <TabsContent value="board" className="mt-6">
          <BoardTab projectId={project.id} />
        </TabsContent>

        <TabsContent value="archived" className="mt-6">
          <ArchivedTab projectId={project.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
