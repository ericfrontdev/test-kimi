import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { ensureUserExists } from "@/lib/ensure-user-exists";

// POST /api/invitations/accept - Accept invitation after registration
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    // Find the invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        projects: {
          include: {
            project: true,
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

    // Check if invitation email matches user email
    if (invitation.email.toLowerCase() !== user.email?.toLowerCase()) {
      return NextResponse.json(
        { error: "Invitation email does not match" },
        { status: 403 }
      );
    }

    // Ensure user exists in public.users with the correct Supabase UUID
    await ensureUserExists(user.id, user.email!, user.user_metadata?.name);

    // Add user to all projects
    const addedProjects = [];
    for (const projectLink of invitation.projects) {
      const existingMember = await prisma.projectMember.findFirst({
        where: {
          projectId: projectLink.projectId,
          userId: user.id,
        },
      });

      if (!existingMember) {
        await prisma.projectMember.create({
          data: {
            projectId: projectLink.projectId,
            userId: user.id,
            role: "MEMBER",
          },
        });
        addedProjects.push(projectLink.project.name);
      }
    }

    // Mark invitation as accepted
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Added to ${addedProjects.length} project(s)`,
      projects: addedProjects,
    });

  } catch {
    return NextResponse.json(
      { error: "Échec de l'acceptation de l'invitation" },
      { status: 500 }
    );
  }
}
