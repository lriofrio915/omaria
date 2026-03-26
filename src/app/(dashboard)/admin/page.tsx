import {
  Users,
  GitBranch,
  Briefcase,
  AlertTriangle,
  FileUp,
  ReceiptText,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma/client";
import { cn } from "@/lib/utils";
import { CompetencyRing } from "@/components/dashboard/CompetencyRing";
import { DeptBarChart } from "@/components/dashboard/DeptBarChart";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{ company?: string }>;
}

async function getCompanies() {
  try {
    return await prisma.company.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
  } catch { return []; }
}

async function getStats(companySlug?: string) {
  try {
    const companyFilter = companySlug
      ? { department: { company: { slug: companySlug } } }
      : {};
    const deptFilter = companySlug
      ? { company: { slug: companySlug } }
      : {};

    const [totalColaboradores, totalDepartamentos, totalCargos, employees, statusGroups, depts] =
      await Promise.all([
        prisma.employee.count({ where: companyFilter }),
        prisma.department.count({ where: { ...deptFilter, companyId: { not: null } } }),
        prisma.position.count({ where: { department: deptFilter } }),
        prisma.employee.findMany({
          where: companyFilter,
          include: {
            position: { include: { competencies: true } },
            competencies: true,
          },
        }),
        prisma.employee.groupBy({
          by: ["status"],
          _count: { id: true },
          where: companyFilter,
        }),
        prisma.department.findMany({
          where: { ...deptFilter, companyId: { not: null } },
          include: { _count: { select: { employees: true } } },
          orderBy: { employees: { _count: "desc" } },
          take: 7,
        }),
      ]);

    const LEVELS: Record<string, number> = { NONE: 0, BASIC: 1, INTERMEDIATE: 2, ADVANCED: 3, EXPERT: 4 };
    let conBrecha = 0;
    for (const emp of employees) {
      const hasGap = emp.position.competencies.some((req) => {
        const empComp = emp.competencies.find((ec) => ec.competencyId === req.competencyId);
        return (LEVELS[empComp?.currentLevel ?? "NONE"] ?? 0) < LEVELS[req.requiredLevel];
      });
      if (hasGap) conBrecha++;
    }

    const statusMap: Record<string, number> = {};
    for (const g of statusGroups) statusMap[g.status] = g._count.id;

    const deptData = depts
      .filter((d) => d._count.employees > 0)
      .map((d) => ({ name: d.name, colaboradores: d._count.employees }));

    return {
      totalColaboradores,
      totalDepartamentos,
      totalCargos,
      conBrecha,
      sinBrecha: totalColaboradores - conBrecha,
      activos: statusMap["ACTIVE"] ?? 0,
      enLicencia: statusMap["ON_LEAVE"] ?? 0,
      inactivos: statusMap["INACTIVE"] ?? 0,
      terminados: statusMap["TERMINATED"] ?? 0,
      deptData,
    };
  } catch {
    return {
      totalColaboradores: 0,
      totalDepartamentos: 0,
      totalCargos: 0,
      conBrecha: 0,
      sinBrecha: 0,
      activos: 0,
      enLicencia: 0,
      inactivos: 0,
      terminados: 0,
      deptData: [],
    };
  }
}

async function getSelectedCompany(slug?: string) {
  if (!slug) return null;
  try {
    return await prisma.company.findUnique({ where: { slug } });
  } catch { return null; }
}

export default async function AdminDashboard({ searchParams }: PageProps) {
  const { company: companySlug } = await searchParams;
  const [companies, stats, selectedCompany] = await Promise.all([
    getCompanies(),
    getStats(companySlug),
    getSelectedCompany(companySlug),
  ]);

  const primaryColor = selectedCompany?.primaryColor ?? "#1B52B5";
  const actividadPct = stats.totalColaboradores > 0
    ? Math.round((stats.activos / stats.totalColaboradores) * 100)
    : 0;

  const statCards = [
    {
      label: "Colaboradores",
      value: stats.totalColaboradores,
      icon: Users,
      accentColor: "#1B52B5",
      bgColor: "#1B52B5",
      hint: companySlug ? selectedCompany?.name ?? companySlug : "total en el holding",
      badge: `${stats.activos} activos`,
      badgeIcon: CheckCircle2,
    },
    {
      label: "Departamentos",
      value: stats.totalDepartamentos,
      icon: GitBranch,
      accentColor: "#7c3aed",
      bgColor: "#7c3aed",
      hint: "unidades organizacionales",
      badge: null,
      badgeIcon: null,
    },
    {
      label: "Cargos definidos",
      value: stats.totalCargos,
      icon: Briefcase,
      accentColor: "#0891b2",
      bgColor: "#0891b2",
      hint: "puestos con perfil",
      badge: null,
      badgeIcon: null,
    },
    {
      label: "Brechas de competencias",
      value: stats.conBrecha,
      icon: AlertTriangle,
      accentColor: "#d97706",
      bgColor: "#d97706",
      hint: "requieren plan de desarrollo",
      badge: stats.totalColaboradores > 0
        ? `${Math.round((stats.conBrecha / stats.totalColaboradores) * 100)}% del total`
        : null,
      badgeIcon: TrendingUp,
    },
  ];

  const quickActions = [
    {
      label: "Subir documento",
      description: "Manuales, políticas, contratos",
      href: "/documents",
      icon: FileUp,
      color: "#1B52B5",
      bg: "#1B52B5",
    },
    {
      label: "Registrar nómina",
      description: "Recibos y pagos del período",
      href: "/payroll",
      icon: ReceiptText,
      color: "#7c3aed",
      bg: "#7c3aed",
    },
  ];

  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {companySlug && selectedCompany
              ? `Métricas de ${selectedCompany.name}`
              : "SG Consulting Group — Gestión de Talento Humano"}
          </p>
        </div>
        {companySlug && (
          <Link
            href="/admin"
            className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 transition-colors hover:bg-muted"
          >
            Ver todo el holding
          </Link>
        )}
      </div>

      {/* ── Selector de empresa (pills) ── */}
      {companies.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground mr-1">Empresa:</span>
          <Link
            href="/admin"
            className={cn(
              "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-all border",
              !companySlug
                ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white"
                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
            )}
          >
            Todo el holding
          </Link>
          {companies.map((company) => {
            const isSelected = companySlug === company.slug;
            return (
              <Link
                key={company.id}
                href={`/admin?company=${company.slug}`}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all border",
                  isSelected
                    ? "text-white border-transparent"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                )}
                style={isSelected ? { backgroundColor: company.primaryColor, borderColor: company.primaryColor } : {}}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: isSelected ? "rgba(255,255,255,0.8)" : company.primaryColor }}
                />
                {company.name}
              </Link>
            );
          })}
        </div>
      )}

      {/* ── Stat cards ── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const BadgeIcon = stat.badgeIcon;
          return (
            <div
              key={stat.label}
              className="relative overflow-hidden rounded-xl bg-card shadow-sm flex items-center gap-3 px-4 py-3.5"
              style={{ borderLeft: `3px solid ${stat.accentColor}` }}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${stat.bgColor}14` }}
              >
                <Icon className="h-4 w-4" style={{ color: stat.accentColor }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-2xl font-bold tracking-tight text-foreground leading-none">
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{stat.label}</p>
              </div>
              {stat.badge && BadgeIcon && (
                <div
                  className="shrink-0 flex items-center gap-1 rounded-full px-2 py-0.5"
                  style={{ backgroundColor: `${stat.accentColor}12` }}
                >
                  <BadgeIcon className="h-2.5 w-2.5" style={{ color: stat.accentColor }} />
                  <span className="text-[10px] font-semibold" style={{ color: stat.accentColor }}>
                    {stat.badge}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Gráficos ── */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* Colaboradores por departamento */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold text-foreground">
                Colaboradores por departamento
              </CardTitle>
            </div>
            <p className="text-xs text-muted-foreground">
              {companySlug && selectedCompany ? selectedCompany.name : "Todo el holding"} — top áreas
            </p>
          </CardHeader>
          <CardContent className="pt-2 pb-5">
            <DeptBarChart data={stats.deptData} />
          </CardContent>
        </Card>

        {/* Cobertura de competencias */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold text-foreground">
                Cobertura de competencias
              </CardTitle>
            </div>
            <p className="text-xs text-muted-foreground">
              Colaboradores con perfil completo
            </p>
          </CardHeader>
          <CardContent className="pt-2 pb-5">
            <CompetencyRing
              sinBrecha={stats.sinBrecha}
              conBrecha={stats.conBrecha}
            />
          </CardContent>
        </Card>
      </div>

      {/* ── Actividad + Acciones + OmarIA ── */}
      <div className="grid gap-4 md:grid-cols-3">

        {/* Estado de colaboradores */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground">Estado de colaboradores</CardTitle>
            <p className="text-xs text-muted-foreground">Distribución por situación laboral</p>
          </CardHeader>
          <CardContent className="pb-5 space-y-3">
            {[
              { label: "Activos", value: stats.activos, color: "#10b981", bg: "#10b98118" },
              { label: "En licencia", value: stats.enLicencia, color: "#3b82f6", bg: "#3b82f618" },
              { label: "Inactivos", value: stats.inactivos, color: "#94a3b8", bg: "#94a3b818" },
              { label: "Terminados", value: stats.terminados, color: "#f43f5e", bg: "#f43f5e18" },
            ].map((s) => {
              const pct = stats.totalColaboradores > 0
                ? Math.round((s.value / stats.totalColaboradores) * 100)
                : 0;
              return (
                <div key={s.label}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-xs text-muted-foreground">{s.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">{s.value}</span>
                      <span className="text-[10px] text-muted-foreground w-7 text-right">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: s.bg }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: s.color }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Acciones rápidas */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Acciones rápidas</CardTitle>
            <p className="text-xs text-muted-foreground">Tareas frecuentes de administración</p>
          </CardHeader>
          <CardContent className="pb-5 space-y-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group flex items-center gap-3 rounded-xl p-3 transition-all hover:shadow-md"
                  style={{
                    background: `${action.bg}08`,
                    border: `1px solid ${action.bg}20`,
                  }}
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105"
                    style={{ backgroundColor: `${action.bg}18` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: action.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{action.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{action.description}</p>
                  </div>
                  <span className="ml-auto text-muted-foreground text-xs group-hover:translate-x-0.5 transition-transform">
                    →
                  </span>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        {/* OmarIA */}
        <div
          className="relative overflow-hidden rounded-xl p-5 flex flex-col justify-between min-h-[180px]"
          style={{
            background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1B52B5 100%)",
          }}
        >
          {/* Grid decorativo */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">OmarIA</p>
                <p className="text-xs text-white/60">Agente de RRHH</p>
              </div>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              Analiza brechas, consulta empleados, genera planes de desarrollo y responde preguntas de RRHH en segundos.
            </p>
          </div>

          <Link
            href="/ai-agent"
            className="relative z-10 mt-4 inline-flex items-center gap-2 self-start rounded-lg bg-white/15 backdrop-blur-sm px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-white/25 border border-white/20"
          >
            Abrir OmarIA
            <span className="text-white/70">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
