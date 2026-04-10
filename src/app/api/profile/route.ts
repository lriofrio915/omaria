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
            company: { select: { name: true, primaryColor: true, logoUrl: true, slug: true } },
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

    // Build update only from fields explicitly present in the request body
    const profileUpdate: Record<string, unknown> = {};
    if ("headline" in body)    profileUpdate.headline    = body.headline    ?? null;
    if ("summary" in body)     profileUpdate.summary     = body.summary     ?? null;
    if ("isPublic" in body)    profileUpdate.isPublic    = body.isPublic    ?? true;
    if ("linkedinUrl" in body) profileUpdate.linkedinUrl = body.linkedinUrl ?? null;
    if ("websiteUrl" in body)  profileUpdate.websiteUrl  = body.websiteUrl  ?? null;
    if ("githubUrl" in body)   profileUpdate.githubUrl   = body.githubUrl   ?? null;
    if ("cvUrl" in body)            profileUpdate.cvUrl            = body.cvUrl            ?? null;
    if ("cvFileName" in body)       profileUpdate.cvFileName       = body.cvFileName       ?? null;
    if ("senescytUrl" in body)          profileUpdate.senescytUrl          = body.senescytUrl          ?? null;
    if ("senescytFileName" in body)     profileUpdate.senescytFileName     = body.senescytFileName     ?? null;
    if ("trackRecordUrl" in body)       profileUpdate.trackRecordUrl       = body.trackRecordUrl       ?? null;
    if ("trackRecordFileName" in body)  profileUpdate.trackRecordFileName  = body.trackRecordFileName  ?? null;
    if ("trackRecordLink" in body)      profileUpdate.trackRecordLink      = body.trackRecordLink      ?? null;

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
        senescytUrl: body.senescytUrl ?? null,
        senescytFileName: body.senescytFileName ?? null,
        trackRecordUrl: body.trackRecordUrl ?? null,
        trackRecordFileName: body.trackRecordFileName ?? null,
        trackRecordLink: body.trackRecordLink ?? null,
      },
      update: profileUpdate,
    });

    // Also update employee basic fields if provided
    const employeeFields = ["avatarUrl", "phone", "city", "personalEmail", "birthDate", "bloodType", "address"];
    if (employeeFields.some(f => f in body)) {
      await prisma.employee.update({
        where: { id: employee.id },
        data: {
          avatarUrl: body.avatarUrl ?? undefined,
          phone: body.phone ?? undefined,
          city: body.city ?? undefined,
          personalEmail: body.personalEmail ?? undefined,
          birthDate: body.birthDate !== undefined ? (body.birthDate ? new Date(body.birthDate) : null) : undefined,
          bloodType: body.bloodType ?? undefined,
          address: body.address ?? undefined,
        },
      });
    }

    return NextResponse.json(profile);
  } catch {
    return NextResponse.json({ error: "Error al guardar perfil" }, { status: 500 });
  }
}
