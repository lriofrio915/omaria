import { FileText, DollarSign, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { redirect } from "next/navigation";

async function getEmployeeData(userId: string) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { userId },
      include: {
        department: { select: { name: true } },
        position: { select: { title: true } },
      },
    });
    return employee;
  } catch {
    return null;
  }
}

export default async function EmployeeDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const employee = await getEmployeeData(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {employee
            ? `Hola, ${employee.firstName}`
            : "Mi Portal"}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {employee
            ? `${employee.position.title} · ${employee.department.name}`
            : "Bienvenido a OmarIA — SG Consulting Group"}
        </p>
      </div>

      {employee && (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">
              Mi información
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "Código", value: employee.employeeCode },
                { label: "Cargo", value: employee.position.title },
                { label: "Departamento", value: employee.department.name },
                { label: "Correo", value: employee.email },
                {
                  label: "Fecha de ingreso",
                  value: new Date(employee.hireDate).toLocaleDateString("es-EC"),
                },
                { label: "Estado", value: employee.status === "ACTIVE" ? "Activo" : employee.status },
              ].map((item) => (
                <div key={item.label}>
                  <dt className="text-xs font-medium text-slate-500">{item.label}</dt>
                  <dd className="mt-0.5 text-sm text-slate-900">{item.value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Mis documentos",
            description: "Consulta tus análisis de puesto, contratos y más",
            href: "/documents",
            icon: FileText,
            color: "text-purple-600",
            bg: "bg-purple-50",
          },
          {
            label: "Mis nóminas",
            description: "Descarga tus recibos de pago",
            href: "/payroll",
            icon: DollarSign,
            color: "text-green-600",
            bg: "bg-green-50",
          },
          {
            label: "OmarIA",
            description: "Consultas de RRHH con inteligencia artificial",
            href: "/ai-agent",
            icon: MessageSquare,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <a key={item.href} href={item.href}>
              <Card className="border-slate-200 hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer h-full">
                <CardContent className="pt-6">
                  <div className={`rounded-lg p-2 w-fit ${item.bg} mb-3`}>
                    <Icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <h3 className="font-semibold text-slate-900">{item.label}</h3>
                  <p className="text-sm text-slate-500 mt-1">{item.description}</p>
                </CardContent>
              </Card>
            </a>
          );
        })}
      </div>
    </div>
  );
}
