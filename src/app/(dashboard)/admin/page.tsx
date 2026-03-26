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
import { CompanyGrid } from "@/components/companies/CompanyGrid";
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

      {/* ── Empresas ── */}
      <div className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Empresas del holding</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {companySlug
              ? `Filtrando por ${selectedCompany?.name ?? companySlug} — haz clic para cambiar`
              : "Selecciona una empresa para filtrar las métricas"}
          </p>
        </div>
        <CompanyGrid
          companies={companies}
          hrefPrefix="/admin?company"
          selectedSlug={companySlug}
        />
      </div>

      {/* ── Stat cards ── */}
      <div className="space-y-3">
        {selectedCompany && (
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: primaryColor }}
            />
            <h2 className="text-sm font-semibold text-foreground">
              {selectedCompany.name}
            </h2>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            const BadgeIcon = stat.badgeIcon;
            return (
              <Card
                key={stat.label}
                className="relative overflow-hidden border-0 shadow-sm"
                style={{ borderLeft: `4px solid ${stat.accentColor}` }}
              >
                {/* Subtle background glow */}
                <div
                  className="absolute inset-0 opacity-[0.04] pointer-events-none"
                  style={{
                    background: `radial-gradient(ellipse at top right, ${stat.bgColor}, transparent 70%)`,
                  }}
                />
                <CardHeader className="pb-1 pt-5 px-5">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {stat.label}
                    </CardTitle>
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${stat.bgColor}18` }}
                    >
                      <Icon className="h-4 w-4" style={{ color: stat.accentColor }} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  <p className="text-4xl font-bold tracking-tight text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.hint}</p>
                  {stat.badge && BadgeIcon && (
                    <div className="flex items-center gap-1 mt-3">
                      <BadgeIcon className="h-3 w-3" style={{ color: stat.accentColor }} />
                      <span className="text-xs font-medium" style={{ color: stat.accentColor }}>
                        {stat.badge}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
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

        {/* Tasa de actividad */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Tasa de actividad</CardTitle>
            <p className="text-xs text-muted-foreground">Colaboradores activos sobre el total</p>
          </CardHeader>
          <CardContent className="pb-5">
            <div className="flex items-end gap-3 mb-4">
              <span className="text-4xl font-bold tracking-tight text-foreground">{actividadPct}%</span>
              <span className="text-sm text-muted-foreground mb-1">
                {stats.activos} / {stats.totalColaboradores}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${actividadPct}%`,
                  background: "linear-gradient(90deg, #1B52B5, #3b82f6)",
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.totalColaboradores - stats.activos} inactivos o con licencia
            </p>
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
