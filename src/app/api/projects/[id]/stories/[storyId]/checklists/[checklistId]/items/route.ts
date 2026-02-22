import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const createItemSchema = z.object({
  title: z.string().min(1).max(500).trim(),
});

// POST /api/projects/[id]/stories/[storyId]/checklists/[checklistId]/items
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; storyId: string; checklistId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, storyId, checklistId } = await params;

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Corps invalide" }, { status: 400 }); }
  const parsed = createItemSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Titre requis" }, { status: 400 });

  try {
    const project = await prisma.project.findFirst({
      where: { id: projectId, OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }] },
    });
    if (!project) return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });

    const checklist = await prisma.checklist.findFirst({
      where: { id: checklistId, storyId, story: { projectId } },
    });
    if (!checklist) return NextResponse.json({ error: "Checklist non trouvée" }, { status: 404 });

    const count = await prisma.checklistItem.count({ where: { checklistId } });
    const item = await prisma.checklistItem.create({
      data: { title: parsed.data.title, checklistId, position: count },
    });

    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Échec de la création de l'item" }, { status: 500 });
  }
}
