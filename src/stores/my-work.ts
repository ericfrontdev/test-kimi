import { create } from "zustand";

interface Story {
  id: string;
  title: string;
  status: string;
  project: string;
  subtasks: number;
  completedSubtasks: number;
}

interface Activity {
  id: string;
  content: string;
  time: string;
}

interface Stats {
  projects: number;
  stories: number;
  inProgress: number;
}

interface MyWorkState {
  stories: Story[];
  activities: Activity[];
  stats: Stats;
  isLoading: boolean;
  error: string | null;
  
  fetchMyWork: () => Promise<void>;
}

export const useMyWorkStore = create<MyWorkState>((set) => ({
  stories: [],
  activities: [],
  stats: {
    projects: 0,
    stories: 0,
    inProgress: 0,
  },
  isLoading: false,
  error: null,

  fetchMyWork: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/my-work");
      if (!response.ok) throw new Error("Failed to fetch my work data");
      const data = await response.json();
      set({
        stories: data.stories,
        activities: data.activities,
        stats: data.stats,
        isLoading: false,
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
}));
