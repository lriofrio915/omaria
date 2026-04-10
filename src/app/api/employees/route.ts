import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma/client";

const createEmployeeSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  personalEmail: z.string().email().optional().or(z.literal("")),
  corporateEmail: z.string().email().optional().or(z.literal("")),
  bloodType: z.string().optional(),
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
  const companyId = searchParams.get("companyId");
  const departmentId = searchParams.get("departmentId");
  const showTerminated = searchParams.get("showTerminated") === "true";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "25", 10)));

  try {
    const where = {
      AND: [
        // Ocultar TERMINATED por defecto a menos que se pida explícitamente
        !showTerminated && !status ? { status: { not: "TERMINATED" as const } } : {},
        search
          ? {
              OR: [
                { firstName: { contains: search, mode: "insensitive" as const } },
                { lastName: { contains: search, mode: "insensitive" as const } },
                { employeeCode: { contains: search, mode: "insensitive" as const } },
                { position: { title: { contains: search, mode: "insensitive" as const } } },
              ],
            }
          : {},
        status ? { status: status as never } : {},
        departmentId ? { departmentId } : {},
        companyId ? { department: { companyId } } : {},
      ],
    };

    const [employees, total] = await prisma.$transaction([
      prisma.employee.findMany({
        where,
        include: {
          department: {
            select: {
              id: true,
              name: true,
              company: { select: { id: true, name: true, slug: true, primaryColor: true } },
            },
          },
          position: { select: { id: true, title: true } },
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      prisma.employee.count({ where }),
    ]);

    return NextResponse.json({ data: employees, total, page, pageSize });
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

    // Generar código de empleado usando MAX para evitar race conditions
    const result = await prisma.$queryRaw<[{ max: string | null }]>`
      SELECT MAX("employeeCode") as max FROM employees WHERE "employeeCode" LIKE 'SG%'
    `;
    const lastNum = result[0]?.max ? parseInt(result[0].max.replace("SG", ""), 10) : 0;
    const employeeCode = `SG${String(lastNum + 1).padStart(4, "0")}`;

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
        personalEmail: data.personalEmail || null,
        corporateEmail: data.corporateEmail || null,
        bloodType: data.bloodType || null,
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
        role: data.role,
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
