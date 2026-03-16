import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { validateBody, updateListItemSchema } from "@/lib/schemas";
import { getProjectAccess } from "@/lib/project-access";

// PATCH /api/projects/[id]/lists/[listId]/items/[itemId] - Update item
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; listId: string; itemId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId, listId, itemId } = await params;

  const { data, response } = await validateBody(request, updateListItemSchema);
  if (response) return response;

  try {
    const access = await getProjectAccess(user.id, projectId);
    if (!access) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    }

    const item = await prisma.listItem.findFirst({
      where: { id: itemId, listId },
    });

    if (!item) {
      return NextResponse.json({ error: "Item non trouvé" }, { status: 404 });
    }

    const { title, status } = data;

    const updated = await prisma.listItem.update({
      where: { id: itemId },
      data: {
        ...(title !== undefined && { title }),
        ...(status !== undefined && { status }),
      },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Échec de la mise à jour de l'item" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/lists/[listId]/items/[itemId] - Delete item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; listId: string; itemId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId, listId, itemId } = await params;

  try {
    const access = await getProjectAccess(user.id, projectId);
    if (!access) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    }

    const item = await prisma.listItem.findFirst({
      where: { id: itemId, listId },
    });

    if (!item) {
      return NextResponse.json({ error: "Item non trouvé" }, { status: 404 });
    }

    await prisma.listItem.delete({ where: { id: itemId } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Échec de la suppression de l'item" },
      { status: 500 }
    );
  }
}
