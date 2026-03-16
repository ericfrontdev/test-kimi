import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { ensureUserExists } from "@/lib/ensure-user-exists";

const acceptSchema = z.object({ token: z.string() });

// POST /api/super-admin-invitations/accept — accepter et devenir super admin
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }
  const result = acceptSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Token manquant" }, { status: 400 });
  }
  const { token } = result.data;

  const invitation = await prisma.superAdminInvitation.findUnique({ where: { token } });
  if (!invitation) {
    return NextResponse.json({ error: "Invitation introuvable" }, { status: 404 });
  }
  if (invitation.status !== "PENDING") {
    return NextResponse.json({ error: "Invitation déjà utilisée ou expirée" }, { status: 410 });
  }
  if (invitation.expiresAt < new Date()) {
    await prisma.superAdminInvitation.update({ where: { token }, data: { status: "EXPIRED" } });
    return NextResponse.json({ error: "Invitation expirée" }, { status: 410 });
  }
  if (invitation.email !== user.email) {
    return NextResponse.json({ error: "Cette invitation ne vous est pas destinée" }, { status: 403 });
  }

  // S'assurer que l'user existe en DB
  await ensureUserExists(user.id, user.email!, user.user_metadata?.name);

  // Promouvoir + marquer acceptée
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { platformRole: "SUPER_ADMIN" },
    }),
    prisma.superAdminInvitation.update({
      where: { token },
      data: { status: "ACCEPTED", acceptedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ success: true });
}
