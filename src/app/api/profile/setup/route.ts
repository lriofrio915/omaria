import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { z } from "zod";

const COMPANIES = ["Emporium", "SG Consulting", "Livin", "Eureka", "Spartans"] as const;

const setupSchema = z.object({
  whatsapp: z.string().min(7, "Ingresa un número de WhatsApp válido"),
  birthDate: z.string().optional(),
  bloodType: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  personalEmail: z
    .string()
    .email("Email inválido")
    .optional()
    .or(z.literal("")),
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

  try {
    // Verificar que no existe ya un employee para este usuario
    const existing = await prisma.employee.findFirst({
      where: { OR: [{ userId: user.id }, { email: user.email! }] },
    });
    if (existing) {
      return NextResponse.json({ error: "El empleado ya existe" }, { status: 409 });
    }

    const meta = user.user_metadata ?? {};
    const firstName: string = meta.firstName ?? meta.full_name?.split(" ")[0] ?? "Empleado";
    const lastName: string = meta.lastName ?? meta.full_name?.split(" ").slice(1).join(" ") ?? "";
    const companyName: string | undefined = meta.company;

    // Resolver empresa: upsert si está en la lista permitida
    let companyId: string | undefined;
    if (companyName && (COMPANIES as readonly string[]).includes(companyName)) {
      const slug = companyName.toLowerCase().replace(/\s+/g, "-");
      const company = await prisma.company.upsert({
        where: { name: companyName },
        create: { name: companyName, slug },
        update: {},
      });
      companyId = company.id;
    }

    // Buscar o crear departamento "Pendiente" vinculado a la empresa
    let department = await prisma.department.findFirst({
      where: {
        name: "Pendiente",
        ...(companyId ? { companyId } : {}),
      },
    });
    if (!department) {
      department = await prisma.department.create({
        data: {
          name: "Pendiente",
          ...(companyId ? { companyId } : {}),
        },
      });
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

    const { whatsapp, birthDate, bloodType, city, address, personalEmail } = parsed.data;

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
        whatsapp: whatsapp || undefined,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        bloodType: bloodType || undefined,
        city: city || undefined,
        address: address || undefined,
        personalEmail: personalEmail || undefined,
      },
    });

    return NextResponse.json({ employee });
  } catch (err) {
    console.error("[profile/setup] Error:", err);
    return NextResponse.json({ error: "Error al crear el perfil. Intenta de nuevo." }, { status: 500 });
  }
}
