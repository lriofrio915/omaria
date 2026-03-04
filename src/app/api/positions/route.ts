import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const departmentId = searchParams.get("departmentId");

  try {
    const positions = await prisma.position.findMany({
      where: departmentId ? { departmentId } : undefined,
      orderBy: { title: "asc" },
      select: { id: true, title: true, departmentId: true },
    });
    return NextResponse.json(positions);
  } catch {
    return NextResponse.json({ error: "Error al obtener posiciones" }, { status: 500 });
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
    const position = await prisma.position.create({
      data: { title: body.title, departmentId: body.departmentId, description: body.description },
    });
    return NextResponse.json(position, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error al crear posición" }, { status: 500 });
  }
}
