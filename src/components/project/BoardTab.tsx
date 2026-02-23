"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useKanbanStore } from "@/stores/kanban";
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
import type { Story, Task, ProjectUser, TaskStatus } from "./kanban/types";
import { columns } from "./kanban/types";

interface BoardTabProps {
  projectId: string;
}

export function BoardTab({ projectId }: BoardTabProps) {
  const setCurrentProjectId = useKanbanStore((state) => state.setCurrentProjectId);

  // Set projectId in store for child components
  useEffect(() => {
    setCurrentProjectId(projectId);
    return () => setCurrentProjectId(null);
  }, [projectId, setCurrentProjectId]);

  // Store reads
  const storeStories = useProjectStore((state) => state.stories);
  const hasMoreStories = useProjectStore((state) => state.hasMoreStories);
  const isLoadingMore = useProjectStore((state) => state.isLoadingMore);
  const loadMoreStories = useProjectStore((state) => state.loadMoreStories);
  const updateStoryStatus = useProjectStore((state) => state.updateStoryStatus);
  const updateStoryPriority = useProjectStore((state) => state.updateStoryPriority);
  const updateStoryAssignee = useProjectStore((state) => state.updateStoryAssignee);

  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [expandedStories, setExpandedStories] = useState<Set<string>>(new Set());
  const [storyTasks, setStoryTasks] = useState<Record<string, Task[]>>({});
  const [loadingTasks, setLoadingTasks] = useState<Set<string>>(new Set());

  // dragStories: null when not dragging (falls back to storeStories),
  // snapshot of store at drag-start during active drag
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER);
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT);

  const [dragStories, setDragStories] = useState<Story[] | null>(null);
  // Apply filters/sort on the store stories (not during drag — use snapshot as-is)
  const filteredStoreStories = applyFiltersAndSort(storeStories, filter, sort);
  const localStories = dragStories ?? filteredStoreStories;

  // Block moving to IN_REVIEW / DONE when subtasks are incomplete
  const blockedRef = useRef(false);
  const [blockWarning, setBlockWarning] = useState(false);

  function canMoveToStatus(story: Story, newStatus: string): boolean {
    if (newStatus !== "IN_REVIEW" && newStatus !== "DONE") return true;
    const loaded = storyTasks[story.id];
    if (loaded !== undefined) {
      return loaded.length === 0 || loaded.every((t) => t.status === "DONE");
    }
    // Fallback to store counts (from initial server render)
    return story.subtasks === 0 || story.completedSubtasks === story.subtasks;
  }

  const { data: projectUsers = [] } = useSWR<ProjectUser[]>(
    `/api/projects/${projectId}/members`,
    fetcher
  );

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
            setStoryTasks((prev) => ({ ...prev, [story.id]: data.tasks || [] }));
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

  async function toggleSubtasks(storyId: string) {
    const isExpanded = expandedStories.has(storyId);

    if (isExpanded) {
      setExpandedStories((prev) => {
        const next = new Set(prev);
        next.delete(storyId);
        return next;
      });
    } else {
      if (!storyTasks[storyId]) {
        setLoadingTasks((prev) => new Set(prev).add(storyId));
        try {
          const response = await fetch(`/api/projects/${projectId}/stories/${storyId}`);
          if (response.ok) {
            const data = await response.json();
            setStoryTasks((prev) => ({ ...prev, [storyId]: data.tasks || [] }));
          }
        } catch {
          // silently fail
        } finally {
          setLoadingTasks((prev) => {
            const next = new Set(prev);
            next.delete(storyId);
            return next;
          });
        }
      }
      setExpandedStories((prev) => new Set(prev).add(storyId));
    }
  }

  async function handlePriorityChange(storyId: string, newPriority: number) {
    await updateStoryPriority(storyId, newPriority);
  }

  async function handleAssigneeChange(storyId: string, assigneeId: string | null, assignSubtasks: boolean) {
    const user = assigneeId ? projectUsers.find((u) => u.id === assigneeId) : null;
    const assignee = user ? { name: user.name, email: user.email, avatarUrl: user.avatarUrl ?? null } : null;

    // Update story in store (handles optimistic update + API call + rollback)
    await updateStoryAssignee(storyId, assigneeId, assignee);

    // If assignSubtasks is true and tasks are loaded, update subtask assignees too
    if (assignSubtasks && storyTasks[storyId]?.length > 0) {
      const previousTasks = storyTasks[storyId];

      setStoryTasks((prev) => ({
        ...prev,
        [storyId]: prev[storyId]?.map((task) => ({ ...task, assignee: assignee || null })) || [],
      }));

      try {
        const results = await Promise.all(
          previousTasks.map((task) =>
            fetch(`/api/projects/${projectId}/stories/${storyId}/tasks/${task.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ assigneeId }),
            })
          )
        );
        if (results.some((r) => !r.ok)) {
          setStoryTasks((prev) => ({ ...prev, [storyId]: previousTasks }));
        }
      } catch {
        setStoryTasks((prev) => ({ ...prev, [storyId]: previousTasks }));
      }
    }
  }

  async function handleTaskAssigneeChange(storyId: string, taskId: string, assigneeId: string | null, assignee?: { name: string | null; email: string } | null) {
    const previousTasks = storyTasks[storyId];

    setStoryTasks((prev) => ({
      ...prev,
      [storyId]: prev[storyId]?.map((task) =>
        task.id === taskId ? { ...task, assignee: assignee || null } : task
      ) || [],
    }));

    try {
      const response = await fetch(`/api/projects/${projectId}/stories/${storyId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeId }),
      });
      if (!response.ok) {
        setStoryTasks((prev) => ({ ...prev, [storyId]: previousTasks }));
      }
    } catch {
      setStoryTasks((prev) => ({ ...prev, [storyId]: previousTasks }));
    }
  }

  async function handleTaskStatusChange(storyId: string, taskId: string, status: TaskStatus) {
    const previousTasks = storyTasks[storyId];

    setStoryTasks((prev) => ({
      ...prev,
      [storyId]: prev[storyId]?.map((task) =>
        task.id === taskId ? { ...task, status } : task
      ) || [],
    }));

    try {
      const response = await fetch(`/api/projects/${projectId}/stories/${storyId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        setStoryTasks((prev) => ({ ...prev, [storyId]: previousTasks }));
      }
    } catch {
      setStoryTasks((prev) => ({ ...prev, [storyId]: previousTasks }));
    }
  }

  function handleDragStart(event: DragStartEvent) {
    // Snapshot the filtered stories so drag updates are isolated
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
    if (story.status !== originalStatus) {
      setExpandedStories((prev) => {
        const next = new Set(prev);
        next.delete(active.id as string);
        return next;
      });
    }

    // Commit to store — handles optimistic update + API call + rollback
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
              expandedStories={expandedStories}
              storyTasks={storyTasks}
              loadingTasks={loadingTasks}
              onToggleSubtasks={toggleSubtasks}
              onPriorityChange={handlePriorityChange}
              onAssigneeChange={handleAssigneeChange}
              projectUsers={projectUsers}
              onTaskAssigneeChange={handleTaskAssigneeChange}
              onTaskStatusChange={handleTaskStatusChange}
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
