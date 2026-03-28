import { Sparkles, ArrowLeft } from "lucide-react";
import { ChatInterface } from "@/components/ai/ChatInterface";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function AIAgentPage({ searchParams }: PageProps) {
  const { q } = await searchParams;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem-2rem)] md:h-[calc(100vh-4rem-3rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link
          href="/admin"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors"
          aria-label="Volver al dashboard"
        >
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </Link>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1B52B5]/10">
          <Sparkles className="h-4 w-4 text-[#1B52B5]" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground leading-none">OmarIA</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Agente de Talento Humano · SG Consulting Group</p>
        </div>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          En línea
        </span>
      </div>

      {/* Chat container */}
      <div className="flex-1 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <ChatInterface initialQuestion={q} />
      </div>
    </div>
  );
}
