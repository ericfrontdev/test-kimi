import { notFound } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProjectPageClient } from "@/components/project/ProjectPageClient";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { ensureUserExists } from "@/lib/ensure-user-exists";

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Migrate legacy UUID if needed so the auth check below finds the member record
  try {
    await ensureUserExists(user.id, user.email!, user.user_metadata?.name);
  } catch {
    // Non-blocking — if migration fails, the auth check below will return notFound()
  }

  const INITIAL_TAKE = 100;

  const [project, totalNonArchived] = await Promise.all([
    prisma.project.findFirst({
      where: {
        id,
        OR: [
          { ownerId: user.id },
          { members: { some: { userId: user.id } } },
        ],
      },
      include: {
        stories: {
          where: { status: { not: "ARCHIVED" } },
          include: {
            tasks: {
              select: { id: true, status: true },
            },
            assignee: {
              select: { name: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: INITIAL_TAKE,
        },
      },
    }),
    prisma.story.count({
      where: { projectId: id, status: { not: "ARCHIVED" } },
    }),
  ]);

  if (!project) {
    notFound();
  }

  const membership = await prisma.projectMember.findFirst({
    where: { projectId: id, userId: user.id },
    select: { role: true },
  });
  const userRole: "OWNER" | "ADMIN" | "MEMBER" =
    project.ownerId === user.id
      ? "OWNER"
      : membership?.role === "ADMIN"
      ? "ADMIN"
      : "MEMBER";

  const formattedStories = project.stories.map((story) => ({
    id: story.id,
    storyNumber: story.storyNumber,
    title: story.title,
    status: story.status,
    type: story.type,
    priority: story.priority,
    subtasks: story.tasks.length,
    completedSubtasks: story.tasks.filter((t) => t.status === "DONE").length,
    assigneeId: story.assigneeId,
    assignee: story.assignee,
  }));

  const hasMoreStories = totalNonArchived > INITIAL_TAKE;

  return (
    <MainLayout>
      <ProjectPageClient
        project={{ id: project.id, name: project.name, description: project.description }}
        stories={formattedStories}
        hasMoreStories={hasMoreStories}
        userRole={userRole}
      />
    </MainLayout>
  );
}
