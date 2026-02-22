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

    // Get checklist items (TODO/IN_PROGRESS) from stories authored or assigned to user
    const checklistItems = await prisma.checklistItem.findMany({
      where: {
        checklist: {
          story: {
            OR: [
              { authorId: user.id },
              { assigneeId: user.id },
            ],
          },
        },
      },
      include: {
        checklist: {
          select: {
            title: true,
            story: {
              select: {
                id: true,
                title: true,
                project: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 20,
    });

    const formattedChecklistItems = checklistItems.map((item) => ({
      id: item.id,
      title: item.title,
      status: item.status,
      checklistId: item.checklistId,
      checklist: item.checklist.title,
      story: item.checklist.story.title,
      storyId: item.checklist.story.id,
      projectId: item.checklist.story.project.id,
      project: item.checklist.story.project.name,
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
      content: `Vous avez modifié « ${story.title} » dans ${story.project.name}`,
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
      checklistItems: formattedChecklistItems,
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
