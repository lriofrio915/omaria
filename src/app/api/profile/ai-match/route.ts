import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { chatCompletion } from "@/lib/anthropic/client";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { positionId } = await request.json();

    // Get employee with full profile
    const employee = await prisma.employee.findFirst({
      where: { OR: [{ userId: user.id }, { email: user.email! }] },
      include: {
        position: { select: { title: true, description: true, purpose: true, responsibilities: true, education: true, experience: true, skills: true } },
        profile: {
          include: {
            education: { orderBy: { startYear: "desc" } },
            experience: { orderBy: { startDate: "desc" } },
            skills: true,
            languages: true,
            certifications: true,
          },
        },
      },
    });

    if (!employee) return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 });

    // Get target position (may be current or a different one)
    const targetPositionId = positionId ?? employee.positionId;
    const position = await prisma.position.findUnique({
      where: { id: targetPositionId },
      include: { competencies: { include: { competency: true } } },
    });

    if (!position) return NextResponse.json({ error: "Cargo no encontrado" }, { status: 404 });

    const profile = employee.profile;

    const profileText = profile
      ? `
PERFIL DEL EMPLEADO: ${employee.firstName} ${employee.lastName}

Cargo actual: ${employee.position?.title ?? "N/A"}

Formación académica:
${profile.education.map(e => `- ${e.degree} en ${e.field} — ${e.institution} (${e.startYear}${e.endYear ? `–${e.endYear}` : " – Actualidad"})`).join("\n") || "No registrada"}

Experiencia laboral:
${profile.experience.map(e => `- ${e.position} en ${e.company} (${new Date(e.startDate).getFullYear()}${e.endDate ? `–${new Date(e.endDate).getFullYear()}` : " – Actualidad"})${e.description ? `: ${e.description}` : ""}`).join("\n") || "No registrada"}

Habilidades:
${profile.skills.map(s => `- ${s.name} (${s.category}, nivel ${s.level}/5)`).join("\n") || "No registradas"}

Idiomas:
${profile.languages.map(l => `- ${l.language}: ${l.level}`).join("\n") || "No registrados"}

Certificaciones:
${profile.certifications.map(c => `- ${c.name} — ${c.issuer}${c.issueYear ? ` (${c.issueYear})` : ""}`).join("\n") || "No registradas"}

Headline: ${profile.headline ?? "No definido"}
Resumen profesional: ${profile.summary ?? "No definido"}
`
      : `El empleado ${employee.firstName} ${employee.lastName} aún no tiene perfil completado.`;

    const positionText = `
DESCRIPCIÓN DEL CARGO: ${position.title}

Propósito: ${position.purpose ?? position.description ?? "No definido"}

Responsabilidades:
${position.responsibilities.map(r => `- ${r}`).join("\n") || "No definidas"}

Formación requerida: ${position.education ?? "No especificada"}
Experiencia requerida: ${position.experience ?? "No especificada"}

Habilidades requeridas:
${position.skills.map(s => `- ${s}`).join("\n") || "No especificadas"}

Competencias requeridas:
${position.competencies.map(c => `- ${c.competency.name} (${c.competency.category}): nivel ${c.requiredLevel}${c.isCritical ? " — CRÍTICA" : ""}`).join("\n") || "No definidas"}
`;

    const messages = [
      {
        role: "system" as const,
        content: `Eres OmarIA, analista de talento humano de SG Consulting Group. Tu tarea es comparar el perfil de un empleado con los requisitos de un cargo y generar un análisis detallado de compatibilidad. Responde siempre en español con formato estructurado usando markdown.`,
      },
      {
        role: "user" as const,
        content: `Analiza la compatibilidad entre el siguiente perfil de empleado y los requisitos del cargo. Proporciona:

1. **Puntuación de compatibilidad** (0-100%) con justificación
2. **Fortalezas** — áreas donde el empleado supera o cumple los requisitos
3. **Brechas** — áreas donde el empleado no cumple los requisitos
4. **Recomendaciones** — acciones concretas para cerrar las brechas
5. **Conclusión** — veredicto final sobre la idoneidad

${profileText}

${positionText}`,
      },
    ];

    const analysis = await chatCompletion(messages);
    return NextResponse.json({ analysis, positionTitle: position.title });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error al generar análisis" }, { status: 500 });
  }
}
