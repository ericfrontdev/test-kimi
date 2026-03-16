import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { validateBody, createListItemSchema } from "@/lib/schemas";
import { getProjectAccess } from "@/lib/project-access";

// POST /api/projects/[id]/lists/[listId]/items - Create list item
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; listId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId, listId } = await params;

  const { data, response } = await validateBody(request, createListItemSchema);
  if (response) return response;

  try {
    const access = await getProjectAccess(user.id, projectId);
    if (!access) {
      return NextResponse.json({ error: "Projet introuvable ou accès refusé" }, { status: 403 });
    }

    const list = await prisma.projectList.findFirst({
      where: { id: listId, projectId },
    });

    if (!list) {
      return NextResponse.json({ error: "Liste non trouvée" }, { status: 404 });
    }

    // Compute next position
    const last = await prisma.listItem.findFirst({
      where: { listId },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    const position = (last?.position ?? -1) + 1;

    const item = await prisma.listItem.create({
      data: {
        title: data.title,
        position,
        listId,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Échec de la création de l'item" },
      { status: 500 }
    );
  }
}
