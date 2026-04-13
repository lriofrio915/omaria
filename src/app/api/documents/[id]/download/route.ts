import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma/client";

const BUCKET = "documents";

function extractStoragePath(fileUrl: string): string {
  const marker = `/object/public/${BUCKET}/`;
  const idx = fileUrl.indexOf(marker);
  if (idx === -1) return fileUrl;
  return fileUrl.slice(idx + marker.length);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const document = await prisma.document.findUnique({ where: { id } });
  if (!document) {
    return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
  }

  const isAdmin = user.user_metadata?.role === "ADMIN";
  const canAccess =
    isAdmin || document.isPublic || document.uploadedById === user.id;

  if (!canAccess) {
    return NextResponse.json({ error: "Sin acceso a este documento" }, { status: 403 });
  }

  const storagePath = extractStoragePath(document.fileUrl);
  const adminClient = createAdminClient();

  const { data, error } = await adminClient.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 60);

  if (error || !data) {
    return NextResponse.json(
      { error: "No se pudo generar el enlace de descarga" },
      { status: 500 }
    );
  }

  return NextResponse.json({ signedUrl: data.signedUrl });
}
