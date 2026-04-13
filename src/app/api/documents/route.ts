import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma/client";

const BUCKET = "documents";

const uploadSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  description: z.string().optional(),
  type: z.enum([
    "JOB_ANALYSIS",
    "ORGANIGRAM",
    "FLOWCHART",
    "MANUAL",
    "CONTRACT",
    "POLICY",
    "PROCEDURE",
    "OTHER",
  ]),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  isPublic: z
    .string()
    .transform((v) => v === "true")
    .default(false),
  employeeId: z.string().optional(),
  positionId: z.string().optional(),
  tags: z.string().optional(),
});

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const isAdmin = user.user_metadata?.role === "ADMIN";
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? undefined;
  const type = searchParams.get("type") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const employeeId = searchParams.get("employeeId") ?? undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(50, parseInt(searchParams.get("pageSize") ?? "20"));

  const where = {
    ...(isAdmin
      ? {}
      : { OR: [{ isPublic: true }, { uploadedById: user.id }] }),
    ...(search
      ? { title: { contains: search, mode: "insensitive" as const } }
      : {}),
    ...(type ? { type: type as never } : {}),
    ...(status ? { status: status as never } : {}),
    ...(employeeId ? { employeeId } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.document.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.document.count({ where }),
  ]);

  return NextResponse.json({ data, total });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "FormData inválido" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
  }

  const fields = Object.fromEntries(
    ["title", "description", "type", "status", "isPublic", "employeeId", "positionId", "tags"].map(
      (k) => [k, formData.get(k) ?? undefined]
    )
  );

  const parsed = uploadSchema.safeParse(fields);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const adminClient = createAdminClient();

  // Crear bucket si no existe
  const { error: bucketError } = await adminClient.storage.getBucket(BUCKET);
  if (bucketError) {
    await adminClient.storage.createBucket(BUCKET, { public: false });
  }

  const safeName = file.name.replace(/\s+/g, "-");
  const storagePath = `${user.id}/${Date.now()}-${safeName}`;
  const buffer = await file.arrayBuffer();

  const { error: uploadError } = await adminClient.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json(
      { error: `Error al subir archivo: ${uploadError.message}` },
      { status: 500 }
    );
  }

  const { data: urlData } = adminClient.storage
    .from(BUCKET)
    .getPublicUrl(storagePath);

  const tags = parsed.data.tags
    ? parsed.data.tags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  let document;
  try {
    document = await prisma.document.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        type: parsed.data.type,
        status: parsed.data.status,
        isPublic: parsed.data.isPublic,
        fileUrl: urlData.publicUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        version: 1,
        tags,
        employeeId: parsed.data.employeeId || undefined,
        positionId: parsed.data.positionId || undefined,
        uploadedById: user.id,
      },
    });
  } catch (err) {
    // Compensación: borrar archivo subido si falla la DB
    await adminClient.storage.from(BUCKET).remove([storagePath]);
    console.error("[documents/POST] Error en DB:", err);
    return NextResponse.json(
      { error: "Error al guardar el documento. Intenta de nuevo." },
      { status: 500 }
    );
  }

  return NextResponse.json({ document }, { status: 201 });
}
