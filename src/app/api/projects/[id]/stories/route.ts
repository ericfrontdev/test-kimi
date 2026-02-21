import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { validateBody, createStorySchema } from "@/lib/schemas";

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
    const { title, description, status = "BACKLOG", type, priority } = data;

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
        projectId,
        authorId: user.id,
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
