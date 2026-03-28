import { NextRequest } from "next/server";
import { chatCompletionStream, OMARIA_SYSTEM_PROMPT, ChatMessage } from "@/lib/anthropic/client";
import { createClient } from "@/lib/supabase/server";

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

  const fullMessages: ChatMessage[] = [
    { role: "system", content: OMARIA_SYSTEM_PROMPT },
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
