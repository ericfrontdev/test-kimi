import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { validateBody, createStorySchema } from "@/lib/schemas";
import { StoryStatus } from "@prisma/client";

const TAKE_DEFAULT = 50;
const TAKE_MAX = 100;

// GET /api/projects/[id]/stories - List stories with pagination
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
    // Verify project exists and user has access
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

    const statusFilter = statusParam
      ? { status: statusParam as StoryStatus }
      : { status: { not: "ARCHIVED" as StoryStatus } };

    const [rawStories, total] = await Promise.all([
      prisma.story.findMany({
        where: { projectId, ...statusFilter },
        include: {
          tasks: { select: { id: true, status: true } },
          assignee: { select: { name: true, email: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.story.count({ where: { projectId, ...statusFilter } }),
    ]);

    const stories = rawStories.map((story) => ({
      id: story.id,
      storyNumber: story.storyNumber,
      title: story.title,
      status: story.status,
      type: story.type,
      priority: story.priority,
      subtasks: story.tasks.length,
      completedSubtasks: story.tasks.filter((t) => t.status === "DONE").length,
      assigneeId: story.assigneeId,
      assignee: story.assignee,
      dueDate: story.dueDate?.toISOString() ?? null,
    }));

    return NextResponse.json({ stories, total, hasMore: skip + take < total });
  } catch {
    return NextResponse.json(
      { error: "Échec de la récupération des stories" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/stories - Create new story
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId } = await params;

  const { data, response } = await validateBody(request, createStorySchema);
  if (response) return response;

  try {
    const { title, description, status = "BACKLOG", type, priority, assigneeId, dueDate, labelIds } = data;

    // Verify project exists and user has access (owner or member)
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
      return NextResponse.json(
        { error: "Projet non trouvé" },
        { status: 404 }
      );
    }

    // Validate assignee belongs to the project
    if (assigneeId) {
      const isProjectMember =
        project.ownerId === assigneeId ||
        (await prisma.projectMember.count({
          where: { projectId, userId: assigneeId },
        })) > 0;

      if (!isProjectMember) {
        return NextResponse.json(
          { error: "L'assigné n'est pas membre du projet" },
          { status: 400 }
        );
      }
    }

    // Ensure user exists in database
    const existingUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!existingUser) {
      await prisma.user.create({
        data: {
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.name || user.email!.split("@")[0],
        },
      });
    }

    const story = await prisma.story.create({
      data: {
        title,
        description: description ?? null,
        status,
        ...(type !== undefined && { type }),
        ...(priority !== undefined && { priority }),
        ...(assigneeId ? { assigneeId } : {}),
        ...(dueDate !== undefined && { dueDate: dueDate ?? null }),
        ...(labelIds.length > 0 && { labels: { connect: labelIds.map((id) => ({ id })) } }),
        projectId,
        authorId: user.id,
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(story, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Échec de la création de la story" },
      { status: 500 }
    );
  }
}
