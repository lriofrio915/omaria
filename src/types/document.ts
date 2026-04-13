export type DocumentType =
  | "JOB_ANALYSIS"
  | "ORGANIGRAM"
  | "FLOWCHART"
  | "MANUAL"
  | "CONTRACT"
  | "POLICY"
  | "PROCEDURE"
  | "OTHER";

export type DocumentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface DocumentRecord {
  id: string;
  title: string;
  description: string | null;
  type: DocumentType;
  status: DocumentStatus;
  fileUrl: string;
  fileName: string;
  fileSize: number | null;
  mimeType: string | null;
  version: number;
  tags: string[];
  isPublic: boolean;
  employeeId: string | null;
  positionId: string | null;
  uploadedById: string;
  createdAt: string;
  updatedAt: string;
  employee?: { id: string; firstName: string; lastName: string } | null;
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  JOB_ANALYSIS: "Análisis de puesto",
  ORGANIGRAM: "Organigrama",
  FLOWCHART: "Flujograma",
  MANUAL: "Manual",
  CONTRACT: "Contrato",
  POLICY: "Política",
  PROCEDURE: "Procedimiento",
  OTHER: "Otro",
};

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  DRAFT: "Borrador",
  PUBLISHED: "Publicado",
  ARCHIVED: "Archivado",
};

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}
