"use client";

import { useState, useMemo } from "react";
import { FileText, Clock, GripVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreateStoryDialog } from "./CreateStoryDialog";
import { CreateListDialog } from "./lists/CreateListDialog";
import { ProjectInfoCard } from "./ProjectInfoCard";
import { ProjectMembersCard } from "./ProjectMembersCard";
import { StoryDetailDialog } from "./StoryDetailDialog";
import { cn } from "@/lib/utils";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
  DropAnimation,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useProjectStore } from "@/stores/project";
import { useProjectListStore, type ProjectList } from "@/stores/project-list";
import type { Story } from "./kanban/types";

export function DescriptionTab() {
  const projectId = useProjectStore((s) => s.projectId) ?? "";
  const projectType = useProjectStore((s) => s.projectType);
  const storeStories = useProjectStore((state) => state.stories);
  const updateStoryStatus = useProjectStore((state) => state.updateStoryStatus);
  const storeLists = useProjectListStore((s) => s.lists);
  const updateListStatus = useProjectListStore((s) => s.updateListStatus);

  const [selectedStory, setSelectedStory] = useState<Story | null>(null);

  // ── Stories DnD state ──────────────────────────────────────────────────────
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  const [dragStories, setDragStories] = useState<Story[] | null>(null);
  const localStories = dragStories ?? storeStories;

  const backlogStories = useMemo(
    () => localStories.filter((s) => s.status === "BACKLOG"),
    [localStories]
  );
  const boardStories = useMemo(
    () => localStories.filter((s) => s.status === "TODO"),
    [localStories]
  );

  // ── Lists DnD state ────────────────────────────────────────────────────────
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [dragLists, setDragLists] = useState<ProjectList[] | null>(null);
  const activeLists = storeLists.filter((l) => l.status !== "ARCHIVED");
  const localLists = dragLists ?? activeLists;

  const backlogLists = useMemo(
    () => localLists.filter((l) => l.status === "BACKLOG"),
    [localLists]
  );
  const boardLists = useMemo(
    () => localLists.filter((l) => l.status !== "BACKLOG"),
    [localLists]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const activeStory = useMemo(
    () => localStories.find((s) => s.id === activeStoryId),
    [activeStoryId, localStories]
  );
  const activeList = useMemo(
    () => localLists.find((l) => l.id === activeListId),
    [activeListId, localLists]
  );

  // ── Stories DnD handlers ───────────────────────────────────────────────────
  function handleStoryDragStart(event: DragStartEvent) {
    setDragStories(storeStories);
    setActiveStoryId(event.active.id as string);
  }

  function handleStoryDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || !dragStories) return;

    const activeStory = dragStories.find((s) => s.id === active.id);
    if (!activeStory) return;

    const overId = over.id as string;
    if (overId === "backlog" || overId === "board") {
      const newStatus = overId === "backlog" ? "BACKLOG" : "TODO";
      if (activeStory.status !== newStatus) {
        setDragStories((prev) =>
          prev!.map((s) => (s.id === active.id ? { ...s, status: newStatus } : s))
        );
      }
      return;
    }

    const overStory = dragStories.find((s) => s.id === overId);
    if (!overStory || activeStory.status === overStory.status) return;
    setDragStories((prev) =>
      prev!.map((s) => (s.id === active.id ? { ...s, status: overStory.status } : s))
    );
  }

  function handleStoryDragEnd(event: DragEndEvent) {
    const { active } = event;
    setActiveStoryId(null);
    const story = (dragStories ?? storeStories).find((s) => s.id === active.id);
    setDragStories(null);
    if (!story) return;
    updateStoryStatus(active.id as string, story.status);
  }

  // ── Lists DnD handlers ─────────────────────────────────────────────────────
  function handleListDragStart(event: DragStartEvent) {
    setDragLists(activeLists);
    setActiveListId(event.active.id as string);
  }

  function handleListDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || !dragLists) return;

    const dragged = dragLists.find((l) => l.id === active.id);
    if (!dragged) return;

    const overId = over.id as string;
    if (overId === "list-backlog" || overId === "list-board") {
      const newStatus = overId === "list-backlog" ? "BACKLOG" : "TODO";
      if (dragged.status !== newStatus) {
        setDragLists((prev) =>
          prev!.map((l) => (l.id === active.id ? { ...l, status: newStatus } : l))
        );
      }
      return;
    }

    const overList = dragLists.find((l) => l.id === overId);
    if (!overList || dragged.status === overList.status) return;
    setDragLists((prev) =>
      prev!.map((l) => (l.id === active.id ? { ...l, status: overList.status } : l))
    );
  }

  function handleListDragEnd(event: DragEndEvent) {
    const { active } = event;
    setActiveListId(null);
    const list = (dragLists ?? activeLists).find((l) => l.id === active.id);
    setDragLists(null);
    if (!list) return;
    updateListStatus(active.id as string, list.status);
  }

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: { active: { opacity: "0.5" } },
    }),
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <ProjectInfoCard />
        <ProjectMembersCard projectId={projectId} />
      </div>

      {projectType === "LIST" ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText size={18} />
              Listes
            </CardTitle>
            <CreateListDialog projectId={projectId} variant="icon" />
          </CardHeader>
          <CardContent>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleListDragStart}
              onDragOver={handleListDragOver}
              onDragEnd={handleListDragEnd}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <ListColumn
                  id="list-backlog"
                  title="Listes"
                  icon={<Clock className="h-4 w-4 text-muted-foreground" />}
                  lists={backlogLists}
                />
                <ListColumn
                  id="list-board"
                  title="Dans le tableau"
                  icon={<FileText className="h-4 w-4 text-muted-foreground" />}
                  lists={boardLists}
                />
              </div>

              <DragOverlay dropAnimation={dropAnimation}>
                {activeList ? <ListCardSmall list={activeList} isOverlay /> : null}
              </DragOverlay>
            </DndContext>

            {activeLists.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Aucune liste. Cliquez sur le bouton + pour en créer une.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText size={18} />
              Stories
            </CardTitle>
            <CreateStoryDialog projectId={projectId} variant="icon" />
          </CardHeader>
          <CardContent>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleStoryDragStart}
              onDragOver={handleStoryDragOver}
              onDragEnd={handleStoryDragEnd}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Backlog Column */}
                <Column
                  id="backlog"
                  title="Backlog"
                  icon={<Clock className="h-4 w-4 text-muted-foreground" />}
                  stories={backlogStories}
                  onStoryClick={setSelectedStory}
                />

                {/* Board Column */}
                <Column
                  id="board"
                  title="Dans le tableau"
                  icon={<FileText className="h-4 w-4 text-muted-foreground" />}
                  stories={boardStories}
                  onStoryClick={setSelectedStory}
                />
              </div>

              <DragOverlay dropAnimation={dropAnimation}>
                {activeStory ? (
                  <StoryCard story={activeStory} isOverlay />
                ) : null}
              </DragOverlay>
            </DndContext>

            {storeStories.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Aucune story. Cliquez sur le bouton + pour en créer une.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <StoryDetailDialog
        story={selectedStory}
        projectId={projectId}
        open={!!selectedStory}
        onOpenChange={(open) => !open && setSelectedStory(null)}
      />
    </div>
  );
}

interface ColumnProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  stories: Story[];
  onStoryClick: (story: Story) => void;
}

function Column({ id, title, icon, stories, onStoryClick }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: "Column",
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-lg border bg-muted/20 p-3 transition-colors overflow-hidden",
        isOver && "border-primary bg-primary/5 ring-2 ring-primary/20"
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          {icon}
          {title}
        </h4>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
          {stories.length}
        </span>
      </div>
      <SortableContext items={stories.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 min-h-[100px]">
          {stories.map((story) => (
            <SortableStoryCard
              key={story.id}
              story={story}
              onClick={() => onStoryClick(story)}
            />
          ))}
          {stories.length === 0 && (
            <div className="flex h-20 items-center justify-center rounded border border-dashed text-xs text-muted-foreground">
              Glissez des stories ici
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

interface SortableStoryCardProps {
  story: Story;
  onClick: () => void;
}

function SortableStoryCard({ story, onClick }: SortableStoryCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: story.id,
    data: {
      type: "Story",
      story,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex items-center gap-2 rounded-md border bg-card p-2.5 text-sm shadow-sm transition-all hover:shadow-md",
        isDragging && "opacity-30 cursor-grabbing z-50"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab p-1 text-muted-foreground hover:text-foreground touch-none select-none"
        tabIndex={0}
        role="button"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </div>
      <div
        onClick={onClick}
        className="flex flex-1 cursor-pointer items-start gap-2 overflow-hidden"
      >
        <span className="text-xs text-muted-foreground font-mono shrink-0">
          {story.type}-{story.storyNumber}
        </span>
        <span className="truncate">{story.title}</span>
      </div>
    </div>
  );
}

interface StoryCardProps {
  story: Story;
  isOverlay?: boolean;
}

function StoryCard({ story, isOverlay }: StoryCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-md border bg-card p-2.5 text-sm shadow-lg",
        isOverlay && "cursor-grabbing rotate-2 scale-105 ring-2 ring-primary/30"
      )}
    >
      <div className="p-0.5 text-muted-foreground">
        <GripVertical className="h-4 w-4" />
      </div>
      <div className="flex flex-1 items-start gap-2 overflow-hidden">
        <span className="text-xs text-muted-foreground font-mono shrink-0">
          {story.type}-{story.storyNumber}
        </span>
        <span className="truncate">{story.title}</span>
      </div>
    </div>
  );
}

// ── List components (mirror of story components) ───────────────────────────

interface ListColumnProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  lists: ProjectList[];
}

function ListColumn({ id, title, icon, lists }: ListColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { type: "Column" } });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-lg border bg-muted/20 p-3 transition-colors overflow-hidden",
        isOver && "border-primary bg-primary/5 ring-2 ring-primary/20"
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          {icon}
          {title}
        </h4>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{lists.length}</span>
      </div>
      <SortableContext items={lists.map((l) => l.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 min-h-[100px]">
          {lists.map((list) => (
            <SortableListCard key={list.id} list={list} />
          ))}
          {lists.length === 0 && (
            <div className="flex h-20 items-center justify-center rounded border border-dashed text-xs text-muted-foreground">
              Glissez des listes ici
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

function SortableListCard({ list }: { list: ProjectList }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: list.id,
    data: { type: "List", list },
  });

  const style = { transform: CSS.Transform.toString(transform), transition };
  const doneCount = list.items.filter((i) => i.status === "DONE").length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex items-center gap-2 rounded-md border bg-card p-2.5 text-sm shadow-sm transition-all hover:shadow-md",
        isDragging && "opacity-30 cursor-grabbing z-50"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab p-1 text-muted-foreground hover:text-foreground touch-none select-none"
        tabIndex={0}
        role="button"
        aria-label="Déplacer"
      >
        <GripVertical className="h-4 w-4" />
      </div>
      <div className="flex flex-1 items-center gap-2 overflow-hidden">
        <span className="text-xs text-muted-foreground font-mono shrink-0">LIST-{list.listNumber}</span>
        <span className="truncate flex-1">{list.title}</span>
        {list.items.length > 0 && (
          <span className="text-xs text-muted-foreground shrink-0">
            {doneCount}/{list.items.length}
          </span>
        )}
      </div>
    </div>
  );
}

interface ListCardSmallProps {
  list: ProjectList;
  isOverlay?: boolean;
}

function ListCardSmall({ list, isOverlay }: ListCardSmallProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-md border bg-card p-2.5 text-sm shadow-lg",
        isOverlay && "cursor-grabbing rotate-2 scale-105 ring-2 ring-primary/30"
      )}
    >
      <div className="p-0.5 text-muted-foreground">
        <GripVertical className="h-4 w-4" />
      </div>
      <div className="flex flex-1 items-center gap-2 overflow-hidden">
        <span className="text-xs text-muted-foreground font-mono shrink-0">LIST-{list.listNumber}</span>
        <span className="truncate">{list.title}</span>
      </div>
    </div>
  );
}
