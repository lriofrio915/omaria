"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DocumentCard } from "@/components/documents/DocumentCard";
import { DocumentUploadDialog } from "@/components/documents/DocumentUploadDialog";
import {
  DocumentRecord,
  DocumentType,
  DocumentStatus,
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_STATUS_LABELS,
} from "@/types/document";

interface DocumentListProps {
  isAdmin: boolean;
  employeeId?: string;
}

export function DocumentList({ isAdmin, employeeId }: DocumentListProps) {
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [uploadOpen, setUploadOpen] = useState(false);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (typeFilter !== "ALL") params.set("type", typeFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (employeeId) params.set("employeeId", employeeId);

      const res = await fetch(`/api/documents?${params.toString()}`);
      if (!res.ok) throw new Error("Error al cargar documentos");
      const json = await res.json();
      setDocs(json.data ?? []);
    } catch {
      toast.error("Error al cargar documentos");
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, statusFilter, employeeId]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  async function handleDownload(id: string) {
    try {
      const res = await fetch(`/api/documents/${id}/download`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "No se pudo generar el enlace de descarga");
        return;
      }
      const { signedUrl } = await res.json();
      window.open(signedUrl, "_blank");
    } catch {
      toast.error("Error al descargar el documento");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este documento? Esta acción no se puede deshacer.")) return;

    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Error al eliminar el documento");
        return;
      }
      toast.success("Documento eliminado");
      fetchDocs();
    } catch {
      toast.error("Error al eliminar el documento");
    }
  }

  return (
    <div className="space-y-4">
      {/* Barra de filtros */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar documento…"
              className="pl-9"
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los tipos</SelectItem>
              {(Object.entries(DOCUMENT_TYPE_LABELS) as [DocumentType, string][]).map(
                ([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los estados</SelectItem>
              {(Object.entries(DOCUMENT_STATUS_LABELS) as [DocumentStatus, string][]).map(
                ([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>

        {isAdmin && (
          <Button
            onClick={() => setUploadOpen(true)}
            className="shrink-0"
          >
            <Plus className="mr-2 h-4 w-4" />
            Subir documento
          </Button>
        )}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-xl bg-slate-100 animate-pulse dark:bg-slate-800"
            />
          ))}
        </div>
      ) : docs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-12 dark:border-slate-700">
          <p className="text-sm text-slate-500">Sin documentos{search ? " para esta búsqueda" : ""}.</p>
          {isAdmin && !search && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setUploadOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Subir el primero
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {docs.map((doc) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              onDownload={handleDownload}
              onDelete={isAdmin ? handleDelete : undefined}
            />
          ))}
        </div>
      )}

      <DocumentUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSuccess={fetchDocs}
        employeeId={employeeId}
      />
    </div>
  );
}
