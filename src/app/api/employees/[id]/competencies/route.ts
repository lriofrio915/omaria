import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";

// GET /api/employees/[id]/competencies
// Devuelve competencias del empleado con gap vs cargo requerido
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  const employee = await prisma.employee.findUnique({
    where: { id },
    select: {
      positionId: true,
      competencies: {
        include: { competency: true },
        orderBy: [{ competency: { category: "asc" } }, { competency: { name: "asc" } }],
      },
    },
  });

  if (!employee) return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 });

  // Competencias requeridas por el cargo
  const positionRequirements = employee.positionId
    ? await prisma.positionCompetency.findMany({
        where: { positionId: employee.positionId },
        include: { competency: true },
      })
    : [];

  // Todas las competencias disponibles para el selector
  const allCompetencies = await prisma.competency.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({
    employeeCompetencies: employee.competencies,
    positionRequirements,
    allCompetencies,
  });
}

const levelSchema = z.enum(["NONE", "BASIC", "INTERMEDIATE", "ADVANCED", "EXPERT"]);

const upsertSchema = z.object({
  competencies: z.array(
    z.object({
      competencyId: z.string(),
      currentLevel: levelSchema,
      notes: z.string().optional(),
    })
  ),
});

// PUT /api/employees/[id]/competencies — upsert completo (admin)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;

  const employee = await prisma.employee.findUnique({ where: { id }, select: { id: true } });
  if (!employee) return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 });

  const body = await request.json();
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Upsert en transacción
  const results = await prisma.$transaction(
    parsed.data.competencies.map(({ competencyId, currentLevel, notes }) =>
      prisma.employeeCompetency.upsert({
        where: { employeeId_competencyId: { employeeId: id, competencyId } },
        create: { employeeId: id, competencyId, currentLevel, notes, assessedAt: new Date() },
        update: { currentLevel, notes, assessedAt: new Date() },
      })
    )
  );

  return NextResponse.json({ updated: results.length });
}
