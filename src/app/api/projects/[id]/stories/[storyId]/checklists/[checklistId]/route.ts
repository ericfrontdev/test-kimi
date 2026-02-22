import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const updateChecklistSchema = z.object({
  title: z.string().min(1).max(200).trim(),
});

async function verifyAccess(userId: string, projectId: string, storyId: string, checklistId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, OR: [{ ownerId: userId }, { members: { some: { userId } } }] },
  });
  if (!project) return null;

  const checklist = await prisma.checklist.findFirst({
    where: { id: checklistId, storyId, story: { projectId } },
  });
  return checklist;
}

// PATCH /api/projects/[id]/stories/[storyId]/checklists/[checklistId] — rename
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; storyId: string; checklistId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, storyId, checklistId } = await params;

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Corps invalide" }, { status: 400 }); }
  const parsed = updateChecklistSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Titre invalide" }, { status: 400 });

  try {
    const checklist = await verifyAccess(user.id, projectId, storyId, checklistId);
    if (!checklist) return NextResponse.json({ error: "Checklist non trouvée" }, { status: 404 });

    const updated = await prisma.checklist.update({
      where: { id: checklistId },
      data: { title: parsed.data.title },
      include: { items: { orderBy: { position: "asc" } } },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Échec de la mise à jour" }, { status: 500 });
  }
}

// DELETE /api/projects/[id]/stories/[storyId]/checklists/[checklistId]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; storyId: string; checklistId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, storyId, checklistId } = await params;

  try {
    const checklist = await verifyAccess(user.id, projectId, storyId, checklistId);
    if (!checklist) return NextResponse.json({ error: "Checklist non trouvée" }, { status: 404 });

    await prisma.checklist.delete({ where: { id: checklistId } });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Échec de la suppression" }, { status: 500 });
  }
}
