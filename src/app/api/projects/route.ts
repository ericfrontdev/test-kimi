import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { validateBody, createProjectSchema } from "@/lib/schemas";

// Ensure user exists in database, migrating legacy UUID if needed
async function ensureUserExists(userId: string, email: string, name?: string) {
  // Fast path: correct Supabase UUID already exists
  const existingById = await prisma.user.findUnique({ where: { id: userId } });
  if (existingById) return existingById;

  // Slow path: email exists with a different UUID (legacy data from old version)
  const existingByEmail = await prisma.user.findUnique({ where: { email } });
  if (existingByEmail) {
    const oldId = existingByEmail.id;
    // Migrate all FK references from the old UUID to the Supabase UUID
    await prisma.$transaction([
      prisma.projectMember.updateMany({ where: { userId: oldId }, data: { userId } }),
      prisma.project.updateMany({ where: { ownerId: oldId }, data: { ownerId: userId } }),
      prisma.story.updateMany({ where: { authorId: oldId }, data: { authorId: userId } }),
      prisma.story.updateMany({ where: { assigneeId: oldId }, data: { assigneeId: userId } }),
      prisma.task.updateMany({ where: { assigneeId: oldId }, data: { assigneeId: userId } }),
      prisma.comment.updateMany({ where: { authorId: oldId }, data: { authorId: userId } }),
      prisma.taskComment.updateMany({ where: { authorId: oldId }, data: { authorId: userId } }),
      prisma.notification.updateMany({ where: { userId: oldId }, data: { userId } }),
      prisma.invitation.updateMany({ where: { invitedById: oldId }, data: { invitedById: userId } }),
    ]);
    await prisma.user.delete({ where: { id: oldId } });
    return await prisma.user.create({
      data: { id: userId, email, name: name || existingByEmail.name || email.split("@")[0] },
    });
  }

  // User doesn't exist at all: create with Supabase UUID
  return await prisma.user.create({
    data: { id: userId, email, name: name || email.split("@")[0] },
  });
}

// GET /api/projects - List user's projects
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureUserExists(user.id, user.email!, user.user_metadata?.name);

    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: user.id },
          { members: { some: { userId: user.id } } },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: { stories: true },
        },
      },
    });

    return NextResponse.json(projects);
  } catch {
    return NextResponse.json(
      { error: "Échec de la récupération des projets" },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, response } = await validateBody(request, createProjectSchema);
  if (response) return response;

  try {
    const { name, description, color } = data;

    // Ensure user exists in database before creating project
    await ensureUserExists(user.id, user.email!, user.user_metadata?.name);

    const project = await prisma.project.create({
      data: {
        name,
        description: description ?? null,
        color: color ?? null,
        ownerId: user.id,
        members: {
          create: {
            userId: user.id,
            role: "ADMIN",
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Échec de la création du projet" },
      { status: 500 }
    );
  }
}
