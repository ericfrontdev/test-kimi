import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { validateBody, updateProjectSchema } from "@/lib/schemas";

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

// PATCH /api/projects/[id] - Update project
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Ensure user exists in database
  await ensureUserExists(user.id, user.email!, user.user_metadata?.name);

  const { id } = await params;

  const { data, response } = await validateBody(request, updateProjectSchema);
  if (response) return response;

  try {
    const { name, description } = data;

    const existingProject = await prisma.project.findFirst({
      where: { id, ownerId: user.id },
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description: description ?? null }),
      },
    });

    return NextResponse.json(project);
  } catch {
    return NextResponse.json(
      { error: "Échec de la mise à jour du projet" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Ensure user exists in database
  await ensureUserExists(user.id, user.email!, user.user_metadata?.name);

  const { id } = await params;

  try {
    const existingProject = await prisma.project.findFirst({
      where: { id, ownerId: user.id },
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Échec de la suppression du projet" },
      { status: 500 }
    );
  }
}
