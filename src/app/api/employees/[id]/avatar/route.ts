import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;

  const employee = await prisma.employee.findUnique({ where: { id } });
  if (!employee) {
    return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Solo se permiten imágenes JPEG, PNG o WebP" },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "El archivo no puede superar 2MB" },
      { status: 400 }
    );
  }

  const ext = file.type.split("/")[1];
  const path = `${id}/avatar.${ext}`;
  const buffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: `Error al subir imagen: ${uploadError.message}` },
      { status: 500 }
    );
  }

  const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
  const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

  try {
    await prisma.employee.update({ where: { id }, data: { avatarUrl } });
  } catch {
    // Compensación: si falla la DB, limpiar el archivo subido
    await supabase.storage.from("avatars").remove([path]);
    return NextResponse.json(
      { error: "Error al guardar la URL del avatar" },
      { status: 500 }
    );
  }

  return NextResponse.json({ avatarUrl });
}
