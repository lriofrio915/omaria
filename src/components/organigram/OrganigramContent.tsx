"use client";

import { useState } from "react";
import { Users, ChevronRight, X, User, Briefcase, BookOpen, TrendingUp, Sparkles, CheckCircle2, AlertCircle, XCircle } from "lucide-react";

// ─── tipos inferidos del include de Prisma ───────────────────────────────────
type CompetencyLevel = "NONE" | "BASIC" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";

interface Competency {
  id: string;
  name: string;
  category: string;
}

interface PositionCompetency {
  id: string;
  competencyId: string;
  requiredLevel: CompetencyLevel;
  isCritical: boolean;
  competency: Competency;
}

interface EmployeeCompetency {
  id: string;
  competencyId: string;
  currentLevel: CompetencyLevel;
  competency: Competency;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeCode: string;
  bio: string | null;
  avatarUrl: string | null;
  hireDate: Date;
  competencies: EmployeeCompetency[];
}

interface Position {
  id: string;
  title: string;
  purpose: string | null;
  responsibilities: string[];
  education: string | null;
  experience: string | null;
  skills: string[];
  level: number;
  competencies: PositionCompetency[];
  employees: Employee[];
}

interface Department {
  id: string;
  name: string;
  description: string | null;
  positions: Position[];
}

interface Company {
  id: string;
  name: string;
  slug: string;
  primaryColor: string;
  departments: Department[];
}

// ─── helpers ─────────────────────────────────────────────────────────────────
const LEVELS: Record<CompetencyLevel, number> = { NONE: 0, BASIC: 1, INTERMEDIATE: 2, ADVANCED: 3, EXPERT: 4 };
const LEVEL_LABEL: Record<CompetencyLevel, string> = {
  NONE: "Sin nivel", BASIC: "Básico", INTERMEDIATE: "Intermedio", ADVANCED: "Avanzado", EXPERT: "Experto",
};
const LEVEL_COLOR: Record<CompetencyLevel, string> = {
  NONE: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
  BASIC: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  INTERMEDIATE: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
  ADVANCED: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  EXPERT: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
};

function getGap(required: CompetencyLevel, current?: CompetencyLevel) {
  const req = LEVELS[required];
  const cur = LEVELS[current ?? "NONE"];
  const diff = req - cur;
  if (diff <= 0) return { severity: "ok", label: "Alineado", diff: 0 } as const;
  if (diff === 1) return { severity: "minor", label: "Brecha leve", diff } as const;
  if (diff === 2) return { severity: "moderate", label: "Brecha moderada", diff } as const;
  return { severity: "critical", label: "Brecha crítica", diff } as const;
}

function positionGapStatus(pos: Position) {
  if (pos.employees.length === 0) return "empty";
  const emp = pos.employees[0];
  const hasCritical = pos.competencies.some((req) => {
    const empComp = emp.competencies.find((ec) => ec.competencyId === req.competencyId);
    return getGap(req.requiredLevel, empComp?.currentLevel).severity === "critical";
  });
  const hasGap = pos.competencies.some((req) => {
    const empComp = emp.competencies.find((ec) => ec.competencyId === req.competencyId);
    return getGap(req.requiredLevel, empComp?.currentLevel).severity !== "ok";
  });
  if (hasCritical) return "critical";
  if (hasGap) return "gap";
  return "ok";
}

function GapBadge({ status }: { status: ReturnType<typeof positionGapStatus> }) {
  if (status === "empty") return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 text-xs">
      <User className="h-3 w-3" /> Sin asignación
    </span>
  );
  if (status === "critical") return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 px-2 py-0.5 text-xs">
      <XCircle className="h-3 w-3" /> Brecha crítica
    </span>
  );
  if (status === "gap") return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 px-2 py-0.5 text-xs">
      <AlertCircle className="h-3 w-3" /> Brecha detectada
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 px-2 py-0.5 text-xs">
      <CheckCircle2 className="h-3 w-3" /> Alineado
    </span>
  );
}

// ─── Panel comparativa ────────────────────────────────────────────────────────
function ComparisonPanel({
  position,
  company,
  onClose,
}: {
  position: Position;
  company: Company;
  onClose: () => void;
}) {
  const employee = position.employees[0] ?? null;
  const [tab, setTab] = useState<"perfil" | "comparativa">("perfil");

  const primaryColor = company.primaryColor;

  let matched = 0;
  const gapDetails = position.competencies.map((req) => {
    const empComp = employee?.competencies.find((ec) => ec.competencyId === req.competencyId);
    const gap = getGap(req.requiredLevel, empComp?.currentLevel);
    if (gap.severity === "ok") matched++;
    return { req, empComp, gap };
  });
  const readiness = position.competencies.length > 0
    ? Math.round((matched / position.competencies.length) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-50 flex h-full w-full max-w-xl flex-col bg-card shadow-2xl overflow-hidden border-l border-border">
        {/* Header */}
        <div className="shrink-0 px-6 pt-6 pb-4" style={{ borderBottom: `3px solid ${primaryColor}` }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium mb-2"
                style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
              >
                <Briefcase className="h-3 w-3" /> {company.name}
              </div>
              <h2 className="text-xl font-bold text-foreground">{position.title}</h2>
              {employee && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {employee.firstName} {employee.lastName}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Score */}
          {employee && (
            <div className="flex items-center gap-4 mt-4">
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: readiness >= 80 ? "#10B981" : readiness >= 50 ? "#F59E0B" : "#EF4444" }}>
                  {readiness}%
                </p>
                <p className="text-xs text-muted-foreground">Alineación</p>
              </div>
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${readiness}%`,
                    backgroundColor: readiness >= 80 ? "#10B981" : readiness >= 50 ? "#F59E0B" : "#EF4444",
                  }}
                />
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 mt-3 rounded-lg bg-muted p-1">
            {(["perfil", "comparativa"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 rounded-md py-1.5 text-xs font-medium capitalize transition-all ${
                  tab === t
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "perfil" ? "Perfil del cargo" : "Análisis de brechas"}
              </button>
            ))}
          </div>
        </div>

        {/* Contenido scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* TAB: Perfil del cargo */}
          {tab === "perfil" && (
            <>
              {position.purpose && (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Propósito del cargo</h3>
                  <p className="text-sm text-foreground leading-relaxed">{position.purpose}</p>
                </section>
              )}

              {position.responsibilities.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Responsabilidades</h3>
                  <ul className="space-y-1.5">
                    {position.responsibilities.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <div className="grid grid-cols-2 gap-4">
                {position.education && (
                  <div className="rounded-xl border border-border bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <BookOpen className="h-3 w-3" /> Educación
                    </p>
                    <p className="text-xs text-foreground">{position.education}</p>
                  </div>
                )}
                {position.experience && (
                  <div className="rounded-xl border border-border bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> Experiencia
                    </p>
                    <p className="text-xs text-foreground">{position.experience}</p>
                  </div>
                )}
              </div>

              {employee ? (
                <section className="rounded-xl border border-border bg-muted/30 p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Colaborador asignado</h3>
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {employee.firstName[0]}{employee.lastName[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {employee.firstName} {employee.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{employee.email}</p>
                      {employee.bio && (
                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-3">{employee.bio}</p>
                      )}
                    </div>
                  </div>
                </section>
              ) : (
                <div className="rounded-xl border-2 border-dashed border-border p-6 text-center">
                  <User className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Cargo sin colaborador asignado</p>
                </div>
              )}
            </>
          )}

          {/* TAB: Análisis de brechas */}
          {tab === "comparativa" && (
            <>
              {!employee ? (
                <div className="rounded-xl border-2 border-dashed border-border p-8 text-center">
                  <User className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground">Sin colaborador asignado</p>
                  <p className="text-xs text-muted-foreground mt-1">Asigna un colaborador para ver el análisis de brechas</p>
                </div>
              ) : (
                <>
                  <section>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      Competencias: requerido vs. actual
                    </h3>
                    <div className="space-y-3">
                      {gapDetails.map(({ req, empComp, gap }) => (
                        <div key={req.id} className="rounded-xl border border-border bg-muted/40 p-3">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <p className="text-sm font-medium text-foreground">{req.competency.name}</p>
                              <p className="text-xs text-muted-foreground">{req.competency.category}</p>
                            </div>
                            {req.isCritical && (
                              <span className="shrink-0 rounded-full bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 px-2 py-0.5 text-xs">crítica</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground mb-1">Requerido</p>
                              <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${LEVEL_COLOR[req.requiredLevel]}`}>
                                {LEVEL_LABEL[req.requiredLevel]}
                              </span>
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground mb-1">Actual</p>
                              <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${LEVEL_COLOR[empComp?.currentLevel ?? "NONE"]}`}>
                                {LEVEL_LABEL[empComp?.currentLevel ?? "NONE"]}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground mb-1">Brecha</p>
                              <span className={`text-xs font-semibold ${
                                gap.severity === "ok" ? "text-emerald-600 dark:text-emerald-400" :
                                gap.severity === "minor" ? "text-amber-600 dark:text-amber-400" :
                                gap.severity === "moderate" ? "text-orange-600 dark:text-orange-400" :
                                "text-red-600 dark:text-red-400"
                              }`}>
                                {gap.severity === "ok" ? "✓ OK" : `–${gap.diff} nivel${gap.diff > 1 ? "es" : ""}`}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Botón generar PDI */}
                  <div className="rounded-xl border p-4 text-center" style={{ borderColor: `${primaryColor}40`, backgroundColor: `${primaryColor}06` }}>
                    <Sparkles className="h-8 w-8 mx-auto mb-2" style={{ color: primaryColor }} />
                    <p className="text-sm font-semibold text-foreground mb-1">Generar Plan de Desarrollo</p>
                    <p className="text-xs text-muted-foreground mb-3">
                      OmarIA analizará las brechas detectadas y creará un plan personalizado con
                      cursos, capacitaciones y recomendaciones para {employee.firstName}.
                    </p>
                    <button
                      className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: primaryColor }}
                      onClick={() => alert("Módulo de PDI disponible en la próxima actualización (Sprint 5)")}
                    >
                      <Sparkles className="h-4 w-4" />
                      Generar PDI con OmarIA
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function OrganigramContent({ company }: { company: Company }) {
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);

  return (
    <>
      {selectedPosition && (
        <ComparisonPanel
          position={selectedPosition}
          company={company}
          onClose={() => setSelectedPosition(null)}
        />
      )}

      <div className="space-y-4">
        {company.departments.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-border p-12 text-center">
            <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No hay departamentos registrados</p>
          </div>
        ) : (
          company.departments.map((dept) => (
            <div key={dept.id} className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Header departamento */}
              <div
                className="flex items-center gap-3 px-5 py-3.5"
                style={{ backgroundColor: `${company.primaryColor}08`, borderBottom: `2px solid ${company.primaryColor}20` }}
              >
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                  style={{ backgroundColor: company.primaryColor }}
                >
                  {dept.name[0]}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{dept.name}</p>
                  {dept.description && <p className="text-xs text-muted-foreground">{dept.description}</p>}
                </div>
                <span className="ml-auto text-xs text-muted-foreground">{dept.positions.length} cargos</span>
              </div>

              {/* Posiciones */}
              {dept.positions.length === 0 ? (
                <p className="px-5 py-4 text-sm text-muted-foreground italic">Sin cargos registrados</p>
              ) : (
                <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
                  {dept.positions.map((pos) => {
                    const status = positionGapStatus(pos);
                    const employee = pos.employees[0];

                    return (
                      <button
                        key={pos.id}
                        onClick={() => setSelectedPosition(pos)}
                        className="flex flex-col gap-2 bg-card p-4 text-left hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground leading-tight">{pos.title}</p>
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 mt-0.5" />
                        </div>

                        {employee ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                              style={{ backgroundColor: company.primaryColor }}
                            >
                              {employee.firstName[0]}{employee.lastName[0]}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {employee.firstName} {employee.lastName}
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                              <User className="h-3 w-3 text-muted-foreground" />
                            </div>
                            <p className="text-xs text-muted-foreground italic">Vacante</p>
                          </div>
                        )}

                        <GapBadge status={status} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}
