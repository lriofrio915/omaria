import { Users } from "lucide-react";
import { EmployeeList } from "@/components/employees/EmployeeList";
import { prisma } from "@/lib/prisma/client";

async function getStats() {
  try {
    const [total, active] = await Promise.all([
      prisma.employee.count(),
      prisma.employee.count({ where: { status: "ACTIVE" } }),
    ]);
    return { total, active };
  } catch {
    return { total: 0, active: 0 };
  }
}

export default async function EmployeesPage() {
  const stats = await getStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/10">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Colaboradores</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-[42px]">
            Directorio del personal — SG Consulting Group
          </p>
        </div>
        <div className="flex items-center gap-4 ml-[42px] sm:ml-0">
          <div className="text-right">
            <p className="text-2xl font-bold text-foreground tabular-nums">{stats.total}</p>
            <p className="text-xs text-muted-foreground">total</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-right">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{stats.active}</p>
            <p className="text-xs text-muted-foreground">activos</p>
          </div>
        </div>
      </div>

      <EmployeeList />
    </div>
  );
}
