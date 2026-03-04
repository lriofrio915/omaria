import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
    return NextResponse.json(departments);
  } catch {
    return NextResponse.json({ error: "Error al obtener departamentos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const department = await prisma.department.create({
      data: { name: body.name, description: body.description },
    });
    return NextResponse.json(department, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error al crear departamento" }, { status: 500 });
  }
}
