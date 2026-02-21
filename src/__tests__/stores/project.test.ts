import { describe, it, expect, beforeEach, vi } from "vitest";
import { useProjectStore } from "@/stores/project";
import type { Story } from "@/components/project/kanban/types";

// Helpers
function makeStory(overrides: Partial<Story> = {}): Story {
  return {
    id: "story-1",
    storyNumber: 1,
    title: "Test story",
    status: "BACKLOG",
    type: "FEATURE",
    priority: 2,
    subtasks: 0,
    completedSubtasks: 0,
    assigneeId: null,
    assignee: null,
    ...overrides,
  };
}

function resetStore() {
  useProjectStore.setState({
    projectId: null,
    stories: [],
    hasMoreStories: false,
  });
}

// ─── setProject ───────────────────────────────────────────────────────────────

describe("setProject", () => {
  beforeEach(resetStore);

  it("initialise projectId et stories", () => {
    const stories = [makeStory()];
    useProjectStore.getState().setProject("proj-1", stories);

    const state = useProjectStore.getState();
    expect(state.projectId).toBe("proj-1");
    expect(state.stories).toEqual(stories);
    expect(state.hasMoreStories).toBe(false);
  });

  it("accepte hasMoreStories=true", () => {
    useProjectStore.getState().setProject("proj-1", [], true);
    expect(useProjectStore.getState().hasMoreStories).toBe(true);
  });

  it("remplace les stories existantes", () => {
    const first = [makeStory({ id: "a" })];
    const second = [makeStory({ id: "b" }), makeStory({ id: "c" })];

    useProjectStore.getState().setProject("proj-1", first);
    useProjectStore.getState().setProject("proj-1", second);

    expect(useProjectStore.getState().stories).toHaveLength(2);
    expect(useProjectStore.getState().stories[0].id).toBe("b");
  });
});

// ─── addStory ─────────────────────────────────────────────────────────────────

describe("addStory", () => {
  beforeEach(resetStore);

  it("prepend la story en tête de liste", () => {
    const existing = makeStory({ id: "old" });
    useProjectStore.getState().setProject("proj-1", [existing]);

    const newStory = makeStory({ id: "new", title: "Nouvelle story" });
    useProjectStore.getState().addStory(newStory);

    const stories = useProjectStore.getState().stories;
    expect(stories[0].id).toBe("new");
    expect(stories[1].id).toBe("old");
  });

  it("ajoute dans une liste vide", () => {
    useProjectStore.getState().setProject("proj-1", []);
    useProjectStore.getState().addStory(makeStory());
    expect(useProjectStore.getState().stories).toHaveLength(1);
  });
});

// ─── removeStory ──────────────────────────────────────────────────────────────

describe("removeStory", () => {
  beforeEach(resetStore);

  it("supprime la story par id", () => {
    const stories = [makeStory({ id: "a" }), makeStory({ id: "b" })];
    useProjectStore.getState().setProject("proj-1", stories);

    useProjectStore.getState().removeStory("a");

    const state = useProjectStore.getState().stories;
    expect(state).toHaveLength(1);
    expect(state[0].id).toBe("b");
  });

  it("ne plante pas si l'id n'existe pas", () => {
    useProjectStore.getState().setProject("proj-1", [makeStory({ id: "a" })]);
    useProjectStore.getState().removeStory("inexistant");
    expect(useProjectStore.getState().stories).toHaveLength(1);
  });
});

// ─── appendStories ────────────────────────────────────────────────────────────

describe("appendStories", () => {
  beforeEach(resetStore);

  it("ajoute les nouvelles stories à la suite", () => {
    const initial = [makeStory({ id: "a" })];
    useProjectStore.getState().setProject("proj-1", initial);

    const more = [makeStory({ id: "b" }), makeStory({ id: "c" })];
    useProjectStore.getState().appendStories(more, false);

    const stories = useProjectStore.getState().stories;
    expect(stories).toHaveLength(3);
    expect(stories.map((s) => s.id)).toEqual(["a", "b", "c"]);
  });

  it("déduplique les stories déjà présentes", () => {
    const initial = [makeStory({ id: "a" }), makeStory({ id: "b" })];
    useProjectStore.getState().setProject("proj-1", initial);

    // "b" est déjà dans le store
    const more = [makeStory({ id: "b" }), makeStory({ id: "c" })];
    useProjectStore.getState().appendStories(more, false);

    const stories = useProjectStore.getState().stories;
    expect(stories).toHaveLength(3);
    expect(stories.filter((s) => s.id === "b")).toHaveLength(1);
  });

  it("met à jour hasMoreStories", () => {
    useProjectStore.getState().setProject("proj-1", [], false);
    useProjectStore.getState().appendStories([makeStory()], true);
    expect(useProjectStore.getState().hasMoreStories).toBe(true);

    useProjectStore.getState().appendStories([], false);
    expect(useProjectStore.getState().hasMoreStories).toBe(false);
  });

  it("gère une liste vide à appender", () => {
    useProjectStore.getState().setProject("proj-1", [makeStory({ id: "a" })]);
    useProjectStore.getState().appendStories([], false);
    expect(useProjectStore.getState().stories).toHaveLength(1);
  });
});

// ─── updateStoryStatus (optimistic) ──────────────────────────────────────────

describe("updateStoryStatus", () => {
  beforeEach(() => {
    resetStore();
    vi.restoreAllMocks();
  });

  it("met à jour le statut de façon optimiste", async () => {
    useProjectStore.getState().setProject("proj-1", [makeStory({ id: "s1", status: "BACKLOG" })]);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true } as Response)
    );

    await useProjectStore.getState().updateStoryStatus("s1", "TODO");

    const story = useProjectStore.getState().stories.find((s) => s.id === "s1");
    expect(story?.status).toBe("TODO");
  });

  it("rollback si la requête échoue (ok: false)", async () => {
    useProjectStore.getState().setProject("proj-1", [makeStory({ id: "s1", status: "BACKLOG" })]);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false } as Response)
    );

    await useProjectStore.getState().updateStoryStatus("s1", "TODO");

    const story = useProjectStore.getState().stories.find((s) => s.id === "s1");
    expect(story?.status).toBe("BACKLOG");
  });

  it("rollback si fetch throw", async () => {
    useProjectStore.getState().setProject("proj-1", [makeStory({ id: "s1", status: "BACKLOG" })]);

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("réseau")));

    await useProjectStore.getState().updateStoryStatus("s1", "TODO");

    const story = useProjectStore.getState().stories.find((s) => s.id === "s1");
    expect(story?.status).toBe("BACKLOG");
  });

  it("ne fait rien si projectId est null", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    await useProjectStore.getState().updateStoryStatus("s1", "TODO");

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

// ─── updateStoryPriority (optimistic) ────────────────────────────────────────

describe("updateStoryPriority", () => {
  beforeEach(() => {
    resetStore();
    vi.restoreAllMocks();
  });

  it("met à jour la priorité de façon optimiste", async () => {
    useProjectStore.getState().setProject("proj-1", [makeStory({ id: "s1", priority: 3 })]);

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true } as Response));

    await useProjectStore.getState().updateStoryPriority("s1", 0);

    const story = useProjectStore.getState().stories.find((s) => s.id === "s1");
    expect(story?.priority).toBe(0);
  });

  it("rollback si la requête échoue", async () => {
    useProjectStore.getState().setProject("proj-1", [makeStory({ id: "s1", priority: 3 })]);

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false } as Response));

    await useProjectStore.getState().updateStoryPriority("s1", 0);

    const story = useProjectStore.getState().stories.find((s) => s.id === "s1");
    expect(story?.priority).toBe(3);
  });
});

// ─── updateStoryAssignee (optimistic) ────────────────────────────────────────

describe("updateStoryAssignee", () => {
  beforeEach(() => {
    resetStore();
    vi.restoreAllMocks();
  });

  it("met à jour l'assigné de façon optimiste", async () => {
    useProjectStore.getState().setProject("proj-1", [makeStory({ id: "s1", assigneeId: null, assignee: null })]);

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true } as Response));

    const newAssignee = { name: "Alice", email: "alice@example.com" };
    await useProjectStore.getState().updateStoryAssignee("s1", "user-alice", newAssignee);

    const story = useProjectStore.getState().stories.find((s) => s.id === "s1");
    expect(story?.assigneeId).toBe("user-alice");
    expect(story?.assignee).toEqual(newAssignee);
  });

  it("rollback si la requête échoue", async () => {
    const original = makeStory({ id: "s1", assigneeId: "user-bob", assignee: { name: "Bob", email: "bob@example.com" } });
    useProjectStore.getState().setProject("proj-1", [original]);

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false } as Response));

    await useProjectStore.getState().updateStoryAssignee("s1", null, null);

    const story = useProjectStore.getState().stories.find((s) => s.id === "s1");
    expect(story?.assigneeId).toBe("user-bob");
  });

  it("accepte assigneeId null (désassigner)", async () => {
    useProjectStore.getState().setProject("proj-1", [
      makeStory({ id: "s1", assigneeId: "user-alice", assignee: { name: "Alice", email: "alice@example.com" } }),
    ]);

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true } as Response));

    await useProjectStore.getState().updateStoryAssignee("s1", null, null);

    const story = useProjectStore.getState().stories.find((s) => s.id === "s1");
    expect(story?.assigneeId).toBeNull();
    expect(story?.assignee).toBeNull();
  });
});

// ─── updateStoryFields (optimistic) ──────────────────────────────────────────

describe("updateStoryFields", () => {
  beforeEach(() => {
    resetStore();
    vi.restoreAllMocks();
  });

  it("met à jour les champs de façon optimiste", async () => {
    useProjectStore.getState().setProject("proj-1", [makeStory({ id: "s1", title: "Ancien titre", status: "BACKLOG" })]);

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true } as Response));

    await useProjectStore.getState().updateStoryFields("s1", {
      title: "Nouveau titre",
      description: "Nouvelle description",
      status: "IN_PROGRESS",
    });

    const story = useProjectStore.getState().stories.find((s) => s.id === "s1");
    expect(story?.title).toBe("Nouveau titre");
    expect(story?.status).toBe("IN_PROGRESS");
  });

  it("rollback si la requête échoue", async () => {
    useProjectStore.getState().setProject("proj-1", [makeStory({ id: "s1", title: "Titre original", status: "BACKLOG" })]);

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false } as Response));

    await useProjectStore.getState().updateStoryFields("s1", {
      title: "Titre modifié",
      description: "",
      status: "DONE",
    });

    const story = useProjectStore.getState().stories.find((s) => s.id === "s1");
    expect(story?.title).toBe("Titre original");
    expect(story?.status).toBe("BACKLOG");
  });
});
