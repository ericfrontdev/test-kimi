import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { sendSuperAdminInvitationEmail } from "@/lib/email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const createSchema = z.object({
  email: z.string().email(),
});

// POST /api/super-admin-invitations — super admin invite un futur super admin
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { platformRole: true, name: true, email: true },
  });
  if (dbUser?.platformRole !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Réservé aux super admins" }, { status: 403 });
  }

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }
  const result = createSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }
  const { email } = result.data;

  // Si l'utilisateur existe déjà et est déjà super admin
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, platformRole: true },
  });
  if (existing?.platformRole === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Cet utilisateur est déjà super admin" }, { status: 409 });
  }

  // Si l'utilisateur existe déjà (user normal) → promotion directe
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { platformRole: "SUPER_ADMIN" },
    });
    return NextResponse.json({ status: "promoted", email });
  }

  // Invitation en attente existante ?
  const pending = await prisma.superAdminInvitation.findFirst({
    where: { email, status: "PENDING" },
  });
  if (pending) {
    const inviteLink = `${APP_URL}/invite/super-admin/${pending.token}`;
    return NextResponse.json({ status: "already_pending", email, inviteLink });
  }

  // Créer l'invitation (7 jours)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const invitation = await prisma.superAdminInvitation.create({
    data: { email, invitedById: user.id, expiresAt },
  });

  const inviteLink = `${APP_URL}/invite/super-admin/${invitation.token}`;

  const emailResult = await sendSuperAdminInvitationEmail({
    to: email,
    inviteLink,
    invitedByName: dbUser.name,
    invitedByEmail: dbUser.email!,
  });

  return NextResponse.json({
    status: "invited",
    email,
    inviteLink,
    emailSent: emailResult.success,
  });
}

// GET /api/super-admin-invitations — liste les invitations en cours (super admin seulement)
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { platformRole: true },
  });
  if (dbUser?.platformRole !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Réservé aux super admins" }, { status: 403 });
  }

  const invitations = await prisma.superAdminInvitation.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, createdAt: true, expiresAt: true },
  });

  return NextResponse.json(invitations);
}
