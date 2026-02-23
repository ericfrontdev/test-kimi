import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { validateBody, createCommentSchema } from "@/lib/schemas";

// GET /api/projects/[id]/stories/[storyId]/comments - Get story comments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; storyId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId, storyId } = await params;

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

    // Verify story exists
    const story = await prisma.story.findFirst({
      where: { id: storyId, projectId },
    });

    if (!story) {
      return NextResponse.json({ error: "Story non trouvée" }, { status: 404 });
    }

    // Get comments with author
    const comments = await prisma.comment.findMany({
      where: { storyId },
      include: {
        author: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(comments);
  } catch {
    return NextResponse.json(
      { error: "Échec de la récupération des commentaires" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/stories/[storyId]/comments - Create comment
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

  const { data, response } = await validateBody(request, createCommentSchema);
  if (response) return response;

  try {
    const { content, mentions } = data;

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

    // Verify story exists
    const story = await prisma.story.findFirst({
      where: { id: storyId, projectId },
      select: { id: true, storyNumber: true, type: true, title: true },
    });

    if (!story) {
      return NextResponse.json({ error: "Story non trouvée" }, { status: 404 });
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content,
        storyId,
        authorId: user.id,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    // Create notifications for mentioned users
    if (mentions.length > 0) {
      const authorName = comment.author.name || comment.author.email;
      const storyRef = `${story.type}-${story.storyNumber}`;

      await prisma.notification.createMany({
        data: mentions
          .filter((mentionedUserId: string) => mentionedUserId !== user.id)
          .map((mentionedUserId: string) => ({
            type: "COMMENT_MENTION" as const,
            title: "Mention dans un commentaire",
            message: `${authorName} vous a mentionné dans un commentaire sur la story ${storyRef} — ${story.title}`,
            userId: mentionedUserId,
            data: { projectId, storyId, commentId: comment.id },
          })),
      });
    }

    return NextResponse.json(comment, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Échec de la création du commentaire" },
      { status: 500 }
    );
  }
}
