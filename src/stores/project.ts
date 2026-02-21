import { create } from "zustand";
import type { Story } from "@/components/project/kanban/types";

interface ProjectState {
  projectId: string | null;
  stories: Story[];
  setProject: (projectId: string, stories: Story[]) => void;
  addStory: (story: Story) => void;
  removeStory: (storyId: string) => void;
  updateStoryStatus: (storyId: string, newStatus: string) => Promise<void>;
  updateStoryPriority: (storyId: string, newPriority: number) => Promise<void>;
  updateStoryAssignee: (
    storyId: string,
    assigneeId: string | null,
    assignee: { name: string | null; email: string } | null
  ) => Promise<void>;
  updateStoryFields: (
    storyId: string,
    data: { title: string; description: string; status: string }
  ) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projectId: null,
  stories: [],

  setProject: (projectId, stories) => set({ projectId, stories }),

  addStory: (story) =>
    set((state) => ({ stories: [story, ...state.stories] })),

  removeStory: (storyId) =>
    set((state) => ({ stories: state.stories.filter((s) => s.id !== storyId) })),

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
}));
