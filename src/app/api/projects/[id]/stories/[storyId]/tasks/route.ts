import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { validateBody, createTaskSchema } from "@/lib/schemas";

// POST /api/projects/[id]/stories/[storyId]/tasks - Create new task
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; storyId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId, storyId } = await params;

  const { data, response } = await validateBody(request, createTaskSchema);
  if (response) return response;

  try {
    const { title } = data;

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

    // Verify story exists and belongs to project
    const story = await prisma.story.findFirst({
      where: { id: storyId, projectId },
    });

    if (!story) {
      return NextResponse.json(
        { error: "Story non trouvée" },
        { status: 404 }
      );
    }

    // Get next task number for this story
    const lastTask = await prisma.task.findFirst({
      where: { storyId },
      orderBy: { taskNumber: "desc" },
    });
    const nextTaskNumber = (lastTask?.taskNumber || 0) + 1;

    // Create the task and return full shape expected by the frontend
    const newTask = await prisma.task.create({
      data: {
        taskNumber: nextTaskNumber,
        title,
        status: "TODO",
        storyId,
      },
      select: {
        id: true,
        taskNumber: true,
        title: true,
        status: true,
        assignee: {
          select: { name: true, email: true, avatarUrl: true },
        },
        comments: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            author: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
      },
    });

    return NextResponse.json(newTask, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Échec de la création de la tâche" },
      { status: 500 }
    );
  }
}
