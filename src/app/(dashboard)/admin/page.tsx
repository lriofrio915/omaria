import { Users, GitBranch, Briefcase, AlertTriangle, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma/client";
import { CompanyGrid } from "@/components/companies/CompanyGrid";
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

    const [totalColaboradores, totalDepartamentos, totalCargos, employees] = await Promise.all([
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
    ]);

    // Detectar empleados con al menos una brecha de competencias
    const LEVELS: Record<string, number> = { NONE: 0, BASIC: 1, INTERMEDIATE: 2, ADVANCED: 3, EXPERT: 4 };
    let conBrecha = 0;
    for (const emp of employees) {
      const hasGap = emp.position.competencies.some((req) => {
        const empComp = emp.competencies.find((ec) => ec.competencyId === req.competencyId);
        return (LEVELS[empComp?.currentLevel ?? "NONE"] ?? 0) < LEVELS[req.requiredLevel];
      });
      if (hasGap) conBrecha++;
    }

    return { totalColaboradores, totalDepartamentos, totalCargos, conBrecha };
  } catch {
    return { totalColaboradores: 0, totalDepartamentos: 0, totalCargos: 0, conBrecha: 0 };
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

  const statCards = [
    {
      label: "Colaboradores",
      value: stats.totalColaboradores,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
      hint: companySlug ? `en ${selectedCompany?.name}` : "en todo el holding",
    },
    {
      label: "Departamentos",
      value: stats.totalDepartamentos,
      icon: GitBranch,
      color: "text-violet-600",
      bg: "bg-violet-50",
      hint: "unidades organizacionales",
    },
    {
      label: "Cargos definidos",
      value: stats.totalCargos,
      icon: Briefcase,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      hint: "puestos con perfil",
    },
    {
      label: "Con brecha de competencias",
      value: stats.conBrecha,
      icon: AlertTriangle,
      color: "text-amber-600",
      bg: "bg-amber-50",
      hint: "requieren plan de desarrollo",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          SG Consulting Group — Gestión de Talento Humano
        </p>
      </div>

      {/* Empresas del holding */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Empresas del holding</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {companySlug
                ? `Mostrando métricas de ${selectedCompany?.name ?? companySlug}`
                : "Selecciona una empresa para filtrar las métricas"}
            </p>
          </div>
          {companySlug && (
            <Link
              href="/admin"
              className="text-xs text-slate-400 hover:text-slate-700 transition-colors"
            >
              Mostrar todo el holding
            </Link>
          )}
        </div>
        <CompanyGrid
          companies={companies}
          hrefPrefix="/admin?company"
          selectedSlug={companySlug}
        />
      </div>

      {/* Métricas dinámicas */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {selectedCompany && (
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: primaryColor }}
            />
          )}
          <h2 className="text-base font-semibold text-slate-800">
            {selectedCompany ? `Métricas — ${selectedCompany.name}` : "Resumen general del holding"}
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="border-slate-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">
                    {stat.label}
                  </CardTitle>
                  <div className={`rounded-lg p-2 ${stat.bg}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-xs text-slate-400 mt-1">{stat.hint}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Acciones rápidas y OmarIA */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">Acciones rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: "Ver organigramas", href: "/organigram" },
              { label: "Agregar colaborador", href: "/employees/new" },
              { label: "Subir documento", href: "/documents" },
              { label: "Registrar nómina", href: "/payroll" },
            ].map((a) => (
              <a
                key={a.href}
                href={a.href}
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
              >
                {a.label}
                <span className="text-slate-400">→</span>
              </a>
            ))}
            {companySlug && (
              <Link
                href={`/organigram/${companySlug}`}
                className="flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors"
                style={{
                  borderColor: `${primaryColor}40`,
                  backgroundColor: `${primaryColor}08`,
                  color: primaryColor,
                }}
              >
                Ver organigrama de {selectedCompany?.name}
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">OmarIA — Agente IA</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 mb-4">
              Consulta información de empleados, documentos y políticas de RRHH.
              Analiza brechas de competencias y genera planes de desarrollo.
            </p>
            <a
              href="/ai-agent"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Abrir OmarIA
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
