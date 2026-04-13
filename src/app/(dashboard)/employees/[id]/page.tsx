"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Edit, ArrowLeft, Camera, FileText, DollarSign, Users, Info, Star, Save, KeyRound,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentList } from "@/components/documents/DocumentList";

function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  personalEmail: string | null;
  corporateEmail: string | null;
  phone: string | null;
  whatsapp: string | null;
  birthDate: string | null;
  hireDate: string;
  endDate: string | null;
  contractType: string;
  status: string;
  salary: number | null;
  address: string | null;
  city: string | null;
  bloodType: string | null;
  notes: string | null;
  avatarUrl: string | null;
  role: string;
  department: { id: string; name: string; company?: { name: string } | null };
  position: { id: string; title: string };
  manager: { id: string; firstName: string; lastName: string } | null;
  subordinates: { id: string; firstName: string; lastName: string; employeeCode: string }[];
  documents: { id: string; title: string; type: string; createdAt: string }[];
  payrollRecords: { id: string; period: string; netSalary: number; status: string }[];
}

// ── Competency Types ──────────────────────────────────────────────────────────

type CompetencyLevel = "NONE" | "BASIC" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";

interface Competency {
  id: string;
  name: string;
  description: string | null;
  category: string;
}

interface EmployeeCompetency {
  id: string;
  competencyId: string;
  currentLevel: CompetencyLevel;
  notes: string | null;
  competency: Competency;
}

interface PositionRequirement {
  competencyId: string;
  requiredLevel: CompetencyLevel;
  isCritical: boolean;
  competency: Competency;
}

interface CompetencyData {
  employeeCompetencies: EmployeeCompetency[];
  positionRequirements: PositionRequirement[];
  allCompetencies: Competency[];
}

const LEVEL_ORDER: CompetencyLevel[] = ["NONE", "BASIC", "INTERMEDIATE", "ADVANCED", "EXPERT"];

const LEVEL_LABELS: Record<CompetencyLevel, string> = {
  NONE: "Sin nivel",
  BASIC: "Básico",
  INTERMEDIATE: "Intermedio",
  ADVANCED: "Avanzado",
  EXPERT: "Experto",
};

const LEVEL_COLORS: Record<CompetencyLevel, string> = {
  NONE: "text-slate-400",
  BASIC: "text-amber-500",
  INTERMEDIATE: "text-blue-500",
  ADVANCED: "text-green-500",
  EXPERT: "text-purple-600",
};

// ── Constants ─────────────────────────────────────────────────────────────────

const CONTRACT_LABELS: Record<string, string> = {
  INDEFINITE: "Indefinido",
  FIXED_TERM: "Plazo fijo",
  PART_TIME: "Medio tiempo",
  FREELANCE: "Freelance",
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:     "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  INACTIVE:   "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  ON_LEAVE:   "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  TERMINATED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  ON_LEAVE: "En permiso",
  TERMINATED: "Terminado",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

function colorFromString(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360} 55% 48%)`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  // Competency state
  const [competencyData, setCompetencyData] = useState<CompetencyData | null>(null);
  const [editedLevels, setEditedLevels] = useState<Record<string, CompetencyLevel>>({});
  const [savingCompetencies, setSavingCompetencies] = useState(false);

  useEffect(() => {
    fetch(`/api/employees/${id}`)
      .then((r) => {
        if (r.status === 404) router.replace("/employees");
        return r.json();
      })
      .then(setEmployee)
      .catch(() => toast.error("Error al cargar el empleado"))
      .finally(() => setLoading(false));
  }, [id, router]);

  async function resetPassword() {
    if (!employee) return;
    if (!confirm(`¿Enviar email de restablecimiento de contraseña a ${employee.email}?`)) return;
    setResettingPassword(true);
    const res = await fetch(`/api/employees/${id}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: employee.email }),
    });
    setResettingPassword(false);
    if (res.ok) toast.success("Email de restablecimiento enviado");
    else toast.error("Error al enviar el email");
  }

  const loadCompetencies = useCallback(async () => {
    const res = await fetch(`/api/employees/${id}/competencies`);
    if (!res.ok) return;
    const data: CompetencyData = await res.json();
    setCompetencyData(data);
    // Initialize edited levels from current employee competencies
    const initial: Record<string, CompetencyLevel> = {};
    data.employeeCompetencies.forEach((ec) => {
      initial[ec.competencyId] = ec.currentLevel;
    });
    setEditedLevels(initial);
  }, [id]);

  async function saveCompetencies() {
    setSavingCompetencies(true);
    const competencies = Object.entries(editedLevels).map(([competencyId, currentLevel]) => ({
      competencyId,
      currentLevel,
    }));
    const res = await fetch(`/api/employees/${id}/competencies`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ competencies }),
    });
    if (res.ok) {
      toast.success("Competencias guardadas");
      await loadCompetencies();
    } else {
      toast.error("Error al guardar competencias");
    }
    setSavingCompetencies(false);
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const form = new FormData();
    form.append("file", file);

    const res = await fetch(`/api/employees/${id}/avatar`, {
      method: "POST",
      body: form,
    });

    if (res.ok) {
      const { avatarUrl } = await res.json();
      setEmployee((prev) => prev ? { ...prev, avatarUrl } : prev);
      toast.success("Foto actualizada");
    } else {
      const { error } = await res.json();
      toast.error(error ?? "Error al subir la imagen");
    }
    setUploading(false);
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="h-32 bg-muted rounded-xl" />
        <div className="h-64 bg-muted rounded-xl" />
      </div>
    );
  }

  if (!employee) return null;

  const avatarBg = colorFromString(employee.id);
  const initials = getInitials(employee.firstName, employee.lastName);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back link */}
      <Link
        href="/employees"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Colaboradores
      </Link>

      {/* Header card */}
      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div
                className="h-20 w-20 rounded-full overflow-hidden flex items-center justify-center text-white text-2xl font-bold"
                style={{ background: employee.avatarUrl ? "transparent" : avatarBg }}
              >
                {employee.avatarUrl ? (
                  <img
                    src={employee.avatarUrl}
                    alt={`${employee.firstName} ${employee.lastName}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white shadow hover:bg-blue-700 disabled:opacity-50"
                title="Cambiar foto"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {employee.firstName} {employee.lastName}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {employee.position.title} · {employee.department.name}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      {employee.employeeCode}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[employee.status] ?? ""}`}>
                      {STATUS_LABELS[employee.status] ?? employee.status}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={resetPassword}
                    disabled={resettingPassword}
                    className="gap-2"
                    title="Enviar email de restablecimiento de contraseña"
                  >
                    <KeyRound className="h-4 w-4" />
                    {resettingPassword ? "Enviando..." : "Reset contraseña"}
                  </Button>
                  <Link href={`/employees/${employee.id}/edit`}>
                    <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700">
                      <Edit className="h-4 w-4" />
                      Editar
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="info">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="info" className="gap-1.5">
            <Info className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Info general</span>
            <span className="sm:hidden">Info</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Equipo</span>
            <span className="sm:hidden">Equipo</span>
          </TabsTrigger>
          <TabsTrigger value="competencies" className="gap-1.5" onClick={() => { if (!competencyData) loadCompetencies(); }}>
            <Star className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Competencias</span>
            <span className="sm:hidden">Comp.</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Documentos</span>
            <span className="sm:hidden">Docs</span>
          </TabsTrigger>
          <TabsTrigger value="payroll" className="gap-1.5">
            <DollarSign className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Nóminas</span>
            <span className="sm:hidden">Nómina</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Info general */}
        <TabsContent value="info" className="mt-4 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-muted-foreground">Datos personales</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                {[
                  { label: "Empresa", value: employee.department?.company?.name ?? "—" },
                  { label: "Correo corporativo", value: employee.corporateEmail ?? employee.email },
                  { label: "Correo personal", value: employee.personalEmail ?? "—" },
                  { label: "WhatsApp", value: employee.whatsapp ?? "—" },
                  { label: "Teléfono", value: employee.phone ?? "—" },
                  { label: "Fecha de nacimiento", value: employee.birthDate ? parseLocalDate(employee.birthDate).toLocaleDateString("es-EC") : "—" },
                  { label: "Tipo de sangre", value: employee.bloodType ?? "—" },
                  { label: "Dirección", value: employee.address ?? "—" },
                  { label: "Ciudad", value: employee.city ?? "—" },
                ].map((item) => (
                  <div key={item.label} className="flex items-start justify-between gap-4">
                    <dt className="text-xs text-muted-foreground shrink-0">{item.label}</dt>
                    <dd className="text-sm font-medium text-right">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-muted-foreground">Datos laborales</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                {[
                  { label: "Fecha de ingreso", value: new Date(employee.hireDate).toLocaleDateString("es-EC") },
                  { label: "Tipo de contrato", value: CONTRACT_LABELS[employee.contractType] ?? employee.contractType },
                  { label: "Salario", value: employee.salary ? `$${Number(employee.salary).toLocaleString("es-EC", { minimumFractionDigits: 2 })}` : "—" },
                  { label: "Jefe directo", value: employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : "—" },
                  { label: "Fecha de salida", value: employee.endDate ? new Date(employee.endDate).toLocaleDateString("es-EC") : "—" },
                ].map((item) => (
                  <div key={item.label} className="flex items-start justify-between gap-4">
                    <dt className="text-xs text-muted-foreground shrink-0">{item.label}</dt>
                    <dd className="text-sm font-medium text-right">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          {employee.notes && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-muted-foreground">Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{employee.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Equipo */}
        <TabsContent value="team" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Subordinados ({employee.subordinates.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {employee.subordinates.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin subordinados directos.</p>
              ) : (
                <ul className="space-y-2">
                  {employee.subordinates.map((sub) => (
                    <li key={sub.id}>
                      <Link
                        href={`/employees/${sub.id}`}
                        className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted transition-colors"
                      >
                        <span className="text-sm font-medium">{sub.firstName} {sub.lastName}</span>
                        <span className="text-xs text-muted-foreground font-mono">{sub.employeeCode}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Competencias */}
        <TabsContent value="competencies" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Competencias</CardTitle>
              {competencyData && Object.keys(editedLevels).length > 0 && (
                <Button size="sm" onClick={saveCompetencies} disabled={savingCompetencies} className="gap-1.5 bg-blue-600 hover:bg-blue-700 h-7 text-xs">
                  <Save className="h-3 w-3" />
                  {savingCompetencies ? "Guardando..." : "Guardar"}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {!competencyData ? (
                <p className="text-sm text-muted-foreground">Cargando competencias...</p>
              ) : competencyData.allCompetencies.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay competencias registradas en el sistema.</p>
              ) : (
                <div className="space-y-4">
                  {(["Directiva", "Tecnica", "Blanda"] as const).map((cat) => {
                    const comps = competencyData.allCompetencies.filter((c) => c.category === cat);
                    if (comps.length === 0) return null;
                    return (
                      <div key={cat}>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{cat === "Tecnica" ? "Técnica" : cat}</p>
                        <div className="space-y-2">
                          {comps.map((comp) => {
                            const req = competencyData.positionRequirements.find((r) => r.competencyId === comp.id);
                            const currentLevel = editedLevels[comp.id] ?? "NONE";
                            const reqIdx = req ? LEVEL_ORDER.indexOf(req.requiredLevel) : -1;
                            const curIdx = LEVEL_ORDER.indexOf(currentLevel);
                            const hasGap = req && curIdx < reqIdx;

                            return (
                              <div key={comp.id} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 hover:bg-muted/50">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-medium text-foreground">{comp.name}</span>
                                    {req?.isCritical && (
                                      <span className="text-xs text-red-500 font-medium">·crítica</span>
                                    )}
                                    {hasGap && (
                                      <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded-full">brecha</span>
                                    )}
                                  </div>
                                  {req && (
                                    <p className="text-xs text-muted-foreground">Requerido: {LEVEL_LABELS[req.requiredLevel]}</p>
                                  )}
                                </div>
                                <select
                                  value={currentLevel}
                                  onChange={(e) => setEditedLevels((prev) => ({ ...prev, [comp.id]: e.target.value as CompetencyLevel }))}
                                  className={`text-xs font-medium rounded-md border border-border bg-background px-2 py-1 cursor-pointer ${LEVEL_COLORS[currentLevel]}`}
                                >
                                  {LEVEL_ORDER.map((lvl) => (
                                    <option key={lvl} value={lvl}>{LEVEL_LABELS[lvl]}</option>
                                  ))}
                                </select>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Documentos */}
        <TabsContent value="documents" className="mt-4">
          <DocumentList isAdmin={true} employeeId={employee.id} />
        </TabsContent>

        {/* Tab: Nóminas */}
        <TabsContent value="payroll" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-muted-foreground">Nóminas recientes</CardTitle>
            </CardHeader>
            <CardContent>
              {employee.payrollRecords.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin registros de nómina.</p>
              ) : (
                <ul className="space-y-2">
                  {employee.payrollRecords.map((rec) => (
                    <li key={rec.id} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted">
                      <span className="text-sm font-medium">{rec.period}</span>
                      <span className="text-sm font-mono">
                        ${Number(rec.netSalary).toLocaleString("es-EC", { minimumFractionDigits: 2 })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
