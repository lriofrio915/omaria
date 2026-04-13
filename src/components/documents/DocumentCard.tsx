"use client";

import {
  FileText,
  Users,
  GitBranch,
  BookOpen,
  Shield,
  ListOrdered,
  FileSignature,
  Download,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DocumentRecord,
  DocumentType,
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_STATUS_LABELS,
  formatFileSize,
} from "@/types/document";

const TYPE_ICONS: Record<DocumentType, React.ElementType> = {
  JOB_ANALYSIS: FileText,
  ORGANIGRAM: Users,
  FLOWCHART: GitBranch,
  MANUAL: BookOpen,
  CONTRACT: FileSignature,
  POLICY: Shield,
  PROCEDURE: ListOrdered,
  OTHER: FileText,
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  PUBLISHED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  ARCHIVED: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

interface DocumentCardProps {
  doc: DocumentRecord;
  onDownload: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function DocumentCard({ doc, onDownload, onDelete }: DocumentCardProps) {
  const Icon = TYPE_ICONS[doc.type] ?? FileText;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {doc.title}
            </p>
            {doc.description && (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                {doc.description}
              </p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" className="text-xs">
                {DOCUMENT_TYPE_LABELS[doc.type]}
              </Badge>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[doc.status]}`}
              >
                {DOCUMENT_STATUS_LABELS[doc.status]}
              </span>
              {doc.isPublic && (
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                  Público
                </span>
              )}
            </div>

            <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
              <span>{formatFileSize(doc.fileSize)}</span>
              <span>
                {new Date(doc.createdAt).toLocaleDateString("es-EC", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              {doc.employee && (
                <span className="truncate">
                  {doc.employee.firstName} {doc.employee.lastName}
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onDownload(doc.id)}
              title="Descargar"
            >
              <Download className="h-4 w-4" />
            </Button>
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => onDelete(doc.id)}
                title="Eliminar"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
