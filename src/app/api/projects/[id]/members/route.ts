import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// GET /api/projects/[id]/members - Get project members
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId } = await params;

  try {
    // Verify user has access to project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: user.id },
          { members: { some: { userId: user.id } } },
        ],
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    }

    // Get all members including owner
    const members = await prisma.projectMember.findMany({
      where: { projectId },
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
    });

    // Get owner if not already in members
    const owner = await prisma.user.findUnique({
      where: { id: project.ownerId },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
    });

    const users = members.map((m) => m.user);
    if (owner && !users.find((u) => u.id === owner.id)) {
      users.unshift(owner);
    }

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/members - Add member(s) to project
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId } = await params;

  try {
    console.log("Adding members to project:", projectId, "by user:", user.id);
    
    // First, ensure the current user is a member (for backward compatibility)
    const currentUserMember = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId: user.id,
      },
    });
    
    // If not a member but is owner, add them as admin
    if (!currentUserMember) {
      const project = await prisma.project.findFirst({
        where: { id: projectId, ownerId: user.id },
      });
      
      if (project) {
        await prisma.projectMember.create({
          data: {
            projectId,
            userId: user.id,
            role: "ADMIN",
          },
        });
        console.log("Added owner as admin member");
      } else {
        return NextResponse.json({ error: "Forbidden - not a project member" }, { status: 403 });
      }
    }
    
    // Check if user is admin of the project
    const membership = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId: user.id,
        role: "ADMIN",
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden - admin required" }, { status: 403 });
    }

    const body = await request.json();
    const { email, emails, userId, role = "MEMBER" } = body;

    // Support adding by userId directly (for existing users)
    if (userId) {
      // Check if already member
      const existing = await prisma.projectMember.findFirst({
        where: {
          projectId,
          userId,
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "User is already a member" },
          { status: 400 }
        );
      }

      const member = await prisma.projectMember.create({
        data: {
          projectId,
          userId,
          role,
        },
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
      });

      return NextResponse.json(
        { success: true, member },
        { status: 201 }
      );
    }

    // Support adding by email(s) (legacy/invitation flow)
    const emailList = emails || (email ? [email] : []);

    if (!emailList.length || !emailList.every((e: string) => e?.trim())) {
      return NextResponse.json(
        { error: "At least one email or userId is required" },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    for (const emailToAdd of emailList) {
      try {
        // Find user by email
        const targetUser = await prisma.user.findUnique({
          where: { email: emailToAdd.trim().toLowerCase() },
        });

        if (!targetUser) {
          // Create a placeholder/invited user if doesn't exist
          // For now, skip users that don't exist
          errors.push({ email: emailToAdd, error: "User not found - they need to register first" });
          continue;
        }

        // Check if already member
        const existing = await prisma.projectMember.findFirst({
          where: {
            projectId,
            userId: targetUser.id,
          },
        });

        if (existing) {
          errors.push({ email: emailToAdd, error: "Already a member" });
          continue;
        }

        const member = await prisma.projectMember.create({
          data: {
            projectId,
            userId: targetUser.id,
            role,
          },
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
        });

        results.push(member);
      } catch (err: any) {
        errors.push({ email: emailToAdd, error: err.message });
      }
    }

    return NextResponse.json(
      { 
        success: results.length > 0,
        added: results.length,
        failed: errors.length,
        members: results,
        errors: errors.length > 0 ? errors : undefined
      },
      { status: results.length > 0 ? 201 : 400 }
    );
  } catch (error: any) {
    console.error("Error adding member:", error);
    return NextResponse.json(
      { error: "Failed to add member", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/members - Remove member from project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId } = await params;

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Check if user is admin or removing themselves
    const isSelf = userId === user.id;
    if (!isSelf) {
      const membership = await prisma.projectMember.findFirst({
        where: {
          projectId,
          userId: user.id,
          role: "ADMIN",
        },
      });

      if (!membership) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    await prisma.projectMember.deleteMany({
      where: {
        projectId,
        userId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}
