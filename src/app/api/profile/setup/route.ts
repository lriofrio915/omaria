import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";

const setupSchema = z.object({
  firstName: z.string().min(1, "El nombre es requerido"),
  lastName: z.string().min(1, "El apellido es requerido"),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await request.json();
  const parsed = setupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { firstName, lastName } = parsed.data;

  // Verificar que no existe ya un employee para este usuario
  const existing = await prisma.employee.findFirst({
    where: { OR: [{ userId: user.id }, { email: user.email! }] },
  });
  if (existing) {
    return NextResponse.json({ error: "El empleado ya existe" }, { status: 409 });
  }

  // Buscar o crear departamento "Pendiente"
  let department = await prisma.department.findFirst({ where: { name: "Pendiente" } });
  if (!department) {
    department = await prisma.department.create({ data: { name: "Pendiente" } });
  }

  // Buscar o crear posición "Pendiente" en ese departamento
  let position = await prisma.position.findFirst({
    where: { title: "Pendiente", departmentId: department.id },
  });
  if (!position) {
    position = await prisma.position.create({
      data: { title: "Pendiente", departmentId: department.id },
    });
  }

  // Generar código de empleado único
  const count = await prisma.employee.count();
  const employeeCode = `SG${String(count + 1).padStart(4, "0")}`;

  const employee = await prisma.employee.create({
    data: {
      userId: user.id,
      employeeCode,
      firstName,
      lastName,
      email: user.email!,
      hireDate: new Date(),
      departmentId: department.id,
      positionId: position.id,
      role: "EMPLOYEE",
    },
  });

  return NextResponse.json({ employee });
}
