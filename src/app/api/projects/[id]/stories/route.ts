import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// GET /api/projects/[id]/stories - Get stories for a project
export async function GET(
  request: Request,
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

  try {
    // Verify project exists and belongs to user
    const project = await prisma.project.findFirst({
      where: { id: projectId, ownerId: user.id },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const stories = await prisma.story.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      include: {
        tasks: {
          select: { id: true, status: true },
        },
        author: {
          select: { name: true },
        },
      },
    });

    const formattedStories = stories.map((story) => ({
      id: story.id,
      title: story.title,
      description: story.description,
      status: story.status,
      subtasks: story.tasks.length,
      completedSubtasks: story.tasks.filter((t) => t.status === "DONE").length,
      author: story.author.name || "Unknown",
    }));

    return NextResponse.json(formattedStories);
  } catch (error) {
    console.error("Error fetching stories:", error);
    return NextResponse.json(
      { error: "Failed to fetch stories" },
      { status: 500 }
    );
  }
}
