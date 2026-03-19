"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateStoryDialog } from "./CreateStoryDialog";
import { BacklogTab } from "./BacklogTab";
import { BoardTab } from "./BoardTab";
import { ArchivedTab } from "./ArchivedTab";
import { ListsBacklogTab } from "./lists/ListsBacklogTab";
import { ListsBoardTab } from "./lists/ListsBoardTab";
import { ListsArchivedTab } from "./lists/ListsArchivedTab";
import { CreateListDialog } from "./lists/CreateListDialog";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import type { Story } from "./kanban/types";
import { useProjectStore } from "@/stores/project";
import { useProjectListStore, type ProjectList } from "@/stores/project-list";
import { ErrorBoundary } from "@/components/ui/error-boundary";

const VALID_STORY_TABS = ["description", "backlog", "board", "archived"] as const;
const VALID_LIST_TABS = ["description", "listes", "tableau", "archived"] as const;
type StoryTab = (typeof VALID_STORY_TABS)[number];
type ListTab = (typeof VALID_LIST_TABS)[number];

// Dynamically import DescriptionTab to avoid hydration issues with dnd-kit
const DescriptionTab = dynamic(() => import("./DescriptionTab").then((mod) => mod.DescriptionTab), {
  ssr: false,
  loading: () => <div className="h-48 animate-pulse rounded-lg bg-muted/40" />,
});

interface Project {
  id: string;
  name: string;
  description: string | null;
}

interface ProjectPageClientProps {
  project: Project;
  projectType: "STORY" | "LIST";
  stories: Story[];
  hasMoreStories: boolean;
  lists: ProjectList[];
  hasMoreLists: boolean;
  userRole: "OWNER" | "ADMIN" | "MEMBER";
}

// Story-based tabs component
function StoryProjectTabs({ project }: { project: Project }) {
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab");
  const initialTab: StoryTab = VALID_STORY_TABS.includes(rawTab as StoryTab) ? (rawTab as StoryTab) : "description";
  const [activeTab, setActiveTab] = useState<StoryTab>(initialTab);
  // Lazy mount — un onglet n'est rendu qu'après sa première visite, puis reste monté
  const [visitedTabs, setVisitedTabs] = useState<Set<StoryTab>>(new Set([initialTab]));

  function handleTabChange(tab: string) {
    const t = tab as StoryTab;
    setActiveTab(t);
    setVisitedTabs((prev) => (prev.has(t) ? prev : new Set([...prev, t])));
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState(null, "", url.toString());
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
        {visitedTabs.has("description") && <DescriptionTab />}
      </TabsContent>
      <TabsContent value="backlog" className="mt-6">
        {visitedTabs.has("backlog") && <BacklogTab projectId={project.id} />}
      </TabsContent>
      <TabsContent value="board" className="mt-6">
        {visitedTabs.has("board") && <BoardTab projectId={project.id} />}
      </TabsContent>
      <TabsContent value="archived" className="mt-6">
        {visitedTabs.has("archived") && <ArchivedTab projectId={project.id} />}
      </TabsContent>
    </Tabs>
  );
}

// List-based tabs component
function ListProjectTabs({ project }: { project: Project }) {
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab");
  const initialTab: ListTab = VALID_LIST_TABS.includes(rawTab as ListTab) ? (rawTab as ListTab) : "description";
  const [activeTab, setActiveTab] = useState<ListTab>(initialTab);
  const [visitedTabs, setVisitedTabs] = useState<Set<ListTab>>(new Set([initialTab]));

  function handleTabChange(tab: string) {
    const t = tab as ListTab;
    setActiveTab(t);
    setVisitedTabs((prev) => (prev.has(t) ? prev : new Set([...prev, t])));
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState(null, "", url.toString());
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList>
        <TabsTrigger value="description">Description</TabsTrigger>
        <TabsTrigger value="listes">Listes actuelles</TabsTrigger>
        <TabsTrigger value="tableau">Tableau</TabsTrigger>
        <TabsTrigger value="archived">Archivées</TabsTrigger>
      </TabsList>

      <TabsContent value="description" className="mt-6">
        {visitedTabs.has("description") && <DescriptionTab />}
      </TabsContent>
      <TabsContent value="listes" className="mt-6">
        {visitedTabs.has("listes") && <ListsBacklogTab projectId={project.id} />}
      </TabsContent>
      <TabsContent value="tableau" className="mt-6">
        {visitedTabs.has("tableau") && <ListsBoardTab projectId={project.id} />}
      </TabsContent>
      <TabsContent value="archived" className="mt-6">
        {visitedTabs.has("archived") && <ListsArchivedTab projectId={project.id} />}
      </TabsContent>
    </Tabs>
  );
}

export function ProjectPageClient({
  project,
  projectType,
  stories: initialStories,
  hasMoreStories,
  lists: initialLists,
  hasMoreLists,
  userRole,
}: ProjectPageClientProps) {
  const setProject = useProjectStore((state) => state.setProject);
  const setLists = useProjectListStore((state) => state.setLists);

  useEffect(() => {
    setProject(project.id, initialStories, hasMoreStories, userRole, project.name, project.description ?? null, projectType);
  }, [project.id, project.name, project.description, initialStories, hasMoreStories, userRole, projectType, setProject]);

  useEffect(() => {
    if (projectType === "LIST") {
      setLists(project.id, initialLists, hasMoreLists);
    }
  }, [project.id, projectType, initialLists, hasMoreLists, setLists]);

  const isListProject = projectType === "LIST";

  // Fallback tabs for Suspense
  const fallbackTabs = isListProject ? (
    <Tabs defaultValue="description" className="w-full">
      <TabsList>
        <TabsTrigger value="description">Description</TabsTrigger>
        <TabsTrigger value="listes">Listes actuelles</TabsTrigger>
        <TabsTrigger value="tableau">Tableau</TabsTrigger>
        <TabsTrigger value="archived">Archivées</TabsTrigger>
      </TabsList>
    </Tabs>
  ) : (
    <Tabs defaultValue="description" className="w-full">
      <TabsList>
        <TabsTrigger value="description">Description</TabsTrigger>
        <TabsTrigger value="backlog">Backlog</TabsTrigger>
        <TabsTrigger value="board">Tableau</TabsTrigger>
        <TabsTrigger value="archived">Archivées</TabsTrigger>
      </TabsList>
    </Tabs>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        {isListProject ? (
          <CreateListDialog projectId={project.id} variant="button" />
        ) : (
          <CreateStoryDialog projectId={project.id} variant="button" />
        )}
      </div>

      {/* Tabs */}
      <ErrorBoundary>
        <Suspense fallback={fallbackTabs}>
          {isListProject ? (
            <ListProjectTabs project={project} />
          ) : (
            <StoryProjectTabs project={project} />
          )}
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
