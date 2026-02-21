import { describe, it, expect } from "vitest";
import {
  createProjectSchema,
  updateProjectSchema,
  createStorySchema,
  updateStorySchema,
  createTaskSchema,
  updateTaskSchema,
  createCommentSchema,
  createTaskCommentSchema,
  createInvitationsSchema,
} from "@/lib/schemas";

// ─── createProjectSchema ──────────────────────────────────────────────────────

describe("createProjectSchema", () => {
  it("accepte un nom valide", () => {
    const result = createProjectSchema.safeParse({ name: "Mon projet" });
    expect(result.success).toBe(true);
  });

  it("accepte nom + description + couleur", () => {
    const result = createProjectSchema.safeParse({
      name: "Mon projet",
      description: "Une description",
      color: "#FF0000",
    });
    expect(result.success).toBe(true);
  });

  it("rejette un nom vide", () => {
    const result = createProjectSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejette un nom absent", () => {
    const result = createProjectSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejette un nom trop long (> 100 chars)", () => {
    const result = createProjectSchema.safeParse({ name: "a".repeat(101) });
    expect(result.success).toBe(false);
  });

  it("rejette une description trop longue (> 500 chars)", () => {
    const result = createProjectSchema.safeParse({
      name: "OK",
      description: "a".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it("trim le nom", () => {
    const result = createProjectSchema.safeParse({ name: "  Mon projet  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("Mon projet");
  });

  it("accepte description null", () => {
    const result = createProjectSchema.safeParse({ name: "OK", description: null });
    expect(result.success).toBe(true);
  });
});

// ─── updateProjectSchema ──────────────────────────────────────────────────────

describe("updateProjectSchema", () => {
  it("accepte un objet vide (tout optionnel)", () => {
    const result = updateProjectSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejette un nom vide si fourni", () => {
    const result = updateProjectSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("accepte description null pour effacer", () => {
    const result = updateProjectSchema.safeParse({ description: null });
    expect(result.success).toBe(true);
  });
});

// ─── createStorySchema ────────────────────────────────────────────────────────

describe("createStorySchema", () => {
  it("accepte un titre valide", () => {
    const result = createStorySchema.safeParse({ title: "Ma story" });
    expect(result.success).toBe(true);
  });

  it("accepte tous les champs", () => {
    const result = createStorySchema.safeParse({
      title: "Ma story",
      description: "Une description",
      status: "TODO",
      type: "FEATURE",
      priority: 2,
    });
    expect(result.success).toBe(true);
  });

  it("rejette un titre absent", () => {
    const result = createStorySchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejette un titre vide", () => {
    const result = createStorySchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });

  it("rejette un statut invalide", () => {
    const result = createStorySchema.safeParse({ title: "OK", status: "TOTO" });
    expect(result.success).toBe(false);
  });

  it("rejette un type invalide", () => {
    const result = createStorySchema.safeParse({ title: "OK", type: "BUG" });
    expect(result.success).toBe(false);
  });

  it("rejette une priorité hors plage (> 3)", () => {
    const result = createStorySchema.safeParse({ title: "OK", priority: 4 });
    expect(result.success).toBe(false);
  });

  it("rejette une priorité négative", () => {
    const result = createStorySchema.safeParse({ title: "OK", priority: -1 });
    expect(result.success).toBe(false);
  });

  it("accepte chaque valeur de statut valide", () => {
    const statuses = ["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "ARCHIVED"];
    for (const status of statuses) {
      const result = createStorySchema.safeParse({ title: "OK", status });
      expect(result.success, `status=${status} doit être valide`).toBe(true);
    }
  });
});

// ─── updateStorySchema ────────────────────────────────────────────────────────

describe("updateStorySchema", () => {
  it("accepte un objet vide", () => {
    const result = updateStorySchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejette un titre vide si fourni", () => {
    const result = updateStorySchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });

  it("accepte assignee null pour désassigner", () => {
    const result = updateStorySchema.safeParse({ assignee: null });
    expect(result.success).toBe(true);
  });

  it("rejette une priorité décimale", () => {
    const result = updateStorySchema.safeParse({ priority: 1.5 });
    expect(result.success).toBe(false);
  });
});

// ─── createTaskSchema ─────────────────────────────────────────────────────────

describe("createTaskSchema", () => {
  it("accepte un titre valide", () => {
    const result = createTaskSchema.safeParse({ title: "Implémenter la feature" });
    expect(result.success).toBe(true);
  });

  it("rejette un titre absent", () => {
    const result = createTaskSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejette un titre vide", () => {
    const result = createTaskSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });

  it("rejette un titre trop long (> 200 chars)", () => {
    const result = createTaskSchema.safeParse({ title: "a".repeat(201) });
    expect(result.success).toBe(false);
  });

  it("trim le titre", () => {
    const result = createTaskSchema.safeParse({ title: "  Ma tâche  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.title).toBe("Ma tâche");
  });
});

// ─── updateTaskSchema ─────────────────────────────────────────────────────────

describe("updateTaskSchema", () => {
  it("accepte un objet vide", () => {
    const result = updateTaskSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepte un statut valide", () => {
    const result = updateTaskSchema.safeParse({ status: "IN_PROGRESS" });
    expect(result.success).toBe(true);
  });

  it("rejette un statut invalide", () => {
    const result = updateTaskSchema.safeParse({ status: "ARCHIVED" });
    expect(result.success).toBe(false);
  });

  it("accepte assigneeId null pour désassigner", () => {
    const result = updateTaskSchema.safeParse({ assigneeId: null });
    expect(result.success).toBe(true);
  });

  it("rejette un titre vide si fourni", () => {
    const result = updateTaskSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });

  it("accepte chaque statut de tâche valide", () => {
    const statuses = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];
    for (const status of statuses) {
      const result = updateTaskSchema.safeParse({ status });
      expect(result.success, `status=${status} doit être valide`).toBe(true);
    }
  });
});

// ─── createCommentSchema ──────────────────────────────────────────────────────

describe("createCommentSchema", () => {
  it("accepte un contenu valide", () => {
    const result = createCommentSchema.safeParse({ content: "Super travail !" });
    expect(result.success).toBe(true);
  });

  it("rejette un contenu vide", () => {
    const result = createCommentSchema.safeParse({ content: "" });
    expect(result.success).toBe(false);
  });

  it("rejette un contenu absent", () => {
    const result = createCommentSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejette un contenu trop long (> 5000 chars)", () => {
    const result = createCommentSchema.safeParse({ content: "a".repeat(5001) });
    expect(result.success).toBe(false);
  });
});

// ─── createTaskCommentSchema ──────────────────────────────────────────────────

describe("createTaskCommentSchema", () => {
  it("accepte contenu seul (mentions par défaut = [])", () => {
    const result = createTaskCommentSchema.safeParse({ content: "OK" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.mentions).toEqual([]);
  });

  it("accepte contenu + mentions", () => {
    const result = createTaskCommentSchema.safeParse({
      content: "Bonjour",
      mentions: ["user-1", "user-2"],
    });
    expect(result.success).toBe(true);
  });

  it("rejette un contenu vide", () => {
    const result = createTaskCommentSchema.safeParse({ content: "" });
    expect(result.success).toBe(false);
  });
});

// ─── createInvitationsSchema ──────────────────────────────────────────────────

describe("createInvitationsSchema", () => {
  it("accepte un email + un projet valides", () => {
    const result = createInvitationsSchema.safeParse({
      emails: ["alice@example.com"],
      projectIds: ["project-1"],
    });
    expect(result.success).toBe(true);
  });

  it("rejette un email invalide", () => {
    const result = createInvitationsSchema.safeParse({
      emails: ["pas-un-email"],
      projectIds: ["project-1"],
    });
    expect(result.success).toBe(false);
  });

  it("rejette une liste d'emails vide", () => {
    const result = createInvitationsSchema.safeParse({
      emails: [],
      projectIds: ["project-1"],
    });
    expect(result.success).toBe(false);
  });

  it("rejette une liste de projets vide", () => {
    const result = createInvitationsSchema.safeParse({
      emails: ["alice@example.com"],
      projectIds: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejette plus de 20 emails", () => {
    const emails = Array.from({ length: 21 }, (_, i) => `user${i}@example.com`);
    const result = createInvitationsSchema.safeParse({
      emails,
      projectIds: ["project-1"],
    });
    expect(result.success).toBe(false);
  });

  it("accepte exactement 20 emails", () => {
    const emails = Array.from({ length: 20 }, (_, i) => `user${i}@example.com`);
    const result = createInvitationsSchema.safeParse({
      emails,
      projectIds: ["project-1"],
    });
    expect(result.success).toBe(true);
  });
});
