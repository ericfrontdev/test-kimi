import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// GET /api/projects/[id]/stories/[storyId]/tasks/[taskId]/comments
export async function GET(
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
    // Check if user has access to project
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
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if task exists and belongs to story
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        storyId: storyId,
        story: { projectId },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const comments = await prisma.taskComment.findMany({
      where: { taskId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error fetching task comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/stories/[storyId]/tasks/[taskId]/comments
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; storyId: string; taskId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId, storyId, taskId } = await params;
  const body = await request.json();
  const { content, mentions = [] } = body;

  if (!content?.trim()) {
    return NextResponse.json(
      { error: "Content is required" },
      { status: 400 }
    );
  }

  try {
    // Check if user has access to project
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
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if task exists and belongs to story
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        storyId: storyId,
        story: { projectId },
      },
      include: {
        story: {
          select: {
            storyNumber: true,
            type: true,
            title: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const comment = await prisma.taskComment.create({
      data: {
        content: content.trim(),
        taskId,
        authorId: user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create notifications for mentioned users
    if (mentions.length > 0) {
      const authorName = comment.author.name || comment.author.email;
      const subtaskId = `${task.story.type}-${task.story.storyNumber}-${task.taskNumber}`;
      
      await prisma.notification.createMany({
        data: mentions
          .filter((mentionedUserId: string) => mentionedUserId !== user.id) // Don't notify self
          .map((mentionedUserId: string) => ({
            type: "COMMENT_MENTION" as const,
            title: "Mention dans un commentaire",
            message: `${authorName} vous a mentionné dans un commentaire sur la sous-tâche ${subtaskId}`,
            userId: mentionedUserId,
            data: JSON.stringify({
              projectId,
              storyId,
              taskId,
              commentId: comment.id,
            }),
          })),
      });
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Error creating task comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
