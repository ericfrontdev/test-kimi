"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useProjectStore } from "@/stores/project";
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
} from "@dnd-kit/core";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterSortBar, applyFiltersAndSort, DEFAULT_FILTER, DEFAULT_SORT } from "./FilterSortBar";
import type { FilterState, SortState } from "./FilterSortBar";
import { StoryDetailDialog } from "./StoryDetailDialog";
import { KanbanColumn } from "./kanban/KanbanColumn";
import { StoryCardOverlay } from "./kanban/StoryCardOverlay";
import type { Story } from "./kanban/types";
import { columns } from "./kanban/types";

interface BoardTabProps {
  projectId: string;
}

export function BoardTab({ projectId }: BoardTabProps) {
  // Store reads
  const storeStories = useProjectStore((state) => state.stories);
  const hasMoreStories = useProjectStore((state) => state.hasMoreStories);
  const isLoadingMore = useProjectStore((state) => state.isLoadingMore);
  const loadMoreStories = useProjectStore((state) => state.loadMoreStories);
  const updateStoryStatus = useProjectStore((state) => state.updateStoryStatus);
  const storyTasks = useProjectStore((state) => state.storyTasks);
  const projectUsers = useProjectStore((state) => state.projectUsers);
  const fetchProjectUsers = useProjectStore((state) => state.fetchProjectUsers);
  const expandedStories = useProjectStore((state) => state.expandedStories);
  const toggleStoryExpanded = useProjectStore((state) => state.toggleStoryExpanded);
  const setStoryTasksCache = useProjectStore((state) => state.setStoryTasksCache);

  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER);
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT);

  const [dragStories, setDragStories] = useState<Story[] | null>(null);
  const filteredStoreStories = applyFiltersAndSort(storeStories, filter, sort);
  const localStories = dragStories ?? filteredStoreStories;

  const blockedRef = useRef(false);
  const [blockWarning, setBlockWarning] = useState(false);

  // Fetch project members on mount
  useEffect(() => {
    fetchProjectUsers(projectId);
  }, [projectId, fetchProjectUsers]);

  // Preload all subtasks in background when story IDs change
  const preloadedRef = useRef<Set<string>>(new Set());
  const storyIdsKey = storeStories.map((s) => s.id).join(",");

  useEffect(() => {
    const storiesToLoad = storeStories.filter(
      (s) => s.subtasks > 0 && !preloadedRef.current.has(s.id)
    );
    if (storiesToLoad.length === 0) return;

    storiesToLoad.forEach((s) => preloadedRef.current.add(s.id));

    Promise.all(
      storiesToLoad.map(async (story) => {
        try {
          const response = await fetch(`/api/projects/${projectId}/stories/${story.id}`);
          if (response.ok) {
            const data = await response.json();
            setStoryTasksCache(story.id, data.tasks || []);
          } else {
            preloadedRef.current.delete(story.id);
          }
        } catch {
          preloadedRef.current.delete(story.id);
        }
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, storyIdsKey]);

  function canMoveToStatus(story: Story, newStatus: string): boolean {
    if (newStatus !== "IN_REVIEW" && newStatus !== "DONE") return true;
    const loaded = storyTasks[story.id];
    if (loaded !== undefined) {
      return loaded.length === 0 || loaded.every((t) => t.status === "DONE");
    }
    return story.subtasks === 0 || story.completedSubtasks === story.subtasks;
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor)
  );

  const activeStory = useMemo(
    () => localStories.find((s) => s.id === activeId),
    [activeId, localStories]
  );

  function handleDragStart(event: DragStartEvent) {
    blockedRef.current = false;
    setDragStories(filteredStoreStories);
    setActiveId(event.active.id as string);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || !dragStories) return;

    const activeStory = dragStories.find((s) => s.id === active.id);
    if (!activeStory) return;

    const overId = over.id as string;
    const column = columns.find((c) => c.id === overId);

    if (column && activeStory.status !== column.id) {
      if (!canMoveToStatus(activeStory, column.id)) {
        blockedRef.current = true;
        return;
      }
      blockedRef.current = false;
      setDragStories((prev) =>
        prev!.map((s) => (s.id === active.id ? { ...s, status: column.id } : s))
      );
      return;
    }

    const overStory = dragStories.find((s) => s.id === overId);
    if (overStory && activeStory.status !== overStory.status) {
      if (!canMoveToStatus(activeStory, overStory.status)) {
        blockedRef.current = true;
        return;
      }
      blockedRef.current = false;
      setDragStories((prev) =>
        prev!.map((s) => (s.id === active.id ? { ...s, status: overStory.status } : s))
      );
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active } = event;
    const wasBlocked = blockedRef.current;
    blockedRef.current = false;
    setActiveId(null);

    const story = (dragStories ?? storeStories).find((s) => s.id === active.id);
    setDragStories(null);

    if (!story) return;

    if (wasBlocked) {
      setBlockWarning(true);
      setTimeout(() => setBlockWarning(false), 6000);
      return;
    }

    // Collapse subtasks accordion if the story moved to a different column
    const originalStatus = storeStories.find((s) => s.id === active.id)?.status;
    if (story.status !== originalStatus && expandedStories.has(active.id as string)) {
      toggleStoryExpanded(active.id as string);
    }

    updateStoryStatus(active.id as string, story.status);
  }

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: { active: { opacity: "0.5" } },
    }),
  };

  return (
    <>
      <div className="mb-3">
        <FilterSortBar
          projectUsers={projectUsers}
          filter={filter}
          sort={sort}
          availableStatuses={["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]}
          onFilterChange={setFilter}
          onSortChange={setSort}
        />
      </div>

      {blockWarning && (
        <div className="mb-3 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Toutes les sous-tâches doivent être terminées avant de passer cette story en révision ou terminé.
        </div>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 min-h-[500px]">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              color={column.color}
              stories={localStories.filter((s) => s.status === column.id)}
              onStoryClick={setSelectedStory}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={dropAnimation}>
          {activeStory ? <StoryCardOverlay story={activeStory} /> : null}
        </DragOverlay>
      </DndContext>

      {hasMoreStories && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            onClick={loadMoreStories}
            disabled={isLoadingMore}
          >
            {isLoadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Charger plus de stories
          </Button>
        </div>
      )}

      <StoryDetailDialog
        story={selectedStory}
        projectId={projectId}
        open={!!selectedStory}
        onOpenChange={(open) => !open && setSelectedStory(null)}
      />
    </>
  );
}
