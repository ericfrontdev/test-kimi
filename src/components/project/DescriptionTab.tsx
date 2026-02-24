"use client";

import { useState, useMemo } from "react";
import { FileText, Clock, GripVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateStoryDialog } from "./CreateStoryDialog";
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
import type { Story } from "./kanban/types";

interface DescriptionTabProps {
  project: {
    name: string;
    description: string | null;
  };
  projectId: string;
  onStoryCreated?: () => void;
  userRole?: "OWNER" | "ADMIN" | "MEMBER";
}

export function DescriptionTab({
  project,
  projectId,
  onStoryCreated,
  userRole,
}: DescriptionTabProps) {
  const storeStories = useProjectStore((state) => state.stories);
  const updateStoryStatus = useProjectStore((state) => state.updateStoryStatus);

  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  // dragStories: null when not dragging (falls back to storeStories),
  // snapshot of store at drag-start during active drag
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeStory = useMemo(
    () => localStories.find((s) => s.id === activeId),
    [activeId, localStories]
  );

  function handleDragStart(event: DragStartEvent) {
    // Snapshot current store state so drag updates are isolated
    setDragStories(storeStories);
    setActiveId(event.active.id as string);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || !dragStories) return;

    const activeStory = dragStories.find((s) => s.id === active.id);
    if (!activeStory) return;

    const overId = over.id as string;

    // Check if dropped over a column
    if (overId === "backlog" || overId === "board") {
      const newStatus = overId === "backlog" ? "BACKLOG" : "TODO";
      if (activeStory.status !== newStatus) {
        setDragStories((prev) =>
          prev!.map((s) => (s.id === active.id ? { ...s, status: newStatus } : s))
        );
      }
      return;
    }

    // Check if dropped over another story
    const overStory = dragStories.find((s) => s.id === overId);
    if (!overStory || activeStory.status === overStory.status) return;

    setDragStories((prev) =>
      prev!.map((s) => (s.id === active.id ? { ...s, status: overStory.status } : s))
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active } = event;
    setActiveId(null);

    const story = (dragStories ?? storeStories).find((s) => s.id === active.id);
    setDragStories(null);

    if (!story) return;

    // Single call — store handles optimistic update + API call + rollback
    updateStoryStatus(active.id as string, story.status);
  }

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: "0.5",
        },
      },
    }),
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <ProjectInfoCard
          projectId={projectId}
          name={project.name}
          description={project.description}
        />
        <ProjectMembersCard projectId={projectId} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText size={18} />
            Stories
          </CardTitle>
          {userRole !== "MEMBER" && (
            <CreateStoryDialog
              projectId={projectId}
              variant="icon"
              onSuccess={onStoryCreated}
            />
          )}
        </CardHeader>
        <CardContent>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
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
        "rounded-lg border bg-muted/20 p-3 transition-colors",
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
