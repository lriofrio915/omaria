"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  User, Briefcase, GraduationCap, Zap, Globe, Award,
  Plus, Trash2, ExternalLink, Upload, Bot, Loader2,
  Edit2, Check, X, Link2, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startYear: number;
  endYear: number | null;
  current: boolean;
  description: string | null;
  fileUrl: string | null;
  fileName: string | null;
}

interface Experience {
  id: string;
  company: string;
  position: string;
  location: string | null;
  startDate: string;
  endDate: string | null;
  current: boolean;
  description: string | null;
}

interface Skill {
  id: string;
  name: string;
  level: number;
  category: string;
}

interface Language {
  id: string;
  language: string;
  level: string;
}

interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueYear: number | null;
  expiryYear: number | null;
  credentialUrl: string | null;
}

interface Profile {
  id?: string;
  headline: string | null;
  summary: string | null;
  publicSlug: string | null;
  isPublic: boolean;
  linkedinUrl: string | null;
  websiteUrl: string | null;
  githubUrl: string | null;
  cvUrl: string | null;
  cvFileName: string | null;
  senescytUrl: string | null;
  senescytFileName: string | null;
  education: Education[];
  experience: Experience[];
  skills: Skill[];
  languages: Language[];
  certifications: Certification[];
}

interface EmployeeData {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  phone: string | null;
  city: string | null;
  personalEmail: string | null;
  position: { title: string } | null;
  department: { name: string; company: { name: string; primaryColor: string } | null } | null;
  profile: Profile | null;
}

// ─── Skill level labels ────────────────────────────────────────────────────────

const SKILL_LEVELS: Record<number, string> = {
  1: "Básico",
  2: "Elemental",
  3: "Intermedio",
  4: "Avanzado",
  5: "Experto",
};

const LANGUAGE_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2", "Nativo"];
const SKILL_CATEGORIES = ["Técnica", "Blanda", "Liderazgo", "Gestión", "Idioma", "Otra"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-EC", { month: "short", year: "numeric" });
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProfileEditor({ initialData }: { initialData: EmployeeData }) {
  const [data, setData] = useState<EmployeeData>(initialData);
  const profile = data.profile ?? {
    headline: null, summary: null, publicSlug: null, isPublic: true,
    linkedinUrl: null, websiteUrl: null, githubUrl: null,
    cvUrl: null, cvFileName: null,
    education: [], experience: [], skills: [], languages: [], certifications: [],
  };

  const [saving, setSaving] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [bioForm, setBioForm] = useState({
    headline: profile.headline ?? "",
    summary: profile.summary ?? "",
    linkedinUrl: profile.linkedinUrl ?? "",
    websiteUrl: profile.websiteUrl ?? "",
    githubUrl: profile.githubUrl ?? "",
    isPublic: profile.isPublic,
  });

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);
  const senescytInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [uploadingSenescyt, setUploadingSenescyt] = useState(false);

  // AI match
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiExpanded, setAiExpanded] = useState(false);

  // Dialogs
  const [eduDialog, setEduDialog] = useState(false);
  const [expDialog, setExpDialog] = useState(false);
  const [skillDialog, setSkillDialog] = useState(false);
  const [langDialog, setLangDialog] = useState(false);
  const [certDialog, setCertDialog] = useState(false);

  // Editing items
  const [editingEdu, setEditingEdu] = useState<Education | null>(null);
  const [editingExp, setEditingExp] = useState<Experience | null>(null);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [editingLang, setEditingLang] = useState<Language | null>(null);
  const [editingCert, setEditingCert] = useState<Certification | null>(null);

  const supabase = createClient();

  // ── Load fresh data ──────────────────────────────────────────────────────────
  async function reload() {
    const res = await fetch("/api/profile");
    if (res.ok) {
      const fresh = await res.json();
      setData(fresh);
    }
  }

  // ── Save bio / links ─────────────────────────────────────────────────────────
  async function saveBio() {
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bioForm),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Perfil actualizado");
      setEditingBio(false);
      await reload();
    } else {
      toast.error("Error al guardar");
    }
  }

  // ── Avatar upload ────────────────────────────────────────────────────────────
  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const path = `avatars/${data.id}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) { toast.error("Error subiendo foto"); setUploadingAvatar(false); return; }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatarUrl }),
    });
    setUploadingAvatar(false);
    if (res.ok) { toast.success("Foto actualizada"); await reload(); }
    else toast.error("Error al guardar foto");
  }

  // ── CV upload ────────────────────────────────────────────────────────────────
  async function handleCvChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") { toast.error("Solo se permiten archivos PDF"); return; }
    setUploadingCv(true);
    const path = `cv/${data.id}.pdf`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) { toast.error("Error subiendo archivo"); setUploadingCv(false); return; }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cvUrl: urlData.publicUrl, cvFileName: file.name }),
    });
    setUploadingCv(false);
    if (res.ok) { toast.success("Archivo de respaldo subido"); await reload(); }
    else toast.error("Error al guardar");
  }

  async function handleCvDelete() {
    setUploadingCv(true);
    await supabase.storage.from("avatars").remove([`cv/${data.id}.pdf`]);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cvUrl: null, cvFileName: null }),
    });
    setUploadingCv(false);
    if (res.ok) { toast.success("Archivo eliminado"); await reload(); }
    else toast.error("Error al eliminar");
  }

  // ── Senescyt upload ──────────────────────────────────────────────────────────
  async function handleSenescytChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") { toast.error("Solo se permiten archivos PDF"); return; }
    setUploadingSenescyt(true);
    const path = `senescyt/${data.id}.pdf`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) { toast.error("Error subiendo certificado"); setUploadingSenescyt(false); return; }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senescytUrl: urlData.publicUrl, senescytFileName: file.name }),
    });
    setUploadingSenescyt(false);
    if (res.ok) { toast.success("Certificado Senescyt subido"); await reload(); }
    else toast.error("Error al guardar");
  }

  async function handleSenescytDelete() {
    setUploadingSenescyt(true);
    await supabase.storage.from("avatars").remove([`senescyt/${data.id}.pdf`]);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senescytUrl: null, senescytFileName: null }),
    });
    setUploadingSenescyt(false);
    if (res.ok) { toast.success("Certificado eliminado"); await reload(); }
    else toast.error("Error al eliminar");
  }

  // ── AI match ─────────────────────────────────────────────────────────────────
  async function runAiMatch() {
    setAiLoading(true);
    setAiExpanded(true);
    const res = await fetch("/api/profile/ai-match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setAiLoading(false);
    if (res.ok) {
      const { analysis } = await res.json();
      setAiAnalysis(analysis);
    } else {
      toast.error("Error al generar análisis");
    }
  }

  const currentProfile = data.profile;
  const publicUrl = currentProfile?.publicSlug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/p/${currentProfile.publicSlug}`
    : null;

  return (
    <div className="space-y-6">
      {/* ── Header Card ── */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {/* Banner */}
        <div className="h-24 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-100 dark:from-blue-600 dark:via-indigo-600 dark:to-blue-700 border-b border-slate-200 dark:border-transparent" />

        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10">
            {/* Avatar */}
            <div className="relative shrink-0">
              <Avatar className="h-20 w-20 border-4 border-white dark:border-slate-900 shadow-lg ring-1 ring-slate-200 dark:ring-slate-700">
                <AvatarImage src={data.avatarUrl ?? undefined} />
                <AvatarFallback
                  className="text-xl font-bold text-white"
                  style={{ backgroundColor: data.department?.company?.primaryColor ?? "#1B3D5C" }}
                >
                  {initials(data.firstName, data.lastName)}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white shadow hover:bg-blue-700 cursor-pointer transition-colors disabled:opacity-60"
                title="Cambiar foto"
              >
                {uploadingAvatar ? <Loader2 className="h-3 w-3 animate-spin" /> : <Edit2 className="h-3 w-3" />}
              </button>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            {/* Name + position */}
            <div className="flex-1 min-w-0 pb-1">
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {data.firstName} {data.lastName}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {data.position?.title ?? ""} {data.department ? `· ${data.department.name}` : ""}
                {data.department?.company ? ` · ${data.department.company.name}` : ""}
              </p>
              {currentProfile?.headline && (
                <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">{currentProfile.headline}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 shrink-0">
              {publicUrl && (
                <Button variant="outline" size="sm" asChild className="cursor-pointer">
                  <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                    Ver perfil público
                  </a>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => cvInputRef.current?.click()}
                disabled={uploadingCv}
                className="cursor-pointer"
              >
                {uploadingCv ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Upload className="h-3.5 w-3.5 mr-1.5" />}
                {currentProfile?.cvFileName ? "Actualizar respaldo" : "Subir respaldo"}
              </Button>
              <input ref={cvInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleCvChange} />
              {currentProfile?.cvUrl && (
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" asChild className="cursor-pointer">
                    <a href={currentProfile.cvUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                      {currentProfile.cvFileName ?? "Ver archivo"}
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCvDelete}
                    disabled={uploadingCv}
                    className="cursor-pointer text-slate-400 hover:text-red-500 px-2"
                    title="Eliminar archivo"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Public link */}
          {publicUrl && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-2">
              <Link2 className="h-4 w-4 text-blue-500 shrink-0" />
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{publicUrl}</span>
              <button
                onClick={() => { navigator.clipboard.writeText(publicUrl); toast.success("¡Enlace copiado!"); }}
                className="ml-auto text-xs text-blue-600 hover:text-blue-700 cursor-pointer font-medium shrink-0"
              >
                Copiar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Bio / Links Card ── */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <User className="h-4 w-4 text-blue-500" />
            Acerca de mí
          </h2>
          {!editingBio ? (
            <Button variant="ghost" size="sm" onClick={() => { setBioForm({ headline: currentProfile?.headline ?? "", summary: currentProfile?.summary ?? "", linkedinUrl: currentProfile?.linkedinUrl ?? "", websiteUrl: currentProfile?.websiteUrl ?? "", githubUrl: currentProfile?.githubUrl ?? "", isPublic: currentProfile?.isPublic ?? true }); setEditingBio(true); }} className="cursor-pointer">
              <Edit2 className="h-3.5 w-3.5 mr-1.5" /> Editar
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" onClick={saveBio} disabled={saving} className="cursor-pointer">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />}
                Guardar
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setEditingBio(false)} className="cursor-pointer">
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        {!editingBio ? (
          <div className="space-y-3">
            {currentProfile?.summary ? (
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{currentProfile.summary}</p>
            ) : (
              <p className="text-sm text-slate-400 italic">Sin resumen profesional. Haz clic en Editar para añadirlo.</p>
            )}
            <div className="flex flex-wrap gap-3 mt-2">
              {currentProfile?.linkedinUrl && <a href={currentProfile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline cursor-pointer flex items-center gap-1"><Globe className="h-3 w-3" /> LinkedIn</a>}
              {currentProfile?.githubUrl && <a href={currentProfile.githubUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline cursor-pointer flex items-center gap-1"><Globe className="h-3 w-3" /> GitHub</a>}
              {currentProfile?.websiteUrl && <a href={currentProfile.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline cursor-pointer flex items-center gap-1"><Globe className="h-3 w-3" /> Web</a>}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Titular profesional</label>
              <Input
                value={bioForm.headline}
                onChange={e => setBioForm(f => ({ ...f, headline: e.target.value }))}
                placeholder="Ej: Gerente de Operaciones con 10 años de experiencia"
                className="cursor-text"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Resumen profesional</label>
              <Textarea
                value={bioForm.summary}
                onChange={e => setBioForm(f => ({ ...f, summary: e.target.value }))}
                placeholder="Describe tu trayectoria, logros y objetivos profesionales..."
                rows={4}
                className="cursor-text resize-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">LinkedIn URL</label>
                <Input value={bioForm.linkedinUrl} onChange={e => setBioForm(f => ({ ...f, linkedinUrl: e.target.value }))} placeholder="https://linkedin.com/in/..." className="cursor-text" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">GitHub URL</label>
                <Input value={bioForm.githubUrl} onChange={e => setBioForm(f => ({ ...f, githubUrl: e.target.value }))} placeholder="https://github.com/..." className="cursor-text" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Sitio web</label>
                <Input value={bioForm.websiteUrl} onChange={e => setBioForm(f => ({ ...f, websiteUrl: e.target.value }))} placeholder="https://..." className="cursor-text" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="isPublic"
                type="checkbox"
                checked={bioForm.isPublic}
                onChange={e => setBioForm(f => ({ ...f, isPublic: e.target.checked }))}
                className="cursor-pointer rounded"
              />
              <label htmlFor="isPublic" className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                Perfil público (visible con el enlace)
              </label>
            </div>
          </div>
        )}
      </div>

      {/* ── Tabs: Education, Experience, Skills, Languages, Certs ── */}
      <Tabs defaultValue="education" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto h-auto flex-wrap gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl">
          <TabsTrigger value="education" className="cursor-pointer flex items-center gap-1.5 text-xs sm:text-sm">
            <GraduationCap className="h-3.5 w-3.5" /> Formación
          </TabsTrigger>
          <TabsTrigger value="experience" className="cursor-pointer flex items-center gap-1.5 text-xs sm:text-sm">
            <Briefcase className="h-3.5 w-3.5" /> Experiencia
          </TabsTrigger>
          <TabsTrigger value="skills" className="cursor-pointer flex items-center gap-1.5 text-xs sm:text-sm">
            <Zap className="h-3.5 w-3.5" /> Habilidades
          </TabsTrigger>
          <TabsTrigger value="languages" className="cursor-pointer flex items-center gap-1.5 text-xs sm:text-sm">
            <Globe className="h-3.5 w-3.5" /> Idiomas
          </TabsTrigger>
          <TabsTrigger value="certifications" className="cursor-pointer flex items-center gap-1.5 text-xs sm:text-sm">
            <Award className="h-3.5 w-3.5" /> Certificaciones
          </TabsTrigger>
        </TabsList>

        {/* Education */}
        <TabsContent value="education" className="mt-4">
          <SectionCard
            title="Formación Académica"
            icon={<GraduationCap className="h-4 w-4 text-blue-500" />}
            onAdd={() => setEduDialog(true)}
          >
            {(currentProfile?.education ?? []).length === 0 ? (
              <EmptyState label="formación académica" />
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentProfile!.education.map(edu => (
                  <EduItem key={edu.id} item={edu}
                    onEdit={() => { setEditingEdu(edu); setEduDialog(true); }}
                    onDelete={async () => {
                      await fetch(`/api/profile/education?id=${edu.id}`, { method: "DELETE" });
                      toast.success("Eliminado"); await reload();
                    }} />
                ))}
              </div>
            )}
          </SectionCard>
          <EduDialog open={eduDialog} editItem={editingEdu} onClose={() => { setEduDialog(false); setEditingEdu(null); }} onSaved={async () => { setEduDialog(false); setEditingEdu(null); await reload(); }} />

          {/* Senescyt */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-blue-500" />
                Certificado Senescyt
              </h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => senescytInputRef.current?.click()}
                disabled={uploadingSenescyt}
                className="cursor-pointer"
              >
                {uploadingSenescyt
                  ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  : <Upload className="h-3.5 w-3.5 mr-1" />}
                {currentProfile?.senescytUrl ? "Actualizar" : "Subir"}
              </Button>
              <input
                ref={senescytInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleSenescytChange}
              />
            </div>
            <div className="px-5 py-4">
              {currentProfile?.senescytUrl ? (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20">
                    <GraduationCap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                      {currentProfile.senescytFileName ?? "Certificado Senescyt"}
                    </p>
                    <a
                      href={currentProfile.senescytUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <ExternalLink className="h-3 w-3" /> Ver certificado
                    </a>
                  </div>
                  <button
                    onClick={handleSenescytDelete}
                    disabled={uploadingSenescyt}
                    className="text-slate-400 hover:text-red-500 cursor-pointer transition-colors shrink-0"
                    title="Eliminar certificado"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => senescytInputRef.current?.click()}
                  className="flex flex-col items-center gap-2 py-6 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors"
                >
                  <Upload className="h-6 w-6 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm text-slate-400 dark:text-slate-500 text-center">
                    Sube el certificado emitido por el Senescyt (PDF)
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Experience */}
        <TabsContent value="experience" className="mt-4">
          <SectionCard
            title="Experiencia Laboral"
            icon={<Briefcase className="h-4 w-4 text-blue-500" />}
            onAdd={() => setExpDialog(true)}
          >
            {(currentProfile?.experience ?? []).length === 0 ? (
              <EmptyState label="experiencia laboral" />
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentProfile!.experience.map(exp => (
                  <ExpItem key={exp.id} item={exp}
                    onEdit={() => { setEditingExp(exp); setExpDialog(true); }}
                    onDelete={async () => {
                      await fetch(`/api/profile/experience?id=${exp.id}`, { method: "DELETE" });
                      toast.success("Eliminado"); await reload();
                    }} />
                ))}
              </div>
            )}
          </SectionCard>
          <ExpDialog open={expDialog} editItem={editingExp} onClose={() => { setExpDialog(false); setEditingExp(null); }} onSaved={async () => { setExpDialog(false); setEditingExp(null); await reload(); }} />
        </TabsContent>

        {/* Skills */}
        <TabsContent value="skills" className="mt-4">
          <SectionCard
            title="Habilidades"
            icon={<Zap className="h-4 w-4 text-blue-500" />}
            onAdd={() => setSkillDialog(true)}
          >
            {(currentProfile?.skills ?? []).length === 0 ? (
              <EmptyState label="habilidades" />
            ) : (
              <div className="flex flex-wrap gap-2 p-4">
                {currentProfile!.skills.map(skill => (
                  <SkillBadge key={skill.id} skill={skill}
                    onEdit={() => { setEditingSkill(skill); setSkillDialog(true); }}
                    onDelete={async () => {
                      await fetch(`/api/profile/skills?id=${skill.id}`, { method: "DELETE" });
                      toast.success("Eliminado"); await reload();
                    }} />
                ))}
              </div>
            )}
          </SectionCard>
          <SkillDialog open={skillDialog} editItem={editingSkill} onClose={() => { setSkillDialog(false); setEditingSkill(null); }} onSaved={async () => { setSkillDialog(false); setEditingSkill(null); await reload(); }} />
        </TabsContent>

        {/* Languages */}
        <TabsContent value="languages" className="mt-4">
          <SectionCard
            title="Idiomas"
            icon={<Globe className="h-4 w-4 text-blue-500" />}
            onAdd={() => setLangDialog(true)}
          >
            {(currentProfile?.languages ?? []).length === 0 ? (
              <EmptyState label="idiomas" />
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentProfile!.languages.map(lang => (
                  <LangItem key={lang.id} item={lang}
                    onEdit={() => { setEditingLang(lang); setLangDialog(true); }}
                    onDelete={async () => {
                      await fetch(`/api/profile/languages?id=${lang.id}`, { method: "DELETE" });
                      toast.success("Eliminado"); await reload();
                    }} />
                ))}
              </div>
            )}
          </SectionCard>
          <LangDialog open={langDialog} editItem={editingLang} onClose={() => { setLangDialog(false); setEditingLang(null); }} onSaved={async () => { setLangDialog(false); setEditingLang(null); await reload(); }} />
        </TabsContent>

        {/* Certifications */}
        <TabsContent value="certifications" className="mt-4">
          <SectionCard
            title="Certificaciones y Cursos"
            icon={<Award className="h-4 w-4 text-blue-500" />}
            onAdd={() => setCertDialog(true)}
          >
            {(currentProfile?.certifications ?? []).length === 0 ? (
              <EmptyState label="certificaciones" />
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentProfile!.certifications.map(cert => (
                  <CertItem key={cert.id} item={cert}
                    onEdit={() => { setEditingCert(cert); setCertDialog(true); }}
                    onDelete={async () => {
                      await fetch(`/api/profile/certifications?id=${cert.id}`, { method: "DELETE" });
                      toast.success("Eliminado"); await reload();
                    }} />
                ))}
              </div>
            )}
          </SectionCard>
          <CertDialog open={certDialog} editItem={editingCert} onClose={() => { setCertDialog(false); setEditingCert(null); }} onSaved={async () => { setCertDialog(false); setEditingCert(null); await reload(); }} />
        </TabsContent>
      </Tabs>

      {/* ── AI Match ── */}
      <div className="rounded-xl border border-blue-200 dark:border-blue-900/50 bg-white dark:bg-slate-900 overflow-hidden">
        <button
          onClick={() => setAiExpanded(v => !v)}
          className="w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Bot className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-slate-900 dark:text-slate-100">Análisis IA — Compatibilidad con el cargo</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">OmarIA compara tu perfil con los requisitos de tu puesto actual</p>
            </div>
          </div>
          {aiExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </button>

        {aiExpanded && (
          <div className="border-t border-blue-100 dark:border-blue-900/50 p-5">
            {!aiAnalysis && !aiLoading && (
              <div className="text-center py-6">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Genera un análisis personalizado de qué tan bien encaja tu perfil profesional con los requisitos de tu cargo actual.
                </p>
                <Button onClick={runAiMatch} className="cursor-pointer">
                  <Bot className="h-4 w-4 mr-2" />
                  Analizar compatibilidad
                </Button>
              </div>
            )}
            {aiLoading && (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-sm text-slate-500">OmarIA está analizando tu perfil...</p>
              </div>
            )}
            {aiAnalysis && !aiLoading && (
              <div className="space-y-4">
                <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {aiAnalysis}
                </div>
                <Button variant="outline" size="sm" onClick={runAiMatch} className="cursor-pointer">
                  <Bot className="h-3.5 w-3.5 mr-1.5" />
                  Regenerar análisis
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({
  title, icon, onAdd, children,
}: {
  title: string;
  icon: React.ReactNode;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          {icon}
          {title}
        </h3>
        <Button size="sm" variant="outline" onClick={onAdd} className="cursor-pointer">
          <Plus className="h-3.5 w-3.5 mr-1" />
          Añadir
        </Button>
      </div>
      {children}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
      No hay {label} registrada. Haz clic en Añadir para comenzar.
    </div>
  );
}

// ─── Education ────────────────────────────────────────────────────────────────

function EduItem({ item, onDelete, onEdit }: { item: Education; onDelete: () => void; onEdit: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 py-4 group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
      <div className="flex items-start gap-3 min-w-0">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20">
          <GraduationCap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.degree} · {item.field}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">{item.institution}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {item.startYear} – {item.current ? "Actualidad" : (item.endYear ?? "")}
          </p>
          {item.description && <p className="text-xs text-slate-500 mt-1">{item.description}</p>}
          {item.fileUrl && (
            <a
              href={item.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1 cursor-pointer"
            >
              <ExternalLink className="h-3 w-3" />
              {item.fileName ?? "Ver documento"}
            </a>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 shrink-0 transition-all">
        <button onClick={onEdit} className="text-slate-400 hover:text-blue-500 cursor-pointer" title="Editar">
          <Edit2 className="h-4 w-4" />
        </button>
        <button onClick={onDelete} className="text-slate-400 hover:text-red-500 cursor-pointer" title="Eliminar">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function EduDialog({ open, onClose, onSaved, editItem }: { open: boolean; onClose: () => void; onSaved: () => void; editItem?: Education | null }) {
  const [form, setForm] = useState({ institution: "", degree: "", field: "", startYear: "", endYear: "", current: false, description: "" });
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removeFile, setRemoveFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    if (editItem) {
      setForm({
        institution: editItem.institution,
        degree: editItem.degree,
        field: editItem.field,
        startYear: String(editItem.startYear),
        endYear: editItem.endYear ? String(editItem.endYear) : "",
        current: editItem.current,
        description: editItem.description ?? "",
      });
    } else {
      setForm({ institution: "", degree: "", field: "", startYear: "", endYear: "", current: false, description: "" });
    }
    setSelectedFile(null);
    setRemoveFile(false);
  }, [editItem, open]);

  async function submit() {
    if (!form.institution || !form.degree || !form.field || !form.startYear) {
      toast.error("Completa los campos requeridos"); return;
    }
    setSaving(true);

    // Step 1: save form data
    const res = await fetch(
      editItem ? `/api/profile/education?id=${editItem.id}` : "/api/profile/education",
      {
        method: editItem ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      }
    );
    if (!res.ok) { setSaving(false); toast.error("Error al guardar"); return; }
    const saved = await res.json();

    // Step 2: handle file upload / removal
    if (selectedFile) {
      const ext = selectedFile.name.split(".").pop() ?? "pdf";
      const path = `education/${saved.id}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, selectedFile, { upsert: true });
      if (!error) {
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        await fetch(`/api/profile/education?id=${saved.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileUrl: urlData.publicUrl, fileName: selectedFile.name }),
        });
      }
    } else if (removeFile) {
      await fetch(`/api/profile/education?id=${saved.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl: null, fileName: null }),
      });
    }

    setSaving(false);
    toast.success(editItem ? "Formación actualizada" : "Formación añadida");
    onSaved();
  }

  const existingFile = editItem?.fileUrl && !removeFile;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{editItem ? "Editar formación académica" : "Añadir formación académica"}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Institución *</label>
              <Input value={form.institution} onChange={e => setForm(f => ({ ...f, institution: e.target.value }))} placeholder="Universidad / Institución" className="cursor-text" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Título / Grado *</label>
              <Input value={form.degree} onChange={e => setForm(f => ({ ...f, degree: e.target.value }))} placeholder="Ej: Licenciatura" className="cursor-text" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Campo de estudio *</label>
              <Input value={form.field} onChange={e => setForm(f => ({ ...f, field: e.target.value }))} placeholder="Ej: Ingeniería de Sistemas" className="cursor-text" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Año inicio *</label>
              <Input type="number" value={form.startYear} onChange={e => setForm(f => ({ ...f, startYear: e.target.value }))} placeholder="2015" className="cursor-text" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Año fin</label>
              <Input type="number" value={form.endYear} onChange={e => setForm(f => ({ ...f, endYear: e.target.value }))} placeholder="2019" disabled={form.current} className="cursor-text disabled:opacity-50" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input id="edu-current" type="checkbox" checked={form.current} onChange={e => setForm(f => ({ ...f, current: e.target.checked, endYear: "" }))} className="cursor-pointer" />
            <label htmlFor="edu-current" className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer">En curso</label>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Descripción (opcional)</label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="cursor-text resize-none" />
          </div>

          {/* File attachment */}
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5 block">
              Archivo de respaldo (diploma, título, certificado...)
            </label>
            {existingFile ? (
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-slate-50 dark:bg-slate-800/50">
                <ExternalLink className="h-4 w-4 text-blue-500 shrink-0" />
                <a href={editItem!.fileUrl!} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline truncate flex-1 cursor-pointer">
                  {editItem!.fileName ?? "Ver archivo"}
                </a>
                <button
                  type="button"
                  onClick={() => setRemoveFile(true)}
                  className="text-slate-400 hover:text-red-500 cursor-pointer shrink-0"
                  title="Quitar archivo"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 px-3 py-2.5 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors"
              >
                <Upload className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {selectedFile ? selectedFile.name : "Haz clic para adjuntar un archivo (PDF, imagen)"}
                </span>
                {selectedFile && (
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    className="text-slate-400 hover:text-red-500 cursor-pointer shrink-0 ml-auto"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={e => { setSelectedFile(e.target.files?.[0] ?? null); setRemoveFile(false); }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="cursor-pointer">Cancelar</Button>
          <Button onClick={submit} disabled={saving} className="cursor-pointer">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Experience ───────────────────────────────────────────────────────────────

function ExpItem({ item, onDelete, onEdit }: { item: Experience; onDelete: () => void; onEdit: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 py-4 group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
      <div className="flex items-start gap-3 min-w-0">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-900/20">
          <Briefcase className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.position}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">{item.company}{item.location ? ` · ${item.location}` : ""}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {fmtDate(item.startDate)} – {item.current ? "Actualidad" : (item.endDate ? fmtDate(item.endDate) : "")}
          </p>
          {item.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 shrink-0 transition-all">
        <button onClick={onEdit} className="text-slate-400 hover:text-blue-500 cursor-pointer" title="Editar">
          <Edit2 className="h-4 w-4" />
        </button>
        <button onClick={onDelete} className="text-slate-400 hover:text-red-500 cursor-pointer" title="Eliminar">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function ExpDialog({ open, onClose, onSaved, editItem }: { open: boolean; onClose: () => void; onSaved: () => void; editItem?: Experience | null }) {
  const [form, setForm] = useState({ company: "", position: "", location: "", startDate: "", endDate: "", current: false, description: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editItem) {
      setForm({
        company: editItem.company,
        position: editItem.position,
        location: editItem.location ?? "",
        startDate: editItem.startDate.slice(0, 10),
        endDate: editItem.endDate ? editItem.endDate.slice(0, 10) : "",
        current: editItem.current,
        description: editItem.description ?? "",
      });
    } else {
      setForm({ company: "", position: "", location: "", startDate: "", endDate: "", current: false, description: "" });
    }
  }, [editItem, open]);

  async function submit() {
    if (!form.company || !form.position || !form.startDate) {
      toast.error("Completa los campos requeridos"); return;
    }
    setSaving(true);
    const res = await fetch(
      editItem ? `/api/profile/experience?id=${editItem.id}` : "/api/profile/experience",
      {
        method: editItem ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      }
    );
    setSaving(false);
    if (res.ok) { toast.success(editItem ? "Experiencia actualizada" : "Experiencia añadida"); onSaved(); }
    else toast.error("Error al guardar");
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{editItem ? "Editar experiencia laboral" : "Añadir experiencia laboral"}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Empresa *</label>
              <Input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Nombre de la empresa" className="cursor-text" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Cargo *</label>
              <Input value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} placeholder="Tu cargo" className="cursor-text" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Ciudad / País</label>
              <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Quito, Ecuador" className="cursor-text" />
            </div>
            <div />
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Fecha inicio *</label>
              <Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="cursor-pointer" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Fecha fin</label>
              <Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} disabled={form.current} className="cursor-pointer disabled:opacity-50" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input id="exp-current" type="checkbox" checked={form.current} onChange={e => setForm(f => ({ ...f, current: e.target.checked, endDate: "" }))} className="cursor-pointer" />
            <label htmlFor="exp-current" className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer">Trabajo actual</label>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Descripción (opcional)</label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Describe tus responsabilidades y logros..." className="cursor-text resize-none" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="cursor-pointer">Cancelar</Button>
          <Button onClick={submit} disabled={saving} className="cursor-pointer">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Skills ───────────────────────────────────────────────────────────────────

function SkillBadge({ skill, onDelete, onEdit }: { skill: Skill; onDelete: () => void; onEdit: () => void }) {
  const levelColor = ["", "bg-slate-100 text-slate-600", "bg-green-50 text-green-700", "bg-blue-50 text-blue-700", "bg-indigo-50 text-indigo-700", "bg-purple-50 text-purple-700"];
  return (
    <div className={`group flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${levelColor[skill.level] ?? levelColor[3]} dark:bg-slate-800 dark:text-slate-300`}>
      {skill.name}
      <span className="text-[10px] opacity-60">· {SKILL_LEVELS[skill.level]}</span>
      <button onClick={onEdit} className="opacity-0 group-hover:opacity-100 ml-0.5 text-current hover:text-blue-500 cursor-pointer transition-all" title="Editar">
        <Edit2 className="h-3 w-3" />
      </button>
      <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 text-current hover:text-red-500 cursor-pointer transition-all" title="Eliminar">
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

function SkillDialog({ open, onClose, onSaved, editItem }: { open: boolean; onClose: () => void; onSaved: () => void; editItem?: Skill | null }) {
  const [form, setForm] = useState({ name: "", level: "3", category: "Técnica" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editItem) {
      setForm({ name: editItem.name, level: String(editItem.level), category: editItem.category });
    } else {
      setForm({ name: "", level: "3", category: "Técnica" });
    }
  }, [editItem, open]);

  async function submit() {
    if (!form.name) { toast.error("Ingresa el nombre de la habilidad"); return; }
    setSaving(true);
    const res = await fetch(
      editItem ? `/api/profile/skills?id=${editItem.id}` : "/api/profile/skills",
      {
        method: editItem ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      }
    );
    setSaving(false);
    if (res.ok) { toast.success(editItem ? "Habilidad actualizada" : "Habilidad añadida"); onSaved(); }
    else toast.error("Error al guardar");
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>{editItem ? "Editar habilidad" : "Añadir habilidad"}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Habilidad *</label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Excel avanzado, Liderazgo, Python..." className="cursor-text" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Categoría</label>
            <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
              <SelectTrigger className="cursor-pointer"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SKILL_CATEGORIES.map(c => <SelectItem key={c} value={c} className="cursor-pointer">{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Nivel: {SKILL_LEVELS[Number(form.level)]}</label>
            <input type="range" min="1" max="5" value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))} className="w-full cursor-pointer accent-blue-600" />
            <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
              <span>Básico</span><span>Experto</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="cursor-pointer">Cancelar</Button>
          <Button onClick={submit} disabled={saving} className="cursor-pointer">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Languages ────────────────────────────────────────────────────────────────

const LANG_LEVEL_COLORS: Record<string, string> = {
  A1: "bg-slate-100 text-slate-600",
  A2: "bg-slate-100 text-slate-700",
  B1: "bg-green-100 text-green-700",
  B2: "bg-blue-100 text-blue-700",
  C1: "bg-indigo-100 text-indigo-700",
  C2: "bg-purple-100 text-purple-700",
  Nativo: "bg-amber-100 text-amber-700",
};

function LangItem({ item, onDelete, onEdit }: { item: Language; onDelete: () => void; onEdit: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3 group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
      <div className="flex items-center gap-3">
        <Globe className="h-4 w-4 text-slate-400" />
        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{item.language}</span>
        <Badge className={`text-xs ${LANG_LEVEL_COLORS[item.level] ?? "bg-slate-100 text-slate-600"} dark:bg-slate-700 dark:text-slate-300 border-0`}>
          {item.level}
        </Badge>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
        <button onClick={onEdit} className="text-slate-400 hover:text-blue-500 cursor-pointer" title="Editar">
          <Edit2 className="h-4 w-4" />
        </button>
        <button onClick={onDelete} className="text-slate-400 hover:text-red-500 cursor-pointer" title="Eliminar">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function LangDialog({ open, onClose, onSaved, editItem }: { open: boolean; onClose: () => void; onSaved: () => void; editItem?: Language | null }) {
  const [form, setForm] = useState({ language: "", level: "B1" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editItem) {
      setForm({ language: editItem.language, level: editItem.level });
    } else {
      setForm({ language: "", level: "B1" });
    }
  }, [editItem, open]);

  async function submit() {
    if (!form.language) { toast.error("Ingresa el idioma"); return; }
    setSaving(true);
    const res = await fetch(
      editItem ? `/api/profile/languages?id=${editItem.id}` : "/api/profile/languages",
      {
        method: editItem ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      }
    );
    setSaving(false);
    if (res.ok) { toast.success(editItem ? "Idioma actualizado" : "Idioma añadido"); onSaved(); }
    else toast.error("Error al guardar");
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>{editItem ? "Editar idioma" : "Añadir idioma"}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Idioma *</label>
            <Input value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))} placeholder="Ej: Inglés, Francés, Mandarín..." className="cursor-text" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Nivel</label>
            <Select value={form.level} onValueChange={v => setForm(f => ({ ...f, level: v }))}>
              <SelectTrigger className="cursor-pointer"><SelectValue /></SelectTrigger>
              <SelectContent>
                {LANGUAGE_LEVELS.map(l => <SelectItem key={l} value={l} className="cursor-pointer">{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="cursor-pointer">Cancelar</Button>
          <Button onClick={submit} disabled={saving} className="cursor-pointer">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Certifications ───────────────────────────────────────────────────────────

function CertItem({ item, onDelete, onEdit }: { item: Certification; onDelete: () => void; onEdit: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 py-4 group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
      <div className="flex items-start gap-3 min-w-0">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-900/20">
          <Award className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.name}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">{item.issuer}</p>
          {(item.issueYear || item.expiryYear) && (
            <p className="text-xs text-slate-400 mt-0.5">
              {item.issueYear ?? ""}{item.expiryYear ? ` – ${item.expiryYear}` : ""}
            </p>
          )}
          {item.credentialUrl && (
            <a href={item.credentialUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-0.5 flex items-center gap-1 cursor-pointer">
              <ExternalLink className="h-3 w-3" /> Ver credencial
            </a>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 shrink-0 transition-all">
        <button onClick={onEdit} className="text-slate-400 hover:text-blue-500 cursor-pointer" title="Editar">
          <Edit2 className="h-4 w-4" />
        </button>
        <button onClick={onDelete} className="text-slate-400 hover:text-red-500 cursor-pointer" title="Eliminar">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function CertDialog({ open, onClose, onSaved, editItem }: { open: boolean; onClose: () => void; onSaved: () => void; editItem?: Certification | null }) {
  const [form, setForm] = useState({ name: "", issuer: "", issueYear: "", expiryYear: "", credentialUrl: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editItem) {
      setForm({
        name: editItem.name,
        issuer: editItem.issuer,
        issueYear: editItem.issueYear ? String(editItem.issueYear) : "",
        expiryYear: editItem.expiryYear ? String(editItem.expiryYear) : "",
        credentialUrl: editItem.credentialUrl ?? "",
      });
    } else {
      setForm({ name: "", issuer: "", issueYear: "", expiryYear: "", credentialUrl: "" });
    }
  }, [editItem, open]);

  async function submit() {
    if (!form.name || !form.issuer) { toast.error("Completa los campos requeridos"); return; }
    setSaving(true);
    const res = await fetch(
      editItem ? `/api/profile/certifications?id=${editItem.id}` : "/api/profile/certifications",
      {
        method: editItem ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      }
    );
    setSaving(false);
    if (res.ok) { toast.success(editItem ? "Certificación actualizada" : "Certificación añadida"); onSaved(); }
    else toast.error("Error al guardar");
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{editItem ? "Editar certificación o curso" : "Añadir certificación o curso"}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Nombre del certificado / curso *</label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: AWS Certified Solutions Architect" className="cursor-text" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Entidad emisora *</label>
            <Input value={form.issuer} onChange={e => setForm(f => ({ ...f, issuer: e.target.value }))} placeholder="Ej: Amazon Web Services, Coursera..." className="cursor-text" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Año de emisión</label>
              <Input type="number" value={form.issueYear} onChange={e => setForm(f => ({ ...f, issueYear: e.target.value }))} placeholder="2023" className="cursor-text" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Año de expiración</label>
              <Input type="number" value={form.expiryYear} onChange={e => setForm(f => ({ ...f, expiryYear: e.target.value }))} placeholder="2026" className="cursor-text" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">URL de la credencial (opcional)</label>
            <Input value={form.credentialUrl} onChange={e => setForm(f => ({ ...f, credentialUrl: e.target.value }))} placeholder="https://..." className="cursor-text" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="cursor-pointer">Cancelar</Button>
          <Button onClick={submit} disabled={saving} className="cursor-pointer">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
