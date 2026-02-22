import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const updateItemSchema = z.object({
  title: z.string().min(1).max(500).trim().optional(),
  checked: z.boolean().optional(),
});

async function verifyItem(userId: string, projectId: string, checklistId: string, itemId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, OR: [{ ownerId: userId }, { members: { some: { userId } } }] },
  });
  if (!project) return null;
  return prisma.checklistItem.findFirst({
    where: { id: itemId, checklistId, checklist: { story: { projectId } } },
  });
}

// PATCH /api/.../checklists/[checklistId]/items/[itemId] — toggle or rename
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; storyId: string; checklistId: string; itemId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, checklistId, itemId } = await params;

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Corps invalide" }, { status: 400 }); }
  const parsed = updateItemSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  try {
    const item = await verifyItem(user.id, projectId, checklistId, itemId);
    if (!item) return NextResponse.json({ error: "Item non trouvé" }, { status: 404 });

    const updated = await prisma.checklistItem.update({
      where: { id: itemId },
      data: {
        ...(parsed.data.title !== undefined && { title: parsed.data.title }),
        ...(parsed.data.checked !== undefined && { checked: parsed.data.checked }),
      },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Échec de la mise à jour" }, { status: 500 });
  }
}

// DELETE /api/.../checklists/[checklistId]/items/[itemId]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; storyId: string; checklistId: string; itemId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, checklistId, itemId } = await params;

  try {
    const item = await verifyItem(user.id, projectId, checklistId, itemId);
    if (!item) return NextResponse.json({ error: "Item non trouvé" }, { status: 404 });

    await prisma.checklistItem.delete({ where: { id: itemId } });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Échec de la suppression" }, { status: 500 });
  }
}
