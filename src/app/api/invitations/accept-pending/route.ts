import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { ensureUserExists } from "@/lib/ensure-user-exists";

// POST /api/invitations/accept-pending
// Automatically accepts all pending invitations for the authenticated user's email.
// Called at login — no token required.
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const pendingInvitations = await prisma.invitation.findMany({
      where: {
        email: user.email!.toLowerCase(),
        status: "PENDING",
      },
      include: {
        projects: {
          include: { project: true },
        },
      },
    });

    if (pendingInvitations.length === 0) {
      return NextResponse.json({ success: true, accepted: 0 });
    }

    await ensureUserExists(user.id, user.email!, user.user_metadata?.name);

    let totalAdded = 0;

    for (const invitation of pendingInvitations) {
      for (const projectLink of invitation.projects) {
        const existingMember = await prisma.projectMember.findFirst({
          where: { projectId: projectLink.projectId, userId: user.id },
        });

        if (!existingMember) {
          await prisma.projectMember.create({
            data: { projectId: projectLink.projectId, userId: user.id, role: "MEMBER" },
          });
          totalAdded++;
        }
      }

      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED", acceptedAt: new Date() },
      });
    }

    return NextResponse.json({ success: true, accepted: totalAdded });
  } catch {
    return NextResponse.json(
      { error: "Échec de l'acceptation des invitations" },
      { status: 500 }
    );
  }
}
