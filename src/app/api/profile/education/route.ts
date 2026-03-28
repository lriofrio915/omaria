import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";

async function getProfileId(userId: string, userEmail: string): Promise<string | null> {
  const emp = await prisma.employee.findFirst({
    where: { OR: [{ userId }, { email: userEmail }] },
    include: { profile: { select: { id: true } } },
  });
  return emp?.profile?.id ?? null;
}

async function ensureProfile(userId: string, userEmail: string): Promise<string> {
  const emp = await prisma.employee.findFirst({ where: { OR: [{ userId }, { email: userEmail }] } });
  if (!emp) throw new Error("Empleado no encontrado");
  const profile = await prisma.employeeProfile.upsert({
    where: { employeeId: emp.id },
    create: {
      employeeId: emp.id,
      publicSlug: `${emp.firstName}-${emp.lastName}`
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    },
    update: {},
  });
  return profile.id;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const profileId = await ensureProfile(user.id, user.email!);
    const item = await prisma.employeeEducation.create({
      data: {
        profileId,
        institution: body.institution,
        degree: body.degree,
        field: body.field,
        startYear: Number(body.startYear),
        endYear: body.current ? null : (body.endYear ? Number(body.endYear) : null),
        current: body.current ?? false,
        description: body.description ?? null,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error al guardar formación" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    const profileId = await getProfileId(user.id, user.email!);
    const existing = await prisma.employeeEducation.findUnique({ where: { id } });
    if (!existing || existing.profileId !== profileId)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    const body = await request.json();
    const item = await prisma.employeeEducation.update({
      where: { id },
      data: {
        institution: body.institution,
        degree: body.degree,
        field: body.field,
        startYear: Number(body.startYear),
        endYear: body.current ? null : (body.endYear ? Number(body.endYear) : null),
        current: body.current ?? false,
        description: body.description ?? null,
      },
    });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Error al actualizar formación" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    const profileId = await getProfileId(user.id, user.email!);
    const item = await prisma.employeeEducation.findUnique({ where: { id } });
    if (!item || item.profileId !== profileId) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    await prisma.employeeEducation.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}
