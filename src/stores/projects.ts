import { create } from "zustand";

interface Project {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  _count?: {
    stories: number;
  };
}

interface ProjectsState {
  projects: Project[];
  selectedProjectId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchProjects: () => Promise<void>;
  createProject: (data: { name: string; description?: string }) => Promise<Project | null>;
  updateProject: (id: string, data: { name?: string; description?: string }) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  selectProject: (id: string | null) => void;
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: [],
  selectedProjectId: null,
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch("/api/projects");
      if (!response.ok) throw new Error("Failed to fetch projects");
      const projects = await response.json();
      set({ projects, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createProject: async (data) => {
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create project");
      }
      
      const project = await response.json();
      set({ projects: [project, ...get().projects], error: null });
      return project;
    } catch (error) {
      const message = (error as Error).message;
      set({ error: message });
      return null;
    }
  },

  updateProject: async (id, data) => {
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error("Failed to update project");
      
      const updatedProject = await response.json();
      set({
        projects: get().projects.map((p) =>
          p.id === id ? updatedProject : p
        ),
      });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  deleteProject: async (id) => {
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) throw new Error("Failed to delete project");
      
      set({
        projects: get().projects.filter((p) => p.id !== id),
        selectedProjectId:
          get().selectedProjectId === id ? null : get().selectedProjectId,
      });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  selectProject: (id) => {
    set({ selectedProjectId: id });
  },
}));
