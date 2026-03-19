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
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const userStoryFilter = { OR: [{ authorId: user.id }, { assigneeId: user.id }] };

    const [
      stories,
      checklistItems,
      upcomingStories,
      userComments,
      mentionNotifications,
      totalProjects,
      totalStories,
      inProgressStories,
    ] = await Promise.all([
      prisma.story.findMany({
        where: { ...userStoryFilter, status: { notIn: ["BACKLOG", "ARCHIVED"] } },
        include: {
          project: { select: { id: true, name: true } },
          tasks: { select: { id: true, status: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 20,
      }),
      prisma.checklistItem.findMany({
        where: { checklist: { story: userStoryFilter } },
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
      }),
      prisma.story.findMany({
        where: { ...userStoryFilter, dueDate: { not: null, lte: in30Days }, status: { notIn: ["DONE", "ARCHIVED"] } },
        include: { project: { select: { name: true } } },
        orderBy: { dueDate: "asc" },
      }),
      prisma.comment.findMany({
        where: { authorId: user.id },
        include: {
          story: {
            select: {
              id: true,
              title: true,
              project: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.notification.findMany({
        where: { userId: user.id, type: { in: ["STORY_MENTION", "COMMENT_MENTION"] } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.project.count({ where: { ownerId: user.id } }),
      prisma.story.count({ where: { authorId: user.id } }),
      prisma.story.count({ where: { authorId: user.id, status: "IN_PROGRESS" } }),
    ]);

    const formattedStories = stories.map((story) => ({
      id: story.id,
      storyNumber: story.storyNumber,
      type: story.type,
      title: story.title,
      status: story.status,
      priority: story.priority,
      project: story.project.name,
      projectId: story.project.id,
      subtasks: story.tasks.length,
      completedSubtasks: story.tasks.filter((t) => t.status === "DONE").length,
    }));

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

    const formattedUpcomingStories = upcomingStories.map((story) => ({
      id: story.id,
      title: story.title,
      status: story.status,
      project: story.project.name,
      dueDate: story.dueDate!.toISOString(),
    }));

    const comments = userComments.map((c) => ({
      id: c.id,
      content: c.content,
      storyId: c.story.id,
      story: c.story.title,
      projectId: c.story.project.id,
      project: c.story.project.name,
      time: c.createdAt.toISOString(),
    }));

    const mentions = mentionNotifications.map((n) => {
      const raw = n.data;
      const data = (typeof raw === "string" ? JSON.parse(raw) : raw) as Record<string, string> | null;
      return {
        id: n.id,
        title: n.title,
        message: n.message,
        time: n.createdAt.toISOString(),
        read: n.read,
        projectId: data?.projectId ?? null,
        storyId: data?.storyId ?? null,
      };
    });

    return NextResponse.json({
      stories: formattedStories,
      checklistItems: formattedChecklistItems,
      upcomingStories: formattedUpcomingStories,
      comments,
      mentions,
      stats: { projects: totalProjects, stories: totalStories, inProgress: inProgressStories },
    });
  } catch {
    return NextResponse.json(
      { error: "Échec de la récupération des données" },
      { status: 500 }
    );
  }
}
