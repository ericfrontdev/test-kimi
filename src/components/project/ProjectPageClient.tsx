"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateStoryDialog } from "./CreateStoryDialog";
import { BacklogTab } from "./BacklogTab";
import { BoardTab } from "./BoardTab";
import { ArchivedTab } from "./ArchivedTab";
import { useRouter, useSearchParams } from "next/navigation";
import type { Story } from "./kanban/types";
import { useProjectStore } from "@/stores/project";
import { toast } from "sonner";

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
  userRole: "OWNER" | "ADMIN" | "MEMBER";
}

// Isolated component so useSearchParams is inside a Suspense boundary
function ProjectTabs({ project }: { project: Project }) {
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
        <DescriptionTab />
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

export function ProjectPageClient({ project, stories: initialStories, hasMoreStories, userRole }: ProjectPageClientProps) {
  const setProject = useProjectStore((state) => state.setProject);

  useEffect(() => {
    setProject(project.id, initialStories, hasMoreStories, userRole, project.name, project.description ?? null);
  }, [project.id, project.name, project.description, initialStories, hasMoreStories, userRole, setProject]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        {userRole !== "MEMBER" ? (
          <CreateStoryDialog projectId={project.id} variant="button" />
        ) : (
          <Button
            className="gap-2"
            onClick={() =>
              toast.error("Action non autorisée", {
                description: "Seuls les admins et propriétaires peuvent créer des stories.",
              })
            }
          >
            <Plus size={16} />
            Créer une Story
          </Button>
        )}
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
        <ProjectTabs project={project} />
      </Suspense>
    </div>
  );
}
