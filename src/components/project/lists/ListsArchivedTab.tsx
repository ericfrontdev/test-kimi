"use client";

import { useState, useEffect, useCallback } from "react";
import { ArchiveRestore, Trash2, MoreHorizontal, CheckSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useProjectListStore, type ProjectList } from "@/stores/project-list";
import { useProjectStore } from "@/stores/project";
import { toast } from "sonner";

interface ListsArchivedTabProps {
  projectId: string;
}

export function ListsArchivedTab({ projectId }: ListsArchivedTabProps) {
  const addList = useProjectListStore((s) => s.addList);
  const userRole = useProjectStore((s) => s.userRole);
  const isAdmin = userRole !== "MEMBER";

  const [archivedLists, setArchivedLists] = useState<ProjectList[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [listToDelete, setListToDelete] = useState<ProjectList | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchArchived = useCallback(async (skip: number, append = false) => {
    try {
      const res = await fetch(
        `/api/projects/${projectId}/lists?status=ARCHIVED&skip=${skip}&take=50`
      );
      if (res.ok) {
        const { lists, hasMore: more } = await res.json();
        setArchivedLists((prev) => append ? [...prev, ...lists] : lists);
        setHasMore(more);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchArchived(0);
  }, [fetchArchived]);

  async function handleLoadMore() {
    setIsLoadingMore(true);
    await fetchArchived(archivedLists.length, true);
  }

  async function handleUnarchive(list: ProjectList) {
    const response = await fetch(`/api/projects/${projectId}/lists/${list.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "BACKLOG" }),
    });
    if (response.ok) {
      addList({ ...list, status: "BACKLOG" });
      setArchivedLists((prev) => prev.filter((l) => l.id !== list.id));
    } else {
      toast.error("Échec de la restauration");
    }
  }

  async function handleDelete(listId: string) {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/lists/${listId}`, { method: "DELETE" });
      if (response.ok) {
        setListToDelete(null);
        setArchivedLists((prev) => prev.filter((l) => l.id !== listId));
      } else {
        const data = await response.json().catch(() => ({}));
        toast.error(data.error ?? "Échec de la suppression");
        setListToDelete(null);
      }
    } catch {
      toast.error("Erreur réseau lors de la suppression");
      setListToDelete(null);
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
      ) : archivedLists.length === 0 ? (
        <div className="text-center py-12">
          <ArchiveRestore className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">Aucune liste archivée</h3>
          <p className="text-sm text-muted-foreground mt-1">Les listes archivées apparaîtront ici</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-base font-semibold">
            Listes archivées
            <span className="ml-2 text-sm font-normal text-muted-foreground">({archivedLists.length})</span>
          </h3>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/60 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Titre</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Items</th>
                  <th className="w-16 px-4 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {archivedLists.map((list) => (
                  <tr key={list.id} className="bg-muted/20 hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground font-mono">LIST-{list.listNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm line-through text-muted-foreground">{list.title}</span>
                    </td>
                    <td className="px-4 py-3">
                      {list.items.length > 0 ? (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <CheckSquare size={14} />
                          <span>
                            {list.items.filter((i) => i.status === "DONE").length}/{list.items.length}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleUnarchive(list)}>
                            <ArchiveRestore className="h-4 w-4 mr-2" />
                            Restaurer
                          </DropdownMenuItem>
                          {isAdmin && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setListToDelete(list)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer définitivement
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
              <Button variant="outline" onClick={handleLoadMore} disabled={isLoadingMore}>
                {isLoadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Charger plus
              </Button>
            </div>
          )}
        </div>
      )}

      <Dialog
        open={!!listToDelete}
        onOpenChange={(open) => { if (!open) { setListToDelete(null); setIsDeleting(false); } }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer définitivement ?</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. La liste{" "}
              <strong>LIST-{listToDelete?.listNumber}</strong> sera supprimée définitivement.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setListToDelete(null)} disabled={isDeleting}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => listToDelete && handleDelete(listToDelete.id)}
              disabled={isDeleting}
            >
              {isDeleting ? "Suppression..." : "Supprimer définitivement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
