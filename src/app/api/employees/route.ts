import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma/client";

const createEmployeeSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  hireDate: z.string(),
  contractType: z.enum(["INDEFINITE", "FIXED_TERM", "PART_TIME", "FREELANCE"]),
  status: z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE", "TERMINATED"]).default("ACTIVE"),
  salary: z.number().optional(),
  departmentId: z.string(),
  positionId: z.string(),
  managerId: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  notes: z.string().optional(),
  // Cuenta de acceso (opcional)
  createAccount: z.boolean().default(false),
  password: z.string().optional(),
  role: z.enum(["ADMIN", "EMPLOYEE"]).default("EMPLOYEE"),
});

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status");
  const departmentId = searchParams.get("departmentId");

  try {
    const employees = await prisma.employee.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { firstName: { contains: search, mode: "insensitive" } },
                  { lastName: { contains: search, mode: "insensitive" } },
                  { email: { contains: search, mode: "insensitive" } },
                  { employeeCode: { contains: search, mode: "insensitive" } },
                ],
              }
            : {},
          status ? { status: status as never } : {},
          departmentId ? { departmentId } : {},
        ],
      },
      include: {
        department: { select: { id: true, name: true } },
        position: { select: { id: true, title: true } },
        manager: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });
    return NextResponse.json(employees);
  } catch {
    return NextResponse.json({ error: "Error al obtener empleados" }, { status: 500 });
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
    const parsed = createEmployeeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;

    // Generar código de empleado
    const count = await prisma.employee.count();
    const employeeCode = `SG${String(count + 1).padStart(4, "0")}`;

    // Crear cuenta de Supabase Auth si se solicita
    let userId: string;
    if (data.createAccount && data.password) {
      const adminClient = createAdminClient();
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: data.email,
        password: data.password,
        user_metadata: { role: data.role },
        email_confirm: true,
      });
      if (authError) {
        return NextResponse.json({ error: `Error al crear cuenta: ${authError.message}` }, { status: 400 });
      }
      userId = authData.user.id;
    } else {
      // Generar un UUID placeholder (el empleado puede vincularse después)
      userId = crypto.randomUUID();
    }

    const employee = await prisma.employee.create({
      data: {
        userId,
        employeeCode,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
        hireDate: new Date(data.hireDate),
        contractType: data.contractType,
        status: data.status,
        salary: data.salary,
        departmentId: data.departmentId,
        positionId: data.positionId,
        managerId: data.managerId || null,
        address: data.address,
        city: data.city,
        notes: data.notes,
      },
      include: {
        department: { select: { id: true, name: true } },
        position: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error al crear empleado" }, { status: 500 });
  }
}
