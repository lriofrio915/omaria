import { notFound } from "next/navigation";
import Link from "next/link";
import { Edit, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma/client";

async function getEmployee(id: string) {
  try {
    return await prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        position: true,
        manager: { select: { id: true, firstName: true, lastName: true } },
        subordinates: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
        documents: { select: { id: true, title: true, type: true, createdAt: true }, take: 5 },
        payrollRecords: {
          select: { id: true, period: true, netSalary: true, status: true },
          orderBy: { period: "desc" },
          take: 5,
        },
      },
    });
  } catch {
    return null;
  }
}

const CONTRACT_LABELS: Record<string, string> = {
  INDEFINITE: "Indefinido",
  FIXED_TERM: "Plazo fijo",
  PART_TIME: "Medio tiempo",
  FREELANCE: "Freelance",
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:     "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  INACTIVE:   "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  ON_LEAVE:   "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  TERMINATED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  ON_LEAVE: "En permiso",
  TERMINATED: "Terminado",
};

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const employee = await getEmployee(id);

  if (!employee) notFound();

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/employees"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Empleados
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {employee.firstName} {employee.lastName}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-slate-500 dark:text-slate-400">{employee.position.title}</span>
            <span className="text-slate-400 dark:text-slate-600">·</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">{employee.department.name}</span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[employee.status] ?? ""}`}
            >
              {STATUS_LABELS[employee.status] ?? employee.status}
            </span>
          </div>
        </div>
        <Link href={`/employees/${employee.id}/edit`}>
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Edit className="h-4 w-4" />
            Editar
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Datos personales */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Datos personales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              {[
                { label: "Código", value: employee.employeeCode },
                { label: "Correo", value: employee.email },
                { label: "Teléfono", value: employee.phone ?? "—" },
                {
                  label: "Fecha de nacimiento",
                  value: employee.birthDate
                    ? new Date(employee.birthDate).toLocaleDateString("es-EC")
                    : "—",
                },
                { label: "Dirección", value: employee.address ?? "—" },
                { label: "Ciudad", value: employee.city ?? "—" },
              ].map((item) => (
                <div key={item.label} className="flex justify-between">
                  <dt className="text-xs text-slate-500 dark:text-slate-400">{item.label}</dt>
                  <dd className="text-sm text-slate-900 dark:text-slate-100 font-medium">{item.value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        {/* Datos laborales */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Datos laborales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              {[
                {
                  label: "Fecha de ingreso",
                  value: new Date(employee.hireDate).toLocaleDateString("es-EC"),
                },
                {
                  label: "Tipo de contrato",
                  value: CONTRACT_LABELS[employee.contractType] ?? employee.contractType,
                },
                {
                  label: "Salario",
                  value: employee.salary
                    ? `$${Number(employee.salary).toLocaleString("es-EC", { minimumFractionDigits: 2 })}`
                    : "—",
                },
                {
                  label: "Jefe directo",
                  value: employee.manager
                    ? `${employee.manager.firstName} ${employee.manager.lastName}`
                    : "—",
                },
              ].map((item) => (
                <div key={item.label} className="flex justify-between">
                  <dt className="text-xs text-slate-500 dark:text-slate-400">{item.label}</dt>
                  <dd className="text-sm text-slate-900 dark:text-slate-100 font-medium">{item.value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        {/* Subordinados */}
        {employee.subordinates.length > 0 && (
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Subordinados ({employee.subordinates.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {employee.subordinates.map((sub) => (
                  <li key={sub.id}>
                    <Link
                      href={`/employees/${sub.id}`}
                      className="flex items-center justify-between hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      <span className="text-sm text-slate-900 dark:text-slate-100">
                        {sub.firstName} {sub.lastName}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {sub.employeeCode}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Documentos recientes */}
        {employee.documents.length > 0 && (
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Documentos recientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {employee.documents.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between">
                    <span className="text-sm text-slate-900 dark:text-slate-100">{doc.title}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{doc.type}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {employee.notes && (
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 dark:text-slate-300">{employee.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
