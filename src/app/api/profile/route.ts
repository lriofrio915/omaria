import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";

function generateSlug(firstName: string, lastName: string): string {
  return `${firstName}-${lastName}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  let slug = base;
  let n = 1;
  while (true) {
    const existing = await prisma.employeeProfile.findUnique({ where: { publicSlug: slug } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${n++}`;
  }
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const employee = await prisma.employee.findFirst({
      where: { OR: [{ userId: user.id }, { email: user.email! }] },
      include: {
        department: {
          select: {
            name: true,
            company: { select: { name: true, primaryColor: true, logoUrl: true } },
          },
        },
        position: { select: { title: true } },
        profile: {
          include: {
            education: { orderBy: { startYear: "desc" } },
            experience: { orderBy: { startDate: "desc" } },
            skills: { orderBy: { category: "asc" } },
            languages: true,
            certifications: { orderBy: { createdAt: "desc" } },
          },
        },
      },
    });
    if (!employee) return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 });
    return NextResponse.json(employee);
  } catch {
    return NextResponse.json({ error: "Error al obtener perfil" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const employee = await prisma.employee.findFirst({ where: { OR: [{ userId: user.id }, { email: user.email! }] } });
    if (!employee) return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 });

    // Upsert profile
    const existing = await prisma.employeeProfile.findUnique({
      where: { employeeId: employee.id },
    });

    // Generate or keep slug
    const baseSlug = generateSlug(employee.firstName, employee.lastName);
    const slug = existing?.publicSlug ?? await uniqueSlug(baseSlug, existing?.id);

    const profile = await prisma.employeeProfile.upsert({
      where: { employeeId: employee.id },
      create: {
        employeeId: employee.id,
        publicSlug: slug,
        headline: body.headline ?? null,
        summary: body.summary ?? null,
        isPublic: body.isPublic ?? true,
        linkedinUrl: body.linkedinUrl ?? null,
        websiteUrl: body.websiteUrl ?? null,
        githubUrl: body.githubUrl ?? null,
        cvUrl: body.cvUrl ?? null,
        cvFileName: body.cvFileName ?? null,
      },
      update: {
        headline: body.headline ?? null,
        summary: body.summary ?? null,
        isPublic: body.isPublic ?? true,
        linkedinUrl: body.linkedinUrl ?? null,
        websiteUrl: body.websiteUrl ?? null,
        githubUrl: body.githubUrl ?? null,
        cvUrl: body.cvUrl ?? null,
        cvFileName: body.cvFileName ?? null,
      },
    });

    // Also update employee basic fields if provided
    if (body.avatarUrl !== undefined || body.phone !== undefined || body.city !== undefined) {
      await prisma.employee.update({
        where: { id: employee.id },
        data: {
          avatarUrl: body.avatarUrl ?? undefined,
          phone: body.phone ?? undefined,
          city: body.city ?? undefined,
          personalEmail: body.personalEmail ?? undefined,
        },
      });
    }

    return NextResponse.json(profile);
  } catch {
    return NextResponse.json({ error: "Error al guardar perfil" }, { status: 500 });
  }
}
