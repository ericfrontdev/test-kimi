import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/invitations/[token] - Get invitation details
export async function GET(
  _: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        projects: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
        invitedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    if (invitation.status !== "PENDING") {
      return NextResponse.json(
        { error: `Invitation already ${invitation.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });
      
      return NextResponse.json(
        { error: "Invitation expired" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      email: invitation.email,
      projects: invitation.projects.map((p) => p.project),
      invitedBy: invitation.invitedBy,
    });

  } catch {
    return NextResponse.json(
      { error: "Échec de la récupération de l'invitation" },
      { status: 500 }
    );
  }
}
