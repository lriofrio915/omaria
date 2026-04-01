import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma/client";

// GET — lista todos los empleados con su rol y perfil público
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const employees = await prisma.employee.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        department: { select: { name: true, company: { select: { name: true } } } },
        position: { select: { title: true } },
        profile: { select: { publicSlug: true } },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });
    return NextResponse.json(employees);
  } catch {
    return NextResponse.json({ error: "Error al obtener empleados" }, { status: 500 });
  }
}

// PUT — actualiza el rol de un empleado
export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const { employeeId, role } = await request.json();
    if (!employeeId || !["ADMIN", "EMPLOYEE"].includes(role)) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    // Actualizar en DB
    const employee = await prisma.employee.update({
      where: { id: employeeId },
      data: { role },
    });

    // Actualizar en Supabase Auth (best-effort)
    try {
      const adminClient = createAdminClient();
      await adminClient.auth.admin.updateUserById(employee.userId, {
        user_metadata: { role },
      });
    } catch {
      // Si el userId es placeholder, falla silenciosamente
    }

    return NextResponse.json({ ok: true, role });
  } catch {
    return NextResponse.json({ error: "Error al actualizar rol" }, { status: 500 });
  }
}
