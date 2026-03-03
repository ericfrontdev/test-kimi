import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { validateBody, updateListSchema } from "@/lib/schemas";

// GET /api/projects/[id]/lists/[listId] - Get list detail with items
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; listId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId, listId } = await params;

  try {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: user.id },
          { members: { some: { userId: user.id } } },
        ],
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    }

    const list = await prisma.projectList.findFirst({
      where: { id: listId, projectId },
      include: {
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        items: { orderBy: { position: "asc" } },
      },
    });

    if (!list) {
      return NextResponse.json({ error: "Liste non trouvée" }, { status: 404 });
    }

    return NextResponse.json(list);
  } catch {
    return NextResponse.json(
      { error: "Échec de la récupération de la liste" },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[id]/lists/[listId] - Update list
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; listId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId, listId } = await params;

  const { data, response } = await validateBody(request, updateListSchema);
  if (response) return response;

  try {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: user.id },
          { members: { some: { userId: user.id } } },
        ],
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    }

    const existing = await prisma.projectList.findFirst({
      where: { id: listId, projectId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Liste non trouvée" }, { status: 404 });
    }

    const { title, description, status, priority, assigneeId } = data;

    const list = await prisma.projectList.update({
      where: { id: listId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description: description ?? null }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(assigneeId !== undefined && { assigneeId: assigneeId ?? null }),
      },
      include: {
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    return NextResponse.json(list);
  } catch {
    return NextResponse.json(
      { error: "Échec de la mise à jour de la liste" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/lists/[listId] - Delete list (OWNER/ADMIN only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; listId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId, listId } = await params;

  try {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: user.id },
          { members: { some: { userId: user.id, role: "ADMIN" } } },
        ],
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
    }

    const existing = await prisma.projectList.findFirst({
      where: { id: listId, projectId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Liste non trouvée" }, { status: 404 });
    }

    await prisma.projectList.delete({ where: { id: listId } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Échec de la suppression de la liste" },
      { status: 500 }
    );
  }
}
