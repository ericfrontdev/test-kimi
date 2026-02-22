import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get stories assigned to user or created by user
    const stories = await prisma.story.findMany({
      where: {
        OR: [
          { authorId: user.id },
          { assigneeId: user.id },
        ],
        status: {
          in: ["TODO", "IN_PROGRESS"],
        },
      },
      include: {
        project: {
          select: {
            name: true,
          },
        },
        tasks: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 10,
    });

    // Format stories with subtask counts
    const formattedStories = stories.map((story) => ({
      id: story.id,
      title: story.title,
      status: story.status,
      project: story.project.name,
      subtasks: story.tasks.length,
      completedSubtasks: story.tasks.filter((t) => t.status === "DONE").length,
    }));

    // Get recent activity (simplified - in real app would have Activity model)
    const recentStories = await prisma.story.findMany({
      where: {
        authorId: user.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 5,
      include: {
        project: {
          select: {
            name: true,
          },
        },
      },
    });

    const activities = recentStories.map((story) => ({
      id: story.id,
      content: `You updated "${story.title}" in ${story.project.name}`,
      time: story.updatedAt.toISOString(),
    }));

    // Get stats
    const totalProjects = await prisma.project.count({
      where: { ownerId: user.id },
    });

    const totalStories = await prisma.story.count({
      where: { authorId: user.id },
    });

    const inProgressStories = await prisma.story.count({
      where: {
        authorId: user.id,
        status: "IN_PROGRESS",
      },
    });

    return NextResponse.json({
      stories: formattedStories,
      activities,
      stats: {
        projects: totalProjects,
        stories: totalStories,
        inProgress: inProgressStories,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Échec de la récupération des données" },
      { status: 500 }
    );
  }
}
