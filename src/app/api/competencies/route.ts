import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const competencies = await prisma.competency.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(competencies);
}

const createSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  category: z.enum(["Directiva", "Tecnica", "Blanda"]),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const competency = await prisma.competency.create({ data: parsed.data });
    return NextResponse.json(competency, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ya existe una competencia con ese nombre" }, { status: 409 });
  }
}
