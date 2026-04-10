import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma/client";

const updateEmployeeSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  personalEmail: z.string().email().optional().nullable().or(z.literal("")),
  corporateEmail: z.string().email().optional().nullable().or(z.literal("")),
  bloodType: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  hireDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
  contractType: z.enum(["INDEFINITE", "FIXED_TERM", "PART_TIME", "FREELANCE"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE", "TERMINATED"]).optional(),
  salary: z.number().optional().nullable(),
  departmentId: z.string().optional(),
  positionId: z.string().optional(),
  managerId: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  role: z.enum(["ADMIN", "EMPLOYEE"]).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        department: { include: { company: true } },
        position: true,
        manager: { select: { id: true, firstName: true, lastName: true } },
        subordinates: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
        documents: { select: { id: true, title: true, type: true, createdAt: true } },
        payrollRecords: { select: { id: true, period: true, netSalary: true, status: true }, orderBy: { period: "desc" }, take: 5 },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 });
    }

    return NextResponse.json(employee);
  } catch {
    return NextResponse.json({ error: "Error al obtener empleado" }, { status: 500 });
  }
}

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

  try {
    const body = await request.json();
    const parsed = updateEmployeeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
    }

    const { role, ...restData } = parsed.data;
    const employee = await prisma.employee.update({
      where: { id },
      data: {
        ...restData,
        // Guardar role en la DB para persistencia garantizada
        ...(role ? { role } : {}),
        birthDate: restData.birthDate ? new Date(restData.birthDate) : restData.birthDate === null ? null : undefined,
        hireDate: restData.hireDate ? new Date(restData.hireDate) : undefined,
        endDate: restData.endDate ? new Date(restData.endDate) : restData.endDate === null ? null : undefined,
      },
      include: {
        department: { select: { id: true, name: true } },
        position: { select: { id: true, title: true } },
      },
    });

    // También actualizar en Supabase Auth (best-effort, no bloquea si falla)
    if (role) {
      try {
        const adminClient = createAdminClient();
        await adminClient.auth.admin.updateUserById(employee.userId, {
          user_metadata: { role },
        });
      } catch {
        // Si el userId es un placeholder, esto falla silenciosamente. El role ya está en DB.
      }
    }

    return NextResponse.json(employee);
  } catch {
    return NextResponse.json({ error: "Error al actualizar empleado" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 });
    }
    await prisma.employee.update({
      where: { id },
      data: { status: "TERMINATED", endDate: new Date() },
    });
    return NextResponse.json({ message: "Empleado desactivado correctamente" });
  } catch {
    return NextResponse.json({ error: "Error al desactivar empleado" }, { status: 500 });
  }
}
