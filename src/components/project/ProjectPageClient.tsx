"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateStoryDialog } from "./CreateStoryDialog";
import { BacklogTab } from "./BacklogTab";
import { BoardTab } from "./BoardTab";
import { ArchivedTab } from "./ArchivedTab";
import { useRouter, useSearchParams } from "next/navigation";
import type { Story } from "./kanban/types";
import { useProjectStore } from "@/stores/project";

const VALID_TABS = ["description", "backlog", "board", "archived"] as const;
type Tab = (typeof VALID_TABS)[number];

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
  hasMoreStories: boolean;
}

// Isolated component so useSearchParams is inside a Suspense boundary
function ProjectTabs({ project, onStoryCreated }: { project: Project; onStoryCreated: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawTab = searchParams.get("tab");
  const activeTab: Tab = VALID_TABS.includes(rawTab as Tab) ? (rawTab as Tab) : "description";

  function handleTabChange(tab: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
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
          onStoryCreated={onStoryCreated}
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
  );
}

export function ProjectPageClient({ project, stories: initialStories, hasMoreStories }: ProjectPageClientProps) {
  const router = useRouter();
  const setProject = useProjectStore((state) => state.setProject);

  useEffect(() => {
    setProject(project.id, initialStories, hasMoreStories);
  }, [project.id, initialStories, hasMoreStories, setProject]);

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

      {/* Tabs — Suspense required by useSearchParams in Next.js App Router */}
      <Suspense fallback={
        <Tabs defaultValue="description" className="w-full">
          <TabsList>
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="backlog">Backlog</TabsTrigger>
            <TabsTrigger value="board">Tableau</TabsTrigger>
            <TabsTrigger value="archived">Archivées</TabsTrigger>
          </TabsList>
        </Tabs>
      }>
        <ProjectTabs project={project} onStoryCreated={handleStoryCreated} />
      </Suspense>
    </div>
  );
}
