import { EmployeeList } from "@/components/employees/EmployeeList";

export default function EmployeesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Empleados</h1>
        <p className="text-sm text-slate-500 mt-1">
          Gestión del personal de SG Consulting Group
        </p>
      </div>
      <EmployeeList />
    </div>
  );
}
