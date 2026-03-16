import { notFound } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProjectPageClient } from "@/components/project/ProjectPageClient";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { ensureUserExists } from "@/lib/ensure-user-exists";
import { getProjectAccess } from "@/lib/project-access";
import type { ProjectList } from "@/stores/project-list";

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

  const access = await getProjectAccess(user.id, id);
  if (!access) notFound();
  const { project, effectiveRole: userRole } = access;

  if (project.type === "LIST") {
    // Load lists for list-based project
    const [rawLists, totalNonArchived] = await Promise.all([
      prisma.projectList.findMany({
        where: { projectId: id, status: { not: "ARCHIVED" } },
        include: {
          assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
          items: { select: { id: true, status: true }, orderBy: { position: "asc" } },
        },
        orderBy: { createdAt: "desc" },
        take: INITIAL_TAKE,
      }),
      prisma.projectList.count({ where: { projectId: id, status: { not: "ARCHIVED" } } }),
    ]);

    const lists = rawLists.map((l) => ({
      ...l,
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
      items: l.items.map((i) => ({ id: i.id, status: i.status as "TODO" | "DONE" })),
    })) as ProjectList[];

    return (
      <MainLayout>
        <ProjectPageClient
          project={{ id: project.id, name: project.name, description: project.description }}
          projectType="LIST"
          stories={[]}
          hasMoreStories={false}
          lists={lists}
          hasMoreLists={totalNonArchived > INITIAL_TAKE}
          userRole={userRole}
        />
      </MainLayout>
    );
  }

  // STORY project — original flow
  const [rawStories, totalNonArchived] = await Promise.all([
    prisma.story.findMany({
      where: { projectId: id, status: { not: "ARCHIVED" } },
      include: {
        tasks: { select: { id: true, status: true } },
        assignee: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: INITIAL_TAKE,
    }),
    prisma.story.count({ where: { projectId: id, status: { not: "ARCHIVED" } } }),
  ]);

  const formattedStories = rawStories.map((story) => ({
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

  return (
    <MainLayout>
      <ProjectPageClient
        project={{ id: project.id, name: project.name, description: project.description }}
        projectType="STORY"
        stories={formattedStories}
        hasMoreStories={totalNonArchived > INITIAL_TAKE}
        lists={[]}
        hasMoreLists={false}
        userRole={userRole}
      />
    </MainLayout>
  );
}
