import { Users, FileText, DollarSign, UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma/client";

async function getStats() {
  try {
    const [totalEmployees, activeEmployees, totalDocuments, pendingPayrolls] =
      await Promise.all([
        prisma.employee.count(),
        prisma.employee.count({ where: { status: "ACTIVE" } }),
        prisma.document.count(),
        prisma.payrollRecord.count({ where: { status: "PENDING" } }),
      ]);
    return { totalEmployees, activeEmployees, totalDocuments, pendingPayrolls };
  } catch {
    return { totalEmployees: 0, activeEmployees: 0, totalDocuments: 0, pendingPayrolls: 0 };
  }
}

const stats = [
  {
    key: "totalEmployees",
    label: "Total empleados",
    icon: Users,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    key: "activeEmployees",
    label: "Empleados activos",
    icon: UserCheck,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    key: "totalDocuments",
    label: "Documentos",
    icon: FileText,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    key: "pendingPayrolls",
    label: "Nóminas pendientes",
    icon: DollarSign,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
] as const;

export default async function AdminDashboard() {
  const data = await getStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          Resumen general de Talento Humano — SG Consulting Group
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.key} className="border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {stat.label}
                </CardTitle>
                <div className={`rounded-lg p-2 ${stat.bg}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-slate-900">
                  {data[stat.key]}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">
              Acciones rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: "Agregar empleado", href: "/employees/new" },
              { label: "Subir documento", href: "/documents" },
              { label: "Registrar nómina", href: "/payroll" },
              { label: "Ver organigrama", href: "/organigram" },
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
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">
              OmarIA — Agente IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 mb-4">
              Consulta información de empleados, documentos y políticas de RRHH
              con el agente de inteligencia artificial.
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
