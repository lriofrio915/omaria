import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma/client";

const BUCKET = "documents";

function extractStoragePath(fileUrl: string): string {
  // URL shape: https://<project>.supabase.co/storage/v1/object/public/documents/<path>
  const marker = `/object/public/${BUCKET}/`;
  const idx = fileUrl.indexOf(marker);
  if (idx === -1) return fileUrl;
  return fileUrl.slice(idx + marker.length);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;

  const document = await prisma.document.findUnique({ where: { id } });
  if (!document) {
    return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
  }

  const storagePath = extractStoragePath(document.fileUrl);
  const adminClient = createAdminClient();

  const { error: storageError } = await adminClient.storage
    .from(BUCKET)
    .remove([storagePath]);

  if (storageError) {
    console.error("[documents/DELETE] Error borrando storage:", storageError.message);
    // Continuar — igual borramos el registro de DB
  }

  await prisma.document.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
