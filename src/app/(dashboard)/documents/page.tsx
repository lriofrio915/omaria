import { FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DocumentList } from "@/components/documents/DocumentList";

export default async function DocumentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdmin = user?.user_metadata?.role === "ADMIN";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/10">
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Documentos</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {isAdmin
            ? "Gestiona los documentos de la organización: manuales, políticas, contratos y más."
            : "Consulta los documentos disponibles para tu rol."}
        </p>
      </div>

      {/* Lista */}
      <DocumentList isAdmin={isAdmin} />
    </div>
  );
}
