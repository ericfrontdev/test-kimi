import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

// DELETE /api/projects/[id]/labels/[labelId]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; labelId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, labelId } = await params;

  try {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: user.id },
          { members: { some: { userId: user.id, role: "ADMIN" } } },
        ],
      },
    });

    if (!project) return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });

    await prisma.label.delete({
      where: { id: labelId, projectId },
    });

    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Échec de la suppression du label" }, { status: 500 });
  }
}
