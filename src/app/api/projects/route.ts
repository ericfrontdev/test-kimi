import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// Ensure user exists in database
async function ensureUserExists(
  userId: string,
  email: string,
  name?: string
) {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    console.log("Creating user in database:", userId);
    return await prisma.user.create({
      data: {
        id: userId,
        email,
        name: name || email.split("@")[0],
      },
    });
  }

  return existingUser;
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

  // Ensure user exists in DB
  await ensureUserExists(user.id, user.email!, user.user_metadata?.name);

  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { ownerId: user.id },
        {
          members: {
            some: {
              userId: user.id,
            },
          },
        },
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

  try {
    const body = await request.json();
    const { name, description, color } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    // Ensure user exists in database before creating project
    await ensureUserExists(user.id, user.email!, user.user_metadata?.name);

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        color: color || null,
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
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
