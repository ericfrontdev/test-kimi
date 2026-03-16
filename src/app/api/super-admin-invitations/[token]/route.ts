import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/super-admin-invitations/[token] — valider le token (page d'invitation)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const invitation = await prisma.superAdminInvitation.findUnique({
    where: { token },
    include: { invitedBy: { select: { name: true, email: true } } },
  });

  if (!invitation) {
    return NextResponse.json({ error: "Invitation introuvable" }, { status: 404 });
  }

  // Marquer comme expirée si besoin
  if (invitation.status === "PENDING" && invitation.expiresAt < new Date()) {
    await prisma.superAdminInvitation.update({
      where: { token },
      data: { status: "EXPIRED" },
    });
    return NextResponse.json({ error: "Invitation expirée" }, { status: 410 });
  }

  if (invitation.status !== "PENDING") {
    return NextResponse.json(
      { error: invitation.status === "ACCEPTED" ? "Invitation déjà acceptée" : "Invitation expirée" },
      { status: 410 }
    );
  }

  return NextResponse.json({
    email: invitation.email,
    invitedBy: invitation.invitedBy,
  });
}
