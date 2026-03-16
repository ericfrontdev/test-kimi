import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProjectAccess } from "@/lib/project-access";

const BUCKET = "story-attachments";

// DELETE /api/projects/[id]/stories/[storyId]/attachments/[attachmentId]
export async function DELETE(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ id: string; storyId: string; attachmentId: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId, storyId, attachmentId } = await params;

  try {
    const access = await getProjectAccess(user.id, projectId);
    if (!access) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    }

    const attachment = await prisma.attachment.findFirst({
      where: { id: attachmentId, storyId },
    });

    if (!attachment) {
      return NextResponse.json({ error: "Fichier non trouvé" }, { status: 404 });
    }

    // Extract storage path from public URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const urlPrefix = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/`;
    const storagePath = attachment.url.replace(urlPrefix, "");

    const admin = createAdminClient();
    await admin.storage.from(BUCKET).remove([storagePath]);

    await prisma.attachment.delete({ where: { id: attachmentId } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Échec de la suppression du fichier" },
      { status: 500 }
    );
  }
}
