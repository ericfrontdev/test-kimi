import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ projects: [], stories: [], lists: [] });
  }

  // Collect project IDs the user has access to
  const accessibleProjects = await prisma.project.findMany({
    where: {
      OR: [
        { ownerId: user.id },
        { members: { some: { userId: user.id } } },
      ],
    },
    select: { id: true, name: true, type: true },
  });

  const projectIds = accessibleProjects.map((p) => p.id);
  const projectNameMap = Object.fromEntries(accessibleProjects.map((p) => [p.id, p.name]));

  const [projects, stories, lists] = await Promise.all([
    // Projects
    prisma.project.findMany({
      where: {
        id: { in: projectIds },
        name: { contains: q, mode: "insensitive" },
      },
      select: { id: true, name: true, type: true },
      take: 5,
    }),

    // Stories
    prisma.story.findMany({
      where: {
        projectId: { in: projectIds },
        status: { not: "ARCHIVED" },
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, title: true, status: true, projectId: true },
      take: 5,
      orderBy: { updatedAt: "desc" },
    }),

    // Lists
    prisma.projectList.findMany({
      where: {
        projectId: { in: projectIds },
        status: { not: "ARCHIVED" },
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, title: true, status: true, projectId: true },
      take: 5,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    projects: projects.map((p) => ({ id: p.id, name: p.name, type: p.type })),
    stories: stories.map((s) => ({
      id: s.id,
      title: s.title,
      status: s.status,
      projectId: s.projectId,
      projectName: projectNameMap[s.projectId] ?? "",
    })),
    lists: lists.map((l) => ({
      id: l.id,
      title: l.title,
      status: l.status,
      projectId: l.projectId,
      projectName: projectNameMap[l.projectId] ?? "",
    })),
  });
}
