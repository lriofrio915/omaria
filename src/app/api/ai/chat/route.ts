import { NextRequest } from "next/server";
import { chatCompletionStream, OMARIA_SYSTEM_PROMPT, ChatMessage } from "@/lib/anthropic/client";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";

async function buildCompetencyContext(): Promise<string> {
  try {
    const [employees, competencies] = await Promise.all([
      prisma.employee.findMany({
        where: { status: { not: "TERMINATED" } },
        select: {
          firstName: true,
          lastName: true,
          position: { select: { title: true } },
          department: { select: { name: true } },
          competencies: {
            include: { competency: { select: { name: true, category: true } } },
          },
        },
      }),
      prisma.competency.findMany({ orderBy: { category: "asc" } }),
    ]);

    if (employees.length === 0) return "";

    const lines: string[] = [
      "",
      "## Datos del equipo (contexto actualizado)",
      `Total colaboradores activos: ${employees.length}`,
      "",
      "### Competencias disponibles en el sistema:",
    ];

    const byCategory = competencies.reduce<Record<string, string[]>>((acc, c) => {
      acc[c.category] = acc[c.category] ?? [];
      acc[c.category].push(c.name);
      return acc;
    }, {});

    for (const [cat, names] of Object.entries(byCategory)) {
      lines.push(`- ${cat}: ${names.join(", ")}`);
    }

    lines.push("", "### Resumen de competencias por colaborador:");

    for (const emp of employees) {
      const name = `${emp.firstName} ${emp.lastName}`;
      const cargo = emp.position.title;
      const dept = emp.department.name;
      if (emp.competencies.length === 0) {
        lines.push(`- ${name} (${cargo}, ${dept}): sin evaluación de competencias`);
      } else {
        const compStr = emp.competencies
          .map((ec: { competency: { name: string }; currentLevel: string }) => `${ec.competency.name}: ${ec.currentLevel}`)
          .join(", ");
        lines.push(`- ${name} (${cargo}, ${dept}): ${compStr}`);
      }
    }

    return lines.join("\n");
  } catch {
    return ""; // No interrumpir el chat si falla la carga de contexto
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { messages } = (await req.json()) as { messages: ChatMessage[] };
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response("Bad Request", { status: 400 });
  }

  const competencyContext = await buildCompetencyContext();
  const systemContent = OMARIA_SYSTEM_PROMPT + competencyContext;

  const fullMessages: ChatMessage[] = [
    { role: "system", content: systemContent },
    ...messages,
  ];

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        await chatCompletionStream(fullMessages, (chunk) => {
          controller.enqueue(encoder.encode(chunk));
        });
        controller.close();
      } catch {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
