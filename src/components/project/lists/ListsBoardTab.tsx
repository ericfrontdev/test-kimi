"use client";

import { useState, useMemo } from "react";
import { useProjectListStore, type ProjectList } from "@/stores/project-list";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
  DropAnimation,
  useDroppable,
} from "@dnd-kit/core";
import { ListDetailDialog } from "./ListDetailDialog";
import { ListCard } from "./ListCard";
import { ListCardOverlay } from "./ListCardOverlay";
import { cn } from "@/lib/utils";

const LIST_COLUMNS = [
  { id: "TODO", title: "À faire", color: "bg-slate-400" },
  { id: "IN_PROGRESS", title: "En cours", color: "bg-blue-500" },
  { id: "DONE", title: "Terminé", color: "bg-emerald-500" },
] as const;

interface ListsBoardTabProps {
  projectId: string;
}

export function ListsBoardTab({ projectId }: ListsBoardTabProps) {
  const storeLists = useProjectListStore((s) => s.lists);
  const updateListStatus = useProjectListStore((s) => s.updateListStatus);

  const [selectedList, setSelectedList] = useState<ProjectList | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragLists, setDragLists] = useState<ProjectList[] | null>(null);

  const boardLists = storeLists.filter((l) => l.status !== "BACKLOG" && l.status !== "ARCHIVED");
  const localLists = dragLists ?? boardLists;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const activeList = useMemo(() => localLists.find((l) => l.id === activeId), [activeId, localLists]);

  function handleDragStart(event: DragStartEvent) {
    setDragLists(boardLists);
    setActiveId(event.active.id as string);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || !dragLists) return;

    const dragged = dragLists.find((l) => l.id === active.id);
    if (!dragged) return;

    const overId = over.id as string;
    const column = LIST_COLUMNS.find((c) => c.id === overId);

    if (column && dragged.status !== column.id) {
      setDragLists((prev) =>
        prev!.map((l) => (l.id === active.id ? { ...l, status: column.id } : l))
      );
      return;
    }

    const overList = dragLists.find((l) => l.id === overId);
    if (overList && dragged.status !== overList.status) {
      setDragLists((prev) =>
        prev!.map((l) => (l.id === active.id ? { ...l, status: overList.status } : l))
      );
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active } = event;
    setActiveId(null);
    const list = (dragLists ?? boardLists).find((l) => l.id === active.id);
    setDragLists(null);
    if (!list) return;
    updateListStatus(active.id as string, list.status);
  }

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.5" } } }),
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 min-h-[500px]">
          {LIST_COLUMNS.map((column) => (
            <ListBoardColumn
              key={column.id}
              id={column.id}
              title={column.title}
              color={column.color}
              lists={localLists.filter((l) => l.status === column.id)}
              projectId={projectId}
              onListClick={setSelectedList}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={dropAnimation}>
          {activeList ? <ListCardOverlay list={activeList} /> : null}
        </DragOverlay>
      </DndContext>

      <ListDetailDialog
        list={selectedList}
        projectId={projectId}
        open={!!selectedList}
        onOpenChange={(open) => !open && setSelectedList(null)}
      />
    </>
  );
}

interface ListBoardColumnProps {
  id: string;
  title: string;
  color: string;
  lists: ProjectList[];
  projectId: string;
  onListClick: (list: ProjectList) => void;
}

function ListBoardColumn({ id, title, color, lists, projectId, onListClick }: ListBoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-1 min-w-[280px] rounded-lg border bg-muted/20 p-3 transition-colors",
        isOver && "border-primary bg-primary/5"
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <div className={cn("h-2 w-2 rounded-full", color)} />
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs">{lists.length}</span>
      </div>
      <div className="space-y-2 min-h-[200px]">
        {lists.map((list) => (
          <ListCard
            key={list.id}
            list={list}
            projectId={projectId}
            onClick={() => onListClick(list)}
          />
        ))}
        {lists.length === 0 && (
          <div className="flex h-20 items-center justify-center rounded border border-dashed text-xs text-muted-foreground">
            Déposez des listes ici
          </div>
        )}
      </div>
    </div>
  );
}
