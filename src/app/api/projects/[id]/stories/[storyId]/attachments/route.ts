import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProjectAccess } from "@/lib/project-access";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const BUCKET = "story-attachments";

// POST /api/projects/[id]/stories/[storyId]/attachments — upload a file
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; storyId: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId, storyId } = await params;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Fichier trop volumineux (max 10 Mo)" },
      { status: 400 }
    );
  }

  try {
    const access = await getProjectAccess(user.id, projectId);
    if (!access) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    }

    const story = await prisma.story.findFirst({
      where: { id: storyId, projectId },
    });

    if (!story) {
      return NextResponse.json({ error: "Story non trouvée" }, { status: 404 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
    const storagePath = `${projectId}/${storyId}/${crypto.randomUUID()}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const admin = createAdminClient();

    // Create bucket if needed
    const { data: buckets } = await admin.storage.listBuckets();
    if (!buckets?.some((b) => b.name === BUCKET)) {
      await admin.storage.createBucket(BUCKET, { public: true });
    }

    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(storagePath, buffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = admin.storage.from(BUCKET).getPublicUrl(storagePath);

    const attachment = await prisma.attachment.create({
      data: {
        filename: file.name,
        url: publicUrl,
        size: file.size,
        mimeType: file.type || "application/octet-stream",
        storyId,
      },
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Échec de l'envoi du fichier" },
      { status: 500 }
    );
  }
}
