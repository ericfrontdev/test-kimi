import { create } from "zustand";
import type { Story, Task, TaskStatus, ProjectUser } from "@/components/project/kanban/types";

interface ProjectState {
  projectId: string | null;
  stories: Story[];
  hasMoreStories: boolean;
  isLoadingMore: boolean;

  // Kanban UI state
  expandedStories: Set<string>;
  storyTasks: Record<string, Task[]>;
  loadingTasks: Set<string>;
  projectUsers: ProjectUser[];

  setProject: (projectId: string, stories: Story[], hasMoreStories?: boolean) => void;
  addStory: (story: Story) => void;
  removeStory: (storyId: string) => void;
  appendStories: (stories: Story[], hasMore: boolean) => void;
  loadMoreStories: () => Promise<void>;
  updateStoryStatus: (storyId: string, newStatus: string) => Promise<void>;
  updateStoryPriority: (storyId: string, newPriority: number) => Promise<void>;
  updateStoryAssignee: (
    storyId: string,
    assigneeId: string | null,
    assignee: { name: string | null; email: string; avatarUrl?: string | null } | null
  ) => Promise<void>;
  updateStoryFields: (
    storyId: string,
    data: { title: string; description: string; status: string }
  ) => Promise<void>;

  // Kanban UI actions
  toggleStoryExpanded: (storyId: string) => Promise<void>;
  fetchProjectUsers: (projectId: string) => Promise<void>;
  updateTaskAssignee: (
    storyId: string,
    taskId: string,
    assigneeId: string | null,
    assignee: { name: string | null; email: string; avatarUrl?: string | null } | null
  ) => Promise<void>;
  updateTaskStatus: (storyId: string, taskId: string, status: TaskStatus) => Promise<void>;
  setStoryTasksCache: (storyId: string, tasks: Task[]) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projectId: null,
  stories: [],
  hasMoreStories: false,
  isLoadingMore: false,

  expandedStories: new Set(),
  storyTasks: {},
  loadingTasks: new Set(),
  projectUsers: [],

  setProject: (projectId, stories, hasMoreStories = false) =>
    set({
      projectId,
      stories,
      hasMoreStories,
      expandedStories: new Set(),
      storyTasks: {},
      loadingTasks: new Set(),
      projectUsers: [],
    }),

  addStory: (story) =>
    set((state) => ({ stories: [story, ...state.stories] })),

  removeStory: (storyId) =>
    set((state) => ({ stories: state.stories.filter((s) => s.id !== storyId) })),

  appendStories: (newStories, hasMore) =>
    set((state) => {
      const existingIds = new Set(state.stories.map((s) => s.id));
      const toAdd = newStories.filter((s) => !existingIds.has(s.id));
      return { stories: [...state.stories, ...toAdd], hasMoreStories: hasMore };
    }),

  loadMoreStories: async () => {
    const { projectId, stories, isLoadingMore, hasMoreStories } = get();
    if (!projectId || isLoadingMore || !hasMoreStories) return;

    const skip = stories.filter((s) => s.status !== "ARCHIVED").length;
    set({ isLoadingMore: true });
    try {
      const res = await fetch(`/api/projects/${projectId}/stories?skip=${skip}&take=50`);
      if (res.ok) {
        const { stories: newStories, hasMore } = await res.json();
        get().appendStories(newStories, hasMore);
      }
    } finally {
      set({ isLoadingMore: false });
    }
  },

  updateStoryStatus: async (storyId, newStatus) => {
    const { projectId, stories } = get();
    if (!projectId) return;

    const previousStories = stories;
    set({ stories: stories.map((s) => (s.id === storyId ? { ...s, status: newStatus } : s)) });

    try {
      const response = await fetch(`/api/projects/${projectId}/stories/${storyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        set({ stories: previousStories });
      }
    } catch {
      set({ stories: previousStories });
    }
  },

  updateStoryPriority: async (storyId, newPriority) => {
    const { projectId, stories } = get();
    if (!projectId) return;

    const previousStories = stories;
    set({ stories: stories.map((s) => (s.id === storyId ? { ...s, priority: newPriority } : s)) });

    try {
      const response = await fetch(`/api/projects/${projectId}/stories/${storyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: newPriority }),
      });
      if (!response.ok) {
        set({ stories: previousStories });
      }
    } catch {
      set({ stories: previousStories });
    }
  },

  updateStoryAssignee: async (storyId, assigneeId, assignee) => {
    const { projectId, stories } = get();
    if (!projectId) return;

    const previousStories = stories;
    set({
      stories: stories.map((s) =>
        s.id === storyId ? { ...s, assigneeId, assignee } : s
      ),
    });

    try {
      const response = await fetch(`/api/projects/${projectId}/stories/${storyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignee: assigneeId }),
      });
      if (!response.ok) {
        set({ stories: previousStories });
      }
    } catch {
      set({ stories: previousStories });
    }
  },

  updateStoryFields: async (storyId, data) => {
    const { projectId, stories } = get();
    if (!projectId) return;

    const previousStories = stories;
    set({ stories: stories.map((s) => (s.id === storyId ? { ...s, ...data } : s)) });

    try {
      const response = await fetch(`/api/projects/${projectId}/stories/${storyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        set({ stories: previousStories });
      }
    } catch {
      set({ stories: previousStories });
    }
  },

  toggleStoryExpanded: async (storyId) => {
    const { expandedStories, storyTasks, projectId } = get();

    if (expandedStories.has(storyId)) {
      set((state) => {
        const next = new Set(state.expandedStories);
        next.delete(storyId);
        return { expandedStories: next };
      });
      return;
    }

    // Fetch tasks if not cached yet
    if (!storyTasks[storyId]) {
      set((state) => {
        const next = new Set(state.loadingTasks);
        next.add(storyId);
        return { loadingTasks: next };
      });
      try {
        const response = await fetch(`/api/projects/${projectId}/stories/${storyId}`);
        if (response.ok) {
          const data = await response.json();
          set((state) => ({
            storyTasks: { ...state.storyTasks, [storyId]: data.tasks || [] },
          }));
        }
      } catch {
        // silently fail
      } finally {
        set((state) => {
          const next = new Set(state.loadingTasks);
          next.delete(storyId);
          return { loadingTasks: next };
        });
      }
    }

    set((state) => {
      const next = new Set(state.expandedStories);
      next.add(storyId);
      return { expandedStories: next };
    });
  },

  fetchProjectUsers: async (projectId) => {
    const { projectUsers } = get();
    if (projectUsers.length > 0) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/members`);
      if (response.ok) {
        const users = await response.json();
        set({ projectUsers: users });
      }
    } catch {
      // silently fail
    }
  },

  updateTaskAssignee: async (storyId, taskId, assigneeId, assignee) => {
    const { projectId, storyTasks } = get();
    if (!projectId) return;

    const previousTasks = storyTasks[storyId];
    set((state) => ({
      storyTasks: {
        ...state.storyTasks,
        [storyId]: (state.storyTasks[storyId] || []).map((t) =>
          t.id === taskId ? { ...t, assignee } : t
        ),
      },
    }));

    try {
      const response = await fetch(
        `/api/projects/${projectId}/stories/${storyId}/tasks/${taskId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assigneeId }),
        }
      );
      if (!response.ok) {
        set((state) => ({
          storyTasks: { ...state.storyTasks, [storyId]: previousTasks },
        }));
      }
    } catch {
      set((state) => ({
        storyTasks: { ...state.storyTasks, [storyId]: previousTasks },
      }));
    }
  },

  updateTaskStatus: async (storyId, taskId, status) => {
    const { projectId, storyTasks } = get();
    if (!projectId) return;

    const previousTasks = storyTasks[storyId];
    set((state) => ({
      storyTasks: {
        ...state.storyTasks,
        [storyId]: (state.storyTasks[storyId] || []).map((t) =>
          t.id === taskId ? { ...t, status } : t
        ),
      },
    }));

    try {
      const response = await fetch(
        `/api/projects/${projectId}/stories/${storyId}/tasks/${taskId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );
      if (!response.ok) {
        set((state) => ({
          storyTasks: { ...state.storyTasks, [storyId]: previousTasks },
        }));
      }
    } catch {
      set((state) => ({
        storyTasks: { ...state.storyTasks, [storyId]: previousTasks },
      }));
    }
  },

  setStoryTasksCache: (storyId, tasks) =>
    set((state) => ({
      storyTasks: { ...state.storyTasks, [storyId]: tasks },
    })),
}));
