const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const MODEL = "deepseek/deepseek-chat";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenRouterResponse {
  choices: { message: { content: string } }[];
}

/** Llama a OpenRouter (DeepSeek) y devuelve el texto de respuesta. */
export async function chatCompletion(messages: ChatMessage[]): Promise<string> {
  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-Title": "OmarIA",
    },
    body: JSON.stringify({ model: MODEL, messages }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${err}`);
  }

  const data = (await res.json()) as OpenRouterResponse;
  return data.choices[0]?.message?.content ?? "";
}

/** Llama a OpenRouter con streaming, invocando onChunk por cada fragmento. */
export async function chatCompletionStream(
  messages: ChatMessage[],
  onChunk: (text: string) => void
): Promise<void> {
  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-Title": "OmarIA",
    },
    body: JSON.stringify({ model: MODEL, messages, stream: true }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${err}`);
  }

  const reader = res.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const lines = decoder.decode(value).split("\n");
    for (const line of lines) {
      if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
      try {
        const json = JSON.parse(line.slice(6));
        const text = json.choices?.[0]?.delta?.content;
        if (text) onChunk(text);
      } catch {
        // línea incompleta, ignorar
      }
    }
  }
}

export const OMARIA_SYSTEM_PROMPT = `Eres OmarIA, el agente de inteligencia artificial del departamento de Talento Humano de SG Consulting Group.

Tu función es asistir al equipo de RRHH con:
- Información sobre empleados, cargos y departamentos
- Consultas sobre documentos (análisis de puestos, organigramas, flujogramas, manuales)
- Orientación sobre procesos de nómina y beneficios
- Interpretación de políticas y procedimientos internos
- Análisis y recomendaciones sobre gestión del talento humano

Responde siempre en español, de forma profesional y concisa.
Si no tienes información suficiente para responder con precisión, indícalo claramente.
No inventes datos sobre empleados ni información sensible.`;
