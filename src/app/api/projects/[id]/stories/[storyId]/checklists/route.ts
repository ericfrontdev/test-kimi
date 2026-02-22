import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const createChecklistSchema = z.object({
  title: z.string().min(1).max(200).trim().optional().default("Checklist"),
});

// POST /api/projects/[id]/stories/[storyId]/checklists — create a checklist
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; storyId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, storyId } = await params;

  let body: unknown;
  try { body = await request.json(); } catch { body = {}; }
  const parsed = createChecklistSchema.safeParse(body);
  const title = parsed.success ? parsed.data.title : "Checklist";

  try {
    const project = await prisma.project.findFirst({
      where: { id: projectId, OR: [{ ownerId: user.id }, { members: { some: { userId: user.id } } }] },
    });
    if (!project) return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });

    const story = await prisma.story.findFirst({ where: { id: storyId, projectId } });
    if (!story) return NextResponse.json({ error: "Story non trouvée" }, { status: 404 });

    const count = await prisma.checklist.count({ where: { storyId } });
    const checklist = await prisma.checklist.create({
      data: { title, storyId, position: count },
      include: { items: { orderBy: { position: "asc" } } },
    });

    return NextResponse.json(checklist, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Échec de la création de la checklist" }, { status: 500 });
  }
}
