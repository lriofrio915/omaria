import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";

async function ensureProfile(userId: string, userEmail: string): Promise<string> {
  const emp = await prisma.employee.findFirst({ where: { OR: [{ userId }, { email: userEmail }] } });
  if (!emp) throw new Error("Empleado no encontrado");
  const profile = await prisma.employeeProfile.upsert({
    where: { employeeId: emp.id },
    create: {
      employeeId: emp.id,
      publicSlug: `${emp.firstName}-${emp.lastName}`
        .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    },
    update: {},
  });
  return profile.id;
}

async function getProfileId(userId: string, userEmail: string): Promise<string | null> {
  const emp = await prisma.employee.findFirst({
    where: { OR: [{ userId }, { email: userEmail }] },
    include: { profile: { select: { id: true } } },
  });
  return emp?.profile?.id ?? null;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const profileId = await ensureProfile(user.id, user.email!);
    const item = await prisma.employeeCertification.create({
      data: {
        profileId,
        name: body.name,
        issuer: body.issuer,
        issueYear: body.issueYear ? Number(body.issueYear) : null,
        expiryYear: body.expiryYear ? Number(body.expiryYear) : null,
        credentialUrl: body.credentialUrl ?? null,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error al guardar certificación" }, { status: 500 });
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
    const item = await prisma.employeeCertification.findUnique({ where: { id } });
    if (!item || item.profileId !== profileId)
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    await prisma.employeeCertification.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}
