import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const StoryStatusSchema = z.enum([
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "DONE",
  "ARCHIVED",
]);

export const StoryTypeSchema = z.enum(["FEATURE", "FIX"]);

export const TaskStatusSchema = z.enum([
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "DONE",
]);

// ─── Projects ─────────────────────────────────────────────────────────────────

export const createProjectSchema = z.object({
  name: z
    .string({ error: "Le nom est requis" })
    .min(1, "Le nom est requis")
    .max(100, "Le nom ne peut pas dépasser 100 caractères")
    .trim(),
  description: z
    .string()
    .max(500, "La description ne peut pas dépasser 500 caractères")
    .nullish(),
  color: z.string().max(20).nullish(),
});

export const updateProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom est requis")
    .max(100, "Le nom ne peut pas dépasser 100 caractères")
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, "La description ne peut pas dépasser 500 caractères")
    .nullish(),
});

// ─── Stories ──────────────────────────────────────────────────────────────────

export const createStorySchema = z.object({
  title: z
    .string({ error: "Le titre est requis" })
    .min(1, "Le titre est requis")
    .max(200, "Le titre ne peut pas dépasser 200 caractères")
    .trim(),
  description: z
    .string()
    .max(2000, "La description ne peut pas dépasser 2000 caractères")
    .nullish(),
  status: StoryStatusSchema.optional(),
  type: StoryTypeSchema.optional(),
  priority: z.number().int().min(0).max(3).optional(),
  assigneeId: z.string().uuid().nullish(),
  dueDate: z.coerce.date().nullish(),
  labelIds: z.array(z.string().uuid()).optional().default([]),
});

export const updateStorySchema = z.object({
  title: z
    .string()
    .min(1, "Le titre ne peut pas être vide")
    .max(200, "Le titre ne peut pas dépasser 200 caractères")
    .trim()
    .optional(),
  description: z
    .string()
    .max(2000, "La description ne peut pas dépasser 2000 caractères")
    .nullish(),
  status: StoryStatusSchema.optional(),
  priority: z.number().int().min(0).max(3).optional(),
  assignee: z.string().nullable().optional(),
  dueDate: z.coerce.date().nullish(),
});

// ─── Tasks ────────────────────────────────────────────────────────────────────

export const createTaskSchema = z.object({
  title: z
    .string({ error: "Le titre est requis" })
    .min(1, "Le titre est requis")
    .max(200, "Le titre ne peut pas dépasser 200 caractères")
    .trim(),
});

export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Le titre ne peut pas être vide")
    .max(200, "Le titre ne peut pas dépasser 200 caractères")
    .trim()
    .optional(),
  status: TaskStatusSchema.optional(),
  assigneeId: z.string().nullable().optional(),
});

// ─── Labels ───────────────────────────────────────────────────────────────────

export const createLabelSchema = z.object({
  name: z
    .string({ error: "Le nom est requis" })
    .min(1, "Le nom est requis")
    .max(50, "Le nom ne peut pas dépasser 50 caractères")
    .trim(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Couleur invalide").default("#6366f1"),
});

// ─── Comments ─────────────────────────────────────────────────────────────────

export const createCommentSchema = z.object({
  content: z
    .string({ error: "Le contenu est requis" })
    .min(1, "Le contenu est requis")
    .max(5000, "Le commentaire ne peut pas dépasser 5000 caractères")
    .trim(),
  mentions: z.array(z.string()).optional().default([]),
});

export const createTaskCommentSchema = z.object({
  content: z
    .string({ error: "Le contenu est requis" })
    .min(1, "Le contenu est requis")
    .max(5000, "Le commentaire ne peut pas dépasser 5000 caractères")
    .trim(),
  mentions: z.array(z.string()).optional().default([]),
});

// ─── Invitations ──────────────────────────────────────────────────────────────

export const createInvitationsSchema = z.object({
  emails: z
    .array(z.string().email("Email invalide"))
    .min(1, "Au moins un email est requis")
    .max(20, "Maximum 20 emails par envoi"),
  projectIds: z
    .array(z.string().min(1))
    .min(1, "Au moins un projet est requis"),
});

// ─── Helper ───────────────────────────────────────────────────────────────────

type ValidationSuccess<T> = { data: T; response?: never };
type ValidationError = { data?: never; response: NextResponse };

export async function validateBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<ValidationSuccess<T> | ValidationError> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      response: NextResponse.json(
        { error: "Corps de la requête invalide" },
        { status: 400 }
      ),
    };
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    const messages = result.error.issues.map((i) => i.message).join(", ");
    return {
      response: NextResponse.json({ error: messages }, { status: 400 }),
    };
  }

  return { data: result.data };
}
