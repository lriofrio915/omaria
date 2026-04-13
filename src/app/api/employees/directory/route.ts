import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";

// Directorio público de empleados — sin datos sensibles (salary, emails personales)
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";

  try {
    const employees = await prisma.employee.findMany({
      where: {
        status: { not: "TERMINATED" },
        ...(search
          ? {
              OR: [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
                { position: { title: { contains: search, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        city: true,
        companyName: true,
        positionTitle: true,
        departmentName: true,
        department: { select: { name: true } },
        position: { select: { title: true } },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    return NextResponse.json(employees);
  } catch {
    return NextResponse.json({ error: "Error al obtener directorio" }, { status: 500 });
  }
}
