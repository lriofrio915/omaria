import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";

const updateEmployeeSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional().nullable(),
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
        department: true,
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

    const data = parsed.data;
    const employee = await prisma.employee.update({
      where: { id },
      data: {
        ...data,
        birthDate: data.birthDate ? new Date(data.birthDate) : data.birthDate === null ? null : undefined,
        hireDate: data.hireDate ? new Date(data.hireDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : data.endDate === null ? null : undefined,
      },
      include: {
        department: { select: { id: true, name: true } },
        position: { select: { id: true, title: true } },
      },
    });

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
    await prisma.employee.delete({ where: { id } });
    return NextResponse.json({ message: "Empleado eliminado" });
  } catch {
    return NextResponse.json({ error: "Error al eliminar empleado" }, { status: 500 });
  }
}
