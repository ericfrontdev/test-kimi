"use client";

import { useState } from "react";
import useSWRInfinite from "swr/infinite";
import { ArchiveRestore, Trash2, MoreHorizontal, Layers, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StoryDetailDialog } from "./StoryDetailDialog";
import { useProjectStore } from "@/stores/project";
import { fetcher } from "@/lib/fetcher";
import { toast } from "sonner";
import type { Story } from "./kanban/types";

interface ArchivedTabProps {
  projectId: string;
}

interface ArchivedPage {
  stories: Story[];
  hasMore: boolean;
  total: number;
}

const PAGE_SIZE = 50;

function getKey(projectId: string) {
  return (pageIndex: number, previousPageData: ArchivedPage | null) => {
    if (previousPageData && !previousPageData.hasMore) return null;
    return `/api/projects/${projectId}/stories?status=ARCHIVED&skip=${pageIndex * PAGE_SIZE}&take=${PAGE_SIZE}`;
  };
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "DONE":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "IN_REVIEW":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "ARCHIVED":
      return "bg-gray-100 text-gray-600 border-gray-200 line-through";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "TODO":
      return "À faire";
    case "IN_PROGRESS":
      return "En cours";
    case "IN_REVIEW":
      return "En révision";
    case "DONE":
      return "Terminé";
    case "BACKLOG":
      return "Backlog";
    case "ARCHIVED":
      return "Archivé";
    default:
      return status;
  }
}

export function ArchivedTab({ projectId }: ArchivedTabProps) {
  const addStory = useProjectStore((state) => state.addStory);
  const removeStory = useProjectStore((state) => state.removeStory);
  const userRole = useProjectStore((state) => state.userRole);
  const isAdmin = userRole !== "MEMBER";

  const { data, size, setSize, isLoading, isValidating, mutate } = useSWRInfinite<ArchivedPage>(
    getKey(projectId),
    fetcher
  );

  const archivedStories = data ? data.flatMap((page) => page.stories) : [];
  const hasMore = data ? (data[data.length - 1]?.hasMore ?? false) : false;
  // "load more" spinner : on a demandé une page de plus mais elle n'est pas encore arrivée
  const isLoadingMore = isValidating && size > (data?.length ?? 0);

  const [storyToDelete, setStoryToDelete] = useState<Story | null>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleUnarchive(story: Story) {
    const response = await fetch(`/api/projects/${projectId}/stories/${story.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "BACKLOG" }),
    });
    if (response.ok) {
      addStory({ ...story, status: "BACKLOG" });
      // Invalide le cache SWR — retire la story de toutes les pages en local
      mutate(
        (pages) => pages?.map((page) => ({
          ...page,
          stories: page.stories.filter((s) => s.id !== story.id),
        })),
        { revalidate: false }
      );
    } else {
      toast.error("Échec de la restauration");
    }
  }

  async function handleDelete(storyId: string) {
    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/stories/${storyId}`,
        { method: "DELETE" }
      );
      if (response.ok) {
        setStoryToDelete(null);
        removeStory(storyId);
        mutate(
          (pages) => pages?.map((page) => ({
            ...page,
            stories: page.stories.filter((s) => s.id !== storyId),
          })),
          { revalidate: false }
        );
      } else {
        const data = await response.json().catch(() => ({}));
        toast.error((data as { error?: string }).error ?? "Échec de la suppression");
        setStoryToDelete(null);
      }
    } catch {
      toast.error("Erreur réseau lors de la suppression");
      setStoryToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : archivedStories.length === 0 ? (
        <div className="text-center py-12">
          <ArchiveRestore className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">Aucune story archivée</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Les stories archivées apparaîtront ici
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">
              Stories archivées
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({archivedStories.length})
              </span>
            </h3>
          </div>

          {/* Vue mobile — cards */}
          <div className="md:hidden space-y-2">
            {archivedStories.map((story) => (
              <div
                key={story.id}
                className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2.5 gap-2"
              >
                <button className="flex-1 text-left min-w-0" onClick={() => setSelectedStory(story)}>
                  <p className="text-sm line-through text-muted-foreground truncate">{story.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono text-muted-foreground">{story.type}-{story.storyNumber}</span>
                    {story.subtasks > 0 && (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Layers size={10} />{story.completedSubtasks}/{story.subtasks}
                      </span>
                    )}
                  </div>
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                      <MoreHorizontal size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleUnarchive(story)}>
                      <ArchiveRestore className="h-4 w-4 mr-2" />Restaurer
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem className="text-destructive" onClick={() => setStoryToDelete(story)}>
                        <Trash2 className="h-4 w-4 mr-2" />Supprimer définitivement
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>

          {/* Vue desktop — table */}
          <div className="hidden md:block border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/60 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Titre</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Statut</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Sous-tâches</th>
                  <th className="w-16 px-4 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {archivedStories.map((story) => (
                  <tr
                    key={story.id}
                    className="bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors"
                    onClick={() => setSelectedStory(story)}
                  >
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground font-mono">{story.type}-{story.storyNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm line-through text-muted-foreground">{story.title}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`${getStatusBadgeClass(story.status)} font-normal`}>
                        {getStatusLabel(story.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {story.subtasks > 0 ? (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Layers size={14} /><span>{story.completedSubtasks}/{story.subtasks}</span>
                        </div>
                      ) : <span className="text-sm text-muted-foreground">-</span>}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal size={16} /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleUnarchive(story); }}>
                            <ArchiveRestore className="h-4 w-4 mr-2" />Restaurer
                          </DropdownMenuItem>
                          {isAdmin && (
                            <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); setStoryToDelete(story); }}>
                              <Trash2 className="h-4 w-4 mr-2" />Supprimer définitivement
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => setSize(size + 1)}
                disabled={isLoadingMore}
              >
                {isLoadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Charger plus
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Dialogs always mounted — prevents Radix focus-trap leak on last-story deletion */}
      <Dialog open={!!storyToDelete} onOpenChange={(open) => { if (!open) { setStoryToDelete(null); setIsDeleting(false); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer définitivement ?</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. La story{" "}
              <strong>{storyToDelete?.type}-{storyToDelete?.storyNumber}</strong>{" "}
              sera supprimée définitivement.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStoryToDelete(null)} disabled={isDeleting}>
              Annuler
            </Button>
            <Button
              onClick={() => storyToDelete && handleDelete(storyToDelete.id)}
              disabled={isDeleting}
              variant="destructive"
            >
              {isDeleting ? "Suppression..." : "Supprimer définitivement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <StoryDetailDialog
        story={selectedStory}
        projectId={projectId}
        open={!!selectedStory}
        onOpenChange={(open) => !open && setSelectedStory(null)}
      />
    </>
  );
}
