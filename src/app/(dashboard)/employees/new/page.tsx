import { EmployeeForm } from "@/components/employees/EmployeeForm";

export default function NewEmployeePage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Nuevo empleado</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Completa los datos para registrar un nuevo empleado
        </p>
      </div>
      <EmployeeForm mode="create" />
    </div>
  );
}
