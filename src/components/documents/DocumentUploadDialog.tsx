"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DOCUMENT_TYPE_LABELS, DOCUMENT_STATUS_LABELS } from "@/types/document";

const ACCEPTED = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg";

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  employeeId?: string;
}

export function DocumentUploadDialog({
  open,
  onOpenChange,
  onSuccess,
  employeeId,
}: DocumentUploadDialogProps) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("OTHER");
  const [status, setStatus] = useState("DRAFT");
  const [isPublic, setIsPublic] = useState(false);
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function resetForm() {
    setTitle("");
    setDescription("");
    setType("OTHER");
    setStatus("DRAFT");
    setIsPublic(false);
    setTags("");
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast.error("Selecciona un archivo");
      return;
    }
    if (!title.trim()) {
      toast.error("El título es requerido");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title.trim());
    if (description) formData.append("description", description.trim());
    formData.append("type", type);
    formData.append("status", status);
    formData.append("isPublic", String(isPublic));
    if (tags) formData.append("tags", tags);
    if (employeeId) formData.append("employeeId", employeeId);

    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        let errMsg = "Error al subir el documento";
        try {
          const err = await res.json();
          errMsg = err.error ?? errMsg;
        } catch {
          // respuesta no-JSON
        }
        toast.error(errMsg);
        return;
      }

      toast.success("Documento subido correctamente");
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!loading) {
          if (!v) resetForm();
          onOpenChange(v);
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Subir documento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Archivo */}
          <div className="space-y-1.5">
            <Label htmlFor="file">Archivo *</Label>
            <div
              className="flex items-center gap-3 rounded-lg border-2 border-dashed border-slate-200 px-4 py-3 cursor-pointer hover:border-blue-400 transition-colors dark:border-slate-700"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-5 w-5 text-slate-400 shrink-0" />
              <span className="text-sm text-slate-500 truncate">
                {file ? file.name : "Haz clic para seleccionar un archivo"}
              </span>
              <input
                ref={fileRef}
                id="file"
                type="file"
                accept={ACCEPTED}
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          {/* Título */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Manual de onboarding 2024"
            />
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción opcional"
              rows={2}
            />
          </div>

          {/* Tipo y Estado */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DOCUMENT_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label htmlFor="tags">Etiquetas</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="política, onboarding, 2024 (separadas por coma)"
            />
          </div>

          {/* Público */}
          <div className="flex items-center gap-2">
            <input
              id="isPublic"
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            <Label htmlFor="isPublic" className="cursor-pointer font-normal">
              Visible para todos los empleados
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Subiendo…" : "Subir documento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
