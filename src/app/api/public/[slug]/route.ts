import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const profile = await prisma.employeeProfile.findUnique({
      where: { publicSlug: slug },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            avatarUrl: true,
            city: true,
            position: { select: { title: true } },
            department: {
              select: {
                name: true,
                company: { select: { name: true, primaryColor: true, logoUrl: true } },
              },
            },
          },
        },
        education: { orderBy: { startYear: "desc" } },
        experience: { orderBy: { startDate: "desc" } },
        skills: { orderBy: { category: "asc" } },
        languages: true,
        certifications: { orderBy: { issueYear: "desc" } },
      },
    });

    if (!profile || !profile.isPublic) {
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch {
    return NextResponse.json({ error: "Error al obtener perfil" }, { status: 500 });
  }
}
