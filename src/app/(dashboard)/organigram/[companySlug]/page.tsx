import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma/client";
import { ArrowLeft, GitBranch, Users, Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  params: Promise<{ companySlug: string }>;
}

async function getCompany(slug: string) {
  try {
    return await prisma.company.findUnique({
      where: { slug },
      include: {
        departments: {
          include: {
            _count: { select: { employees: true, positions: true } },
          },
          orderBy: { name: "asc" },
        },
      },
    });
  } catch {
    return null;
  }
}

export default async function CompanyOrganigramPage({ params }: Props) {
  const { companySlug } = await params;
  const company = await getCompany(companySlug);

  if (!company) notFound();

  const totalEmployees = company.departments.reduce(
    (sum, d) => sum + d._count.employees,
    0
  );
  const totalPositions = company.departments.reduce(
    (sum, d) => sum + d._count.positions,
    0
  );

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
          background: `linear-gradient(135deg, ${company.primaryColor}15 0%, ${company.primaryColor}05 100%)`,
          borderLeft: `4px solid ${company.primaryColor}`,
        }}
      >
        <div className="flex items-center gap-5">
          {company.logoUrl ? (
            <div className="relative h-16 w-32 shrink-0">
              <Image
                src={company.logoUrl}
                alt={`Logo ${company.name}`}
                fill
                className="object-contain"
                sizes="128px"
              />
            </div>
          ) : (
            <div
              className="flex h-14 w-14 items-center justify-center rounded-xl text-2xl font-bold text-white shrink-0"
              style={{ backgroundColor: company.primaryColor }}
            >
              {company.name[0]}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{company.name}</h1>
            {company.description && (
              <p className="text-sm text-slate-500 mt-0.5">{company.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <Users className="h-3.5 w-3.5" />
                {totalEmployees} empleados
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <GitBranch className="h-3.5 w-3.5" />
                {company.departments.length} departamentos · {totalPositions} cargos
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Organigrama — en construcción (Sprint 2) */}
      <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm mb-4">
            <Construction className="h-7 w-7 text-amber-500" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">
            Organigrama en construcción
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm">
            El árbol visual con puestos, empleados y descriptivos de cargo estará
            disponible en la próxima actualización.
          </p>

          {/* Previsualización de departamentos */}
          {company.departments.length > 0 && (
            <div className="mt-8 w-full max-w-lg">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
                Departamentos registrados
              </p>
              <div className="grid gap-2 sm:grid-cols-2 text-left">
                {company.departments.map((dept) => (
                  <div
                    key={dept.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2.5"
                  >
                    <span className="text-sm font-medium text-slate-700">{dept.name}</span>
                    <span className="text-xs text-slate-400">
                      {dept._count.employees} emp.
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
