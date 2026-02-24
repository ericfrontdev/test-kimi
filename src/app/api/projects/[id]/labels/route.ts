import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { validateBody, createLabelSchema } from "@/lib/schemas";

// GET /api/projects/[id]/labels
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;

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

    if (!project) return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });

    const labels = await prisma.label.findMany({
      where: { projectId },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(labels);
  } catch {
    return NextResponse.json({ error: "Échec de la récupération des labels" }, { status: 500 });
  }
}

// POST /api/projects/[id]/labels — create a label
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;

  const { data, response } = await validateBody(request, createLabelSchema);
  if (response) return response;

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

    if (!project) return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });

    const label = await prisma.label.create({
      data: { name: data.name, color: data.color, projectId },
    });

    return NextResponse.json(label, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Échec de la création du label" }, { status: 500 });
  }
}
