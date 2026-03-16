import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { validateBody, createListSchema } from "@/lib/schemas";
import { getProjectAccess } from "@/lib/project-access";

const TAKE_DEFAULT = 50;
const TAKE_MAX = 100;

// GET /api/projects/[id]/lists - List project lists with pagination
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId } = await params;
  const { searchParams } = new URL(request.url);

  const skip = Math.max(0, parseInt(searchParams.get("skip") ?? "0", 10) || 0);
  const take = Math.min(TAKE_MAX, Math.max(1, parseInt(searchParams.get("take") ?? String(TAKE_DEFAULT), 10) || TAKE_DEFAULT));
  const statusParam = searchParams.get("status");

  try {
    const access = await getProjectAccess(user.id, projectId);
    if (!access) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    }

    const statusFilter = statusParam
      ? { status: statusParam }
      : { status: { not: "ARCHIVED" } };

    const [lists, total] = await Promise.all([
      prisma.projectList.findMany({
        where: { projectId, ...statusFilter },
        include: {
          assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
          items: { select: { id: true, status: true }, orderBy: { position: "asc" } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.projectList.count({ where: { projectId, ...statusFilter } }),
    ]);

    return NextResponse.json({ lists, total, hasMore: skip + take < total });
  } catch {
    return NextResponse.json(
      { error: "Échec de la récupération des listes" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/lists - Create new list
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId } = await params;

  const { data, response } = await validateBody(request, createListSchema);
  if (response) return response;

  try {
    const { title, description, status, priority, assigneeId } = data;

    // Verify project access (any member)
    const access = await getProjectAccess(user.id, projectId);
    if (!access) {
      return NextResponse.json({ error: "Projet introuvable ou accès refusé" }, { status: 403 });
    }

    // Compute next listNumber
    const last = await prisma.projectList.findFirst({
      where: { projectId },
      orderBy: { listNumber: "desc" },
      select: { listNumber: true },
    });
    const listNumber = (last?.listNumber ?? 0) + 1;

    const list = await prisma.projectList.create({
      data: {
        listNumber,
        title,
        description: description ?? null,
        status: status ?? "BACKLOG",
        priority: priority ?? 2,
        ...(assigneeId ? { assigneeId } : {}),
        projectId,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        items: { select: { id: true, status: true } },
      },
    });

    return NextResponse.json(list, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Échec de la création de la liste" },
      { status: 500 }
    );
  }
}
