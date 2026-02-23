import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const updateMeSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

// GET /api/users/me
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [dbUser, memberships] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true, name: true, email: true, avatarUrl: true, createdAt: true },
      }),
      prisma.projectMember.findMany({
        where: { userId: user.id },
        include: { project: { select: { id: true, name: true, color: true } } },
      }),
      // Owned projects fetched separately
    ]);

    const ownedProjects = await prisma.project.findMany({
      where: { ownerId: user.id },
      select: { id: true, name: true, color: true },
    });

    const memberProjects = memberships.map((m) => ({
      id: m.project.id,
      name: m.project.name,
      color: m.project.color,
      role: "MEMBER" as const,
    }));

    const allProjects = [
      ...ownedProjects.map((p) => ({ ...p, role: "OWNER" as const })),
      ...memberProjects.filter((mp) => !ownedProjects.find((op) => op.id === mp.id)),
    ];

    return NextResponse.json({
      id: dbUser?.id ?? user.id,
      name: dbUser?.name ?? user.user_metadata?.name ?? null,
      email: dbUser?.email ?? user.email,
      avatarUrl: dbUser?.avatarUrl ?? null,
      createdAt: dbUser?.createdAt?.toISOString() ?? null,
      projects: allProjects,
    });
  } catch {
    return NextResponse.json({ error: "Échec de la récupération du profil" }, { status: 500 });
  }
}

// PATCH /api/users/me
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const result = updateMeSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues.map((i) => i.message).join(", ") }, { status: 400 });
  }

  const { name, avatarUrl } = result.data;

  try {
    const updates: { name?: string; avatarUrl?: string | null } = {};
    if (name !== undefined) updates.name = name;
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;

    const [dbUser] = await Promise.all([
      prisma.user.update({
        where: { id: user.id },
        data: updates,
        select: { id: true, name: true, email: true, avatarUrl: true },
      }),
      // Sync name to Supabase auth metadata
      name !== undefined
        ? supabase.auth.updateUser({ data: { name } })
        : Promise.resolve(),
    ]);

    return NextResponse.json(dbUser);
  } catch {
    return NextResponse.json({ error: "Échec de la mise à jour du profil" }, { status: 500 });
  }
}
