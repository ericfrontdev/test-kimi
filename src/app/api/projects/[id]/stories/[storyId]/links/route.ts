import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { validateBody, createStoryLinkSchema } from "@/lib/schemas";
import { getProjectAccess } from "@/lib/project-access";

// POST /api/projects/[id]/stories/[storyId]/links - Create a link
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; storyId: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId, storyId } = await params;

  const { data, response } = await validateBody(request, createStoryLinkSchema);
  if (response) return response;

  try {
    const access = await getProjectAccess(user.id, projectId);
    if (!access) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    }

    const story = await prisma.story.findFirst({
      where: { id: storyId, projectId },
    });

    if (!story) {
      return NextResponse.json({ error: "Story non trouvée" }, { status: 404 });
    }

    const link = await prisma.storyLink.create({
      data: {
        title: data.title,
        url: data.url,
        storyId,
      },
    });

    return NextResponse.json(link, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Échec de la création du lien" },
      { status: 500 }
    );
  }
}
