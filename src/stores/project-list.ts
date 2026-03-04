import { create } from "zustand";

export interface ListItem {
  id: string;
  title: string;
  status: "TODO" | "DONE";
  position: number;
  listId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectList {
  id: string;
  listNumber: number;
  title: string;
  description?: string | null;
  status: string;
  priority: number;
  assigneeId?: string | null;
  assignee?: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl?: string | null;
  } | null;
  items: Pick<ListItem, "id" | "status">[];
  createdAt: string;
  updatedAt: string;
}

interface ProjectListState {
  projectId: string | null;
  lists: ProjectList[];
  hasMoreLists: boolean;
  isLoadingMore: boolean;
  expandedLists: Set<string>;
  listItems: Record<string, ListItem[]>; // cache listId → full items

  setLists: (projectId: string, lists: ProjectList[], hasMore: boolean) => void;
  addList: (list: ProjectList) => void;
  removeList: (listId: string) => void;
  appendLists: (newLists: ProjectList[], hasMore: boolean) => void;
  loadMoreLists: () => Promise<void>;
  updateListStatus: (listId: string, status: string) => Promise<void>;
  updateListPriority: (listId: string, priority: number) => Promise<void>;
  updateListAssignee: (
    listId: string,
    assigneeId: string | null,
    assignee: ProjectList["assignee"]
  ) => Promise<void>;
  updateListFields: (listId: string, fields: Partial<Pick<ProjectList, "title" | "description" | "status">>) => Promise<void>;
  toggleListExpanded: (listId: string) => Promise<void>;
  setListItemsCache: (listId: string, items: ListItem[]) => void;
  addListItem: (listId: string, item: ListItem) => void;
  removeListItem: (listId: string, itemId: string) => void;
  updateListItem: (listId: string, itemId: string, data: Partial<ListItem>) => void;
}

export const useProjectListStore = create<ProjectListState>((set, get) => ({
  projectId: null,
  lists: [],
  hasMoreLists: false,
  isLoadingMore: false,
  expandedLists: new Set(),
  listItems: {},

  setLists: (projectId, lists, hasMore) =>
    set({
      projectId,
      lists,
      hasMoreLists: hasMore,
      expandedLists: new Set(),
      listItems: {},
    }),

  addList: (list) =>
    set((state) => {
      const exists = state.lists.some((l) => l.id === list.id);
      if (exists) {
        return { lists: state.lists.map((l) => (l.id === list.id ? list : l)) };
      }
      return { lists: [list, ...state.lists] };
    }),

  removeList: (listId) =>
    set((state) => ({ lists: state.lists.filter((l) => l.id !== listId) })),

  appendLists: (newLists, hasMore) =>
    set((state) => {
      const existingIds = new Set(state.lists.map((l) => l.id));
      const toAdd = newLists.filter((l) => !existingIds.has(l.id));
      return { lists: [...state.lists, ...toAdd], hasMoreLists: hasMore };
    }),

  loadMoreLists: async () => {
    const { projectId, lists, isLoadingMore, hasMoreLists } = get();
    if (!projectId || isLoadingMore || !hasMoreLists) return;

    const skip = lists.filter((l) => l.status !== "ARCHIVED").length;
    set({ isLoadingMore: true });
    try {
      const res = await fetch(`/api/projects/${projectId}/lists?skip=${skip}&take=50`);
      if (res.ok) {
        const { lists: newLists, hasMore } = await res.json();
        get().appendLists(newLists, hasMore);
      }
    } finally {
      set({ isLoadingMore: false });
    }
  },

  updateListStatus: async (listId, status) => {
    const { projectId, lists } = get();
    if (!projectId) return;

    const previous = lists;
    set({ lists: lists.map((l) => (l.id === listId ? { ...l, status } : l)) });

    try {
      const res = await fetch(`/api/projects/${projectId}/lists/${listId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) set({ lists: previous });
    } catch {
      set({ lists: previous });
    }
  },

  updateListPriority: async (listId, priority) => {
    const { projectId, lists } = get();
    if (!projectId) return;

    const previous = lists;
    set({ lists: lists.map((l) => (l.id === listId ? { ...l, priority } : l)) });

    try {
      const res = await fetch(`/api/projects/${projectId}/lists/${listId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority }),
      });
      if (!res.ok) set({ lists: previous });
    } catch {
      set({ lists: previous });
    }
  },

  updateListAssignee: async (listId, assigneeId, assignee) => {
    const { projectId, lists } = get();
    if (!projectId) return;

    const previous = lists;
    set({ lists: lists.map((l) => (l.id === listId ? { ...l, assigneeId, assignee } : l)) });

    try {
      const res = await fetch(`/api/projects/${projectId}/lists/${listId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeId }),
      });
      if (!res.ok) set({ lists: previous });
    } catch {
      set({ lists: previous });
    }
  },

  updateListFields: async (listId, fields) => {
    const { projectId, lists } = get();
    if (!projectId) return;

    const previous = lists;
    set({ lists: lists.map((l) => (l.id === listId ? { ...l, ...fields } : l)) });

    try {
      const res = await fetch(`/api/projects/${projectId}/lists/${listId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (!res.ok) set({ lists: previous });
    } catch {
      set({ lists: previous });
    }
  },

  toggleListExpanded: async (listId) => {
    const { expandedLists, listItems, projectId } = get();

    if (expandedLists.has(listId)) {
      set((state) => {
        const next = new Set(state.expandedLists);
        next.delete(listId);
        return { expandedLists: next };
      });
      return;
    }

    // Fetch full items if not cached
    if (!listItems[listId]) {
      try {
        const res = await fetch(`/api/projects/${projectId}/lists/${listId}`);
        if (res.ok) {
          const data = await res.json();
          set((state) => ({
            listItems: { ...state.listItems, [listId]: data.items || [] },
          }));
        }
      } catch {
        // silently fail
      }
    }

    set((state) => {
      const next = new Set(state.expandedLists);
      next.add(listId);
      return { expandedLists: next };
    });
  },

  setListItemsCache: (listId, items) =>
    set((state) => ({
      listItems: { ...state.listItems, [listId]: items },
    })),

  addListItem: (listId, item) =>
    set((state) => ({
      listItems: {
        ...state.listItems,
        [listId]: [...(state.listItems[listId] ?? []), item],
      },
      // Update the summary items count on the list
      lists: state.lists.map((l) =>
        l.id === listId
          ? { ...l, items: [...l.items, { id: item.id, status: item.status }] }
          : l
      ),
    })),

  removeListItem: (listId, itemId) =>
    set((state) => ({
      listItems: {
        ...state.listItems,
        [listId]: (state.listItems[listId] ?? []).filter((i) => i.id !== itemId),
      },
      lists: state.lists.map((l) =>
        l.id === listId
          ? { ...l, items: l.items.filter((i) => i.id !== itemId) }
          : l
      ),
    })),

  updateListItem: (listId, itemId, data) =>
    set((state) => ({
      listItems: {
        ...state.listItems,
        [listId]: (state.listItems[listId] ?? []).map((i) =>
          i.id === itemId ? { ...i, ...data } : i
        ),
      },
      lists: state.lists.map((l) =>
        l.id === listId
          ? {
              ...l,
              items: l.items.map((i) =>
                i.id === itemId ? { ...i, ...(data.status ? { status: data.status } : {}) } : i
              ),
            }
          : l
      ),
    })),
}));
