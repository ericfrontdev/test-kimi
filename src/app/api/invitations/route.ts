import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { sendInvitationEmail } from "@/lib/email";
import { notifyProjectAdded } from "@/lib/notifications";
import { randomUUID } from "crypto";
import { validateBody, createInvitationsSchema } from "@/lib/schemas";

// POST /api/invitations - Create invitations
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, response } = await validateBody(request, createInvitationsSchema);
  if (response) return response;

  try {
    const { emails, projectIds } = data;

    // Get current user info for email
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true, email: true },
    });

    // Get projects info for email
    const projects = await prisma.project.findMany({
      where: { id: { in: projectIds } },
      select: { id: true, name: true, color: true },
    });

    // Verify user is admin of all projects
    for (const projectId of projectIds) {
      const membership = await prisma.projectMember.findFirst({
        where: {
          projectId,
          userId: user.id,
          role: "ADMIN",
        },
      });

      if (!membership) {
        const project = await prisma.project.findFirst({
          where: { id: projectId, ownerId: user.id },
        });
        
        if (!project) {
          return NextResponse.json(
            { error: `Not authorized for project ${projectId}` },
            { status: 403 }
          );
        }
      }
    }

    const results = [];
    const errors = [];

    for (const email of emails) {
      try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (existingUser) {
          // Add directly to projects
          const addedProjects = [];
          for (const projectId of projectIds) {
            const existingMember = await prisma.projectMember.findFirst({
              where: { projectId, userId: existingUser.id },
            });
            
            if (!existingMember) {
              await prisma.projectMember.create({
                data: {
                  projectId,
                  userId: existingUser.id,
                  role: "MEMBER",
                },
              });
              const project = projects.find(p => p.id === projectId);
              if (project) addedProjects.push(project.name);
            }
          }
          
          // Create notification for existing user
          if (addedProjects.length > 0) {
            await notifyProjectAdded(
              existingUser.id,
              addedProjects.join(", "),
              currentUser?.name || null
            );
          }
          
          // Send email only if configured (optional)
          let emailResult: { success: boolean; id?: string; error?: string } = { success: false, error: "Skipped" };
          if (process.env.SEND_EMAIL_TO_EXISTING_USERS === "true") {
            const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/login`;
            emailResult = await sendInvitationEmail({
              to: email,
              inviteLink,
              invitedByName: currentUser?.name || null,
              invitedByEmail: currentUser?.email || user.email || "",
              projects,
            });
          }
          
          results.push({ 
            email, 
            status: "added_directly", 
            userId: existingUser.id,
            notificationSent: addedProjects.length > 0,
            emailSent: emailResult.success,
          });
          continue;
        }

        // Check for existing pending invitation
        const existingInvitation = await prisma.invitation.findFirst({
          where: {
            email: email.toLowerCase(),
            status: "PENDING",
          },
        });

        let invitation;
        
        if (existingInvitation) {
          // Add projects to existing invitation
          for (const projectId of projectIds) {
            const existingProject = await prisma.invitationProject.findFirst({
              where: { invitationId: existingInvitation.id, projectId },
            });
            
            if (!existingProject) {
              await prisma.invitationProject.create({
                data: {
                  invitationId: existingInvitation.id,
                  projectId,
                },
              });
            }
          }
          
          invitation = existingInvitation;
        } else {
          // Create new invitation
          invitation = await prisma.invitation.create({
            data: {
              email: email.toLowerCase(),
              token: randomUUID(),
              invitedById: user.id,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
              projects: {
                create: projectIds.map((projectId: string) => ({
                  projectId,
                })),
              },
            },
          });
        }

        // Generate invitation link
        const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/invite/${invitation.token}`;

        // Send invitation email
        const emailResult = await sendInvitationEmail({
          to: email,
          inviteLink,
          invitedByName: currentUser?.name || null,
          invitedByEmail: currentUser?.email || user.email || "",
          projects,
        });

        results.push({
          email,
          status: "invited",
          invitationId: invitation.id,
          token: invitation.token,
          inviteLink,
          emailSent: emailResult.success,
          emailError: emailResult.error,
        });

      } catch (err: unknown) {
        errors.push({ email, error: err instanceof Error ? err.message : "Erreur inconnue" });
      }
    }

    return NextResponse.json({
      success: results.length > 0,
      results,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch {
    return NextResponse.json(
      { error: "Échec de la création des invitations" },
      { status: 500 }
    );
  }
}
