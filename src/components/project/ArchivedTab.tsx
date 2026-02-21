"use client";

import { useState } from "react";
import { ArchiveRestore, Trash2, MoreHorizontal, Layers } from "lucide-react";
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
import type { Story } from "./kanban/types";

interface ArchivedTabProps {
  projectId: string;
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
  const stories = useProjectStore((state) => state.stories);
  const updateStoryStatus = useProjectStore((state) => state.updateStoryStatus);
  const removeStory = useProjectStore((state) => state.removeStory);

  const [storyToDelete, setStoryToDelete] = useState<Story | null>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const archivedStories = stories.filter((s) => s.status === "ARCHIVED");

  async function handleUnarchive(storyId: string) {
    await updateStoryStatus(storyId, "BACKLOG");
  }

  async function handleDelete(storyId: string) {
    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/stories/${storyId}`,
        {
          method: "DELETE",
        }
      );
      if (response.ok) {
        removeStory(storyId);
        setStoryToDelete(null);
      }
    } catch {
      // silently fail
    } finally {
      setIsDeleting(false);
    }
  }

  if (archivedStories.length === 0) {
    return (
      <div className="text-center py-12">
        <ArchiveRestore className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium">Aucune story archivée</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Les stories archivées apparaîtront ici
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">
            Stories archivées
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({archivedStories.length})
            </span>
          </h3>
        </div>

        <div className="border rounded-lg overflow-hidden">
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
                    <span className="text-xs text-muted-foreground font-mono">
                      {story.type}-{story.storyNumber}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm line-through text-muted-foreground">
                      {story.title}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={`${getStatusBadgeClass(story.status)} font-normal`}
                    >
                      {getStatusLabel(story.status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {story.subtasks > 0 ? (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Layers size={14} />
                        <span>
                          {story.completedSubtasks}/{story.subtasks}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnarchive(story.id);
                          }}
                        >
                          <ArchiveRestore className="h-4 w-4 mr-2" />
                          Restaurer
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setStoryToDelete(story);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer définitivement
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!storyToDelete} onOpenChange={(open) => !open && setStoryToDelete(null)}>
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
