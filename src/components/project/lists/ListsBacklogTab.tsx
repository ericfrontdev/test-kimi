"use client";

import { useState } from "react";
import { MoreHorizontal, ArrowRight, ArrowLeft, Loader2, CheckSquare } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useProjectListStore, type ProjectList } from "@/stores/project-list";
import { useProjectStore } from "@/stores/project";
import { CreateListDialog } from "./CreateListDialog";
import { ListDetailDialog } from "./ListDetailDialog";

interface ListsBacklogTabProps {
  projectId: string;
}

function getStatusLabel(status: string) {
  switch (status) {
    case "BACKLOG": return "Backlog";
    case "TODO": return "À faire";
    case "IN_PROGRESS": return "En cours";
    case "DONE": return "Terminé";
    case "ARCHIVED": return "Archivé";
    default: return status;
  }
}

export function ListsBacklogTab({ projectId }: ListsBacklogTabProps) {
  const lists = useProjectListStore((s) => s.lists);
  const hasMoreLists = useProjectListStore((s) => s.hasMoreLists);
  const isLoadingMore = useProjectListStore((s) => s.isLoadingMore);
  const updateListStatus = useProjectListStore((s) => s.updateListStatus);
  const loadMoreLists = useProjectListStore((s) => s.loadMoreLists);
  const userRole = useProjectStore((s) => s.userRole);

  const [selectedList, setSelectedList] = useState<ProjectList | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editListId, setEditListId] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const backlogLists = lists.filter((l) => l.status === "BACKLOG");
  const boardLists = lists.filter((l) => l.status !== "BACKLOG" && l.status !== "ARCHIVED");

  function handleView(list: ProjectList) {
    setSelectedList(list);
    setIsDetailOpen(true);
  }

  function handleEdit(list: ProjectList) {
    setEditListId(list.id);
    setIsEditOpen(true);
  }

  function renderItemCount(list: ProjectList) {
    const total = list.items.length;
    const done = list.items.filter((i) => i.status === "DONE").length;
    if (total === 0) return <span className="text-sm text-muted-foreground">-</span>;
    return (
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <CheckSquare size={14} />
        <span>{done}/{total}</span>
      </div>
    );
  }

  function renderTable(items: ProjectList[], emptyLabel: string, isBoard: boolean) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[60%]">Nom</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((list) => (
              <TableRow
                key={list.id}
                className="cursor-pointer"
                onClick={() => handleView(list)}
              >
                <TableCell className="font-medium">
                  <div className="flex flex-col gap-1">
                    <span className="truncate">{list.title}</span>
                    <Badge
                      variant={list.status === "DONE" ? "default" : "outline"}
                      className="w-fit text-xs"
                    >
                      {getStatusLabel(list.status)}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  {renderItemCount(list)}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!isBoard ? (
                        <DropdownMenuItem onClick={() => updateListStatus(list.id, "TODO")}>
                          <ArrowRight className="mr-2 h-4 w-4" />
                          Envoyer au tableau
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => updateListStatus(list.id, "BACKLOG")}>
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Renvoyer au backlog
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleView(list)}>Voir</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(list)}>Modifier</DropdownMenuItem>
                      {userRole !== "MEMBER" && (
                        <DropdownMenuItem
                          onClick={() => updateListStatus(list.id, "ARCHIVED")}
                          className="text-destructive"
                        >
                          Archiver
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-sm text-muted-foreground">
                  {emptyLabel}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Listes section */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            Listes
            <Badge variant="secondary" className="ml-2">
              {backlogLists.length}
            </Badge>
          </h3>
        </div>
        {renderTable(backlogLists, "Aucune liste dans le backlog", false)}
      </div>

      {/* Dans le tableau */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            Dans le tableau
            <Badge variant="secondary" className="ml-2">
              {boardLists.length}
            </Badge>
          </h3>
        </div>
        {renderTable(boardLists, "Aucune liste dans le tableau", true)}
      </div>

      {hasMoreLists && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" onClick={loadMoreLists} disabled={isLoadingMore}>
            {isLoadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Charger plus
          </Button>
        </div>
      )}

      {/* List Detail Dialog */}
      <ListDetailDialog
        list={selectedList}
        projectId={projectId}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />

      {/* Edit Dialog */}
      {editListId && (
        <CreateListDialog
          projectId={projectId}
          listId={editListId}
          open={isEditOpen}
          onOpenChange={(v) => {
            setIsEditOpen(v);
            if (!v) setEditListId(null);
          }}
        />
      )}
    </div>
  );
}
