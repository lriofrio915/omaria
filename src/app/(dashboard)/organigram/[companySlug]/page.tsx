import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma/client";
import { ArrowLeft, Users, GitBranch, Briefcase, AlertTriangle } from "lucide-react";
import { OrganigramContent } from "@/components/organigram/OrganigramContent";

interface Props {
  params: Promise<{ companySlug: string }>;
}

const LEVELS: Record<string, number> = { NONE: 0, BASIC: 1, INTERMEDIATE: 2, ADVANCED: 3, EXPERT: 4 };

async function getCompanyData(slug: string) {
  try {
    const company = await prisma.company.findUnique({
      where: { slug },
      include: {
        departments: {
          include: {
            positions: {
              include: {
                competencies: { include: { competency: true } },
                employees: {
                  where: { status: "ACTIVE" },
                  include: {
                    competencies: { include: { competency: true } },
                  },
                  take: 1,
                },
              },
            },
          },
          orderBy: { name: "asc" },
        },
      },
    });
    return company;
  } catch { return null; }
}

export default async function CompanyOrganigramPage({ params }: Props) {
  const { companySlug } = await params;
  const company = await getCompanyData(companySlug);
  if (!company) notFound();

  // Calcular stats
  let totalEmployees = 0;
  let totalPositions = 0;
  let withGaps = 0;

  for (const dept of company.departments) {
    for (const pos of dept.positions) {
      totalPositions++;
      for (const emp of pos.employees) {
        totalEmployees++;
        const hasGap = pos.competencies.some((req) => {
          const empComp = emp.competencies.find((ec) => ec.competencyId === req.competencyId);
          return (LEVELS[empComp?.currentLevel ?? "NONE"] ?? 0) < LEVELS[req.requiredLevel];
        });
        if (hasGap) withGaps++;
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Link
        href="/organigram"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Todas las empresas
      </Link>

      {/* Header de empresa */}
      <div
        className="relative overflow-hidden rounded-2xl p-6"
        style={{
          background: `linear-gradient(135deg, ${company.primaryColor}12 0%, ${company.primaryColor}04 100%)`,
          borderLeft: `4px solid ${company.primaryColor}`,
        }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          {company.logoUrl ? (
            <div className="relative h-14 w-28 shrink-0">
              <Image src={company.logoUrl} alt={company.name} fill className="object-contain" sizes="112px" />
            </div>
          ) : (
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl text-xl font-bold text-white shrink-0"
              style={{ backgroundColor: company.primaryColor }}
            >
              {company.name[0]}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">{company.name}</h1>
            {company.description && <p className="text-sm text-slate-500 mt-0.5">{company.description}</p>}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-2">
              {[
                { icon: Users, label: `${totalEmployees} colaboradores` },
                { icon: GitBranch, label: `${company.departments.length} departamentos` },
                { icon: Briefcase, label: `${totalPositions} cargos` },
                { icon: AlertTriangle, label: `${withGaps} con brecha`, warn: withGaps > 0 },
              ].map(({ icon: Icon, label, warn }) => (
                <span
                  key={label}
                  className={`flex items-center gap-1.5 text-xs ${warn ? "text-amber-600" : "text-slate-500"}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Organigrama interactivo */}
      <OrganigramContent company={company} />
    </div>
  );
}
