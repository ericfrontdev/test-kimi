import { create } from "zustand";

const STALE_TIME_MS = 30_000; // 30 secondes

interface Story {
  id: string;
  title: string;
  status: string;
  project: string;
  subtasks: number;
  completedSubtasks: number;
}

export interface ActivityComment {
  id: string;
  content: string;
  storyId: string;
  story: string;
  projectId: string;
  project: string;
  time: string;
}

export interface ActivityMention {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  projectId: string | null;
  storyId: string | null;
}

export interface UpcomingStory {
  id: string;
  title: string;
  status: string;
  project: string;
  dueDate: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  status: string;
  checklistId: string;
  checklist: string;
  story: string;
  storyId: string;
  projectId: string;
  project: string;
}

interface Stats {
  projects: number;
  stories: number;
  inProgress: number;
}

interface MyWorkState {
  stories: Story[];
  checklistItems: ChecklistItem[];
  upcomingStories: UpcomingStory[];
  comments: ActivityComment[];
  mentions: ActivityMention[];
  stats: Stats;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;

  fetchMyWork: (force?: boolean) => Promise<void>;
  updateChecklistItemStatus: (itemId: string, status: string) => void;
  resetCache: () => void;
}

export const useMyWorkStore = create<MyWorkState>((set, get) => ({
  stories: [],
  checklistItems: [],
  upcomingStories: [],
  comments: [],
  mentions: [],
  stats: {
    projects: 0,
    stories: 0,
    inProgress: 0,
  },
  isLoading: false,
  error: null,
  lastFetched: null,

  fetchMyWork: async (force = false) => {
    const { isLoading, lastFetched } = get();

    // Ne pas refetcher si déjà en cours
    if (isLoading) return;

    // Ne pas refetcher si les données sont fraîches (< 30s)
    if (!force && lastFetched && Date.now() - lastFetched < STALE_TIME_MS) return;

    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/my-work");
      if (!response.ok) throw new Error("Failed to fetch my work data");
      const data = await response.json();
      set({
        stories: data.stories,
        checklistItems: data.checklistItems,
        upcomingStories: data.upcomingStories,
        comments: data.comments,
        mentions: data.mentions,
        stats: data.stats,
        isLoading: false,
        lastFetched: Date.now(),
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateChecklistItemStatus: (itemId, status) => {
    set((state) => ({
      checklistItems: state.checklistItems.map((item) =>
        item.id === itemId ? { ...item, status } : item
      ),
    }));
  },

  resetCache: () => set({ lastFetched: null }),
}));
