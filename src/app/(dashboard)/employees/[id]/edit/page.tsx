import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma/client";
import { EmployeeForm } from "@/components/employees/EmployeeForm";

async function getEmployee(id: string) {
  try {
    return await prisma.employee.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        birthDate: true,
        hireDate: true,
        endDate: true,
        contractType: true,
        status: true,
        salary: true,
        departmentId: true,
        positionId: true,
        managerId: true,
        address: true,
        city: true,
        notes: true,
      },
    });
  } catch {
    return null;
  }
}

export default async function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const employee = await getEmployee(id);

  if (!employee) notFound();

  // Convertir a strings para el formulario
  const initialData = {
    id: employee.id,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    phone: employee.phone ?? undefined,
    birthDate: employee.birthDate
      ? new Date(employee.birthDate).toISOString().split("T")[0]
      : undefined,
    hireDate: new Date(employee.hireDate).toISOString().split("T")[0],
    contractType: employee.contractType as never,
    status: employee.status as never,
    salary: employee.salary ? String(employee.salary) : undefined,
    departmentId: employee.departmentId,
    positionId: employee.positionId,
    managerId: employee.managerId ?? undefined,
    address: employee.address ?? undefined,
    city: employee.city ?? undefined,
    notes: employee.notes ?? undefined,
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          href={`/employees/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Ver empleado
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Editar empleado</h1>
        <p className="text-sm text-slate-500 mt-1">
          {employee.firstName} {employee.lastName}
        </p>
      </div>
      <EmployeeForm mode="edit" initialData={initialData} />
    </div>
  );
}
