import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { validateBody, updateTaskSchema } from "@/lib/schemas";
import type { Prisma } from "@prisma/client";
import { TaskStatus as PrismaTaskStatus } from "@prisma/client";

// PATCH /api/projects/[id]/stories/[storyId]/tasks/[taskId] - Update task
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; storyId: string; taskId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId, storyId, taskId } = await params;

  const { data, response } = await validateBody(request, updateTaskSchema);
  if (response) return response;

  try {
    const { status, title, assigneeId } = data;

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

    // Verify task exists and belongs to story
    const existingTask = await prisma.task.findFirst({
      where: { id: taskId, storyId },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: "Tâche non trouvée" },
        { status: 404 }
      );
    }

    // Build update object explicitly using Prisma's unchecked type to allow assigneeId
    const taskUpdateData: Prisma.TaskUncheckedUpdateInput = {};
    if (status !== undefined) taskUpdateData.status = status as PrismaTaskStatus;
    if (title !== undefined) taskUpdateData.title = title;
    if (assigneeId !== undefined) taskUpdateData.assigneeId = assigneeId;

    // Update the task and return full shape expected by the frontend
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: taskUpdateData,
      select: {
        id: true,
        taskNumber: true,
        title: true,
        status: true,
        assignee: {
          select: { name: true, email: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json(updatedTask);
  } catch {
    return NextResponse.json(
      { error: "Échec de la mise à jour de la tâche" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/stories/[storyId]/tasks/[taskId] - Delete task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; storyId: string; taskId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId, storyId, taskId } = await params;

  try {
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

    // Verify task exists and belongs to story
    const existingTask = await prisma.task.findFirst({
      where: { id: taskId, storyId },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: "Tâche non trouvée" },
        { status: 404 }
      );
    }

    // Delete the task
    await prisma.task.delete({
      where: { id: taskId },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Échec de la suppression de la tâche" },
      { status: 500 }
    );
  }
}
