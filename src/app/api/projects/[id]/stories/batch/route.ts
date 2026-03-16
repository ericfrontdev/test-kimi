import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getProjectAccess } from "@/lib/project-access";

// POST /api/projects/[id]/stories/batch
// Body: { storyIds: string[] }
// Returns: Record<storyId, Task[]>
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id: projectId } = await params;

  const body = await request.json();
  const storyIds: string[] = body.storyIds ?? [];

  if (!Array.isArray(storyIds) || storyIds.length === 0) {
    return NextResponse.json({});
  }

  const access = await getProjectAccess(user.id, projectId);
  if (!access) {
    return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
  }

  const tasks = await prisma.task.findMany({
    where: { storyId: { in: storyIds }, story: { projectId } },
    select: {
      id: true,
      taskNumber: true,
      title: true,
      status: true,
      storyId: true,
      assignee: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  });

  // Group by storyId
  const result: Record<string, typeof tasks> = {};
  for (const task of tasks) {
    if (!result[task.storyId]) result[task.storyId] = [];
    result[task.storyId].push(task);
  }

  return NextResponse.json(result);
}
