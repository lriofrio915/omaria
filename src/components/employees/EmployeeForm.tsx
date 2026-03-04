"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const employeeSchema = z.object({
  firstName: z.string().min(1, "Requerido"),
  lastName: z.string().min(1, "Requerido"),
  email: z.string().email("Correo inválido"),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  hireDate: z.string().min(1, "Requerido"),
  contractType: z.enum(["INDEFINITE", "FIXED_TERM", "PART_TIME", "FREELANCE"]),
  status: z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE", "TERMINATED"]),
  salary: z.string().optional(),
  departmentId: z.string().min(1, "Requerido"),
  positionId: z.string().min(1, "Requerido"),
  managerId: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  notes: z.string().optional(),
  createAccount: z.boolean().optional(),
  password: z.string().optional(),
  role: z.enum(["ADMIN", "EMPLOYEE"]).optional(),
});

type FormData = z.infer<typeof employeeSchema>;

interface Department { id: string; name: string }
interface Position { id: string; title: string; departmentId: string }
interface Employee { id: string; firstName: string; lastName: string }

interface EmployeeFormProps {
  initialData?: Partial<FormData & { id: string }>;
  mode: "create" | "edit";
}

const CONTRACT_LABELS: Record<string, string> = {
  INDEFINITE: "Indefinido",
  FIXED_TERM: "Plazo fijo",
  PART_TIME: "Medio tiempo",
  FREELANCE: "Freelance",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  ON_LEAVE: "En permiso",
  TERMINATED: "Terminado",
};

export function EmployeeForm({ initialData, mode }: EmployeeFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [managers, setManagers] = useState<Employee[]>([]);
  const [createAccount, setCreateAccount] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      status: "ACTIVE",
      contractType: "INDEFINITE",
      role: "EMPLOYEE",
      createAccount: false,
      ...initialData,
    },
  });

  const selectedDepartment = watch("departmentId");

  useEffect(() => {
    fetch("/api/departments")
      .then((r) => r.json())
      .then(setDepartments);
    fetch("/api/employees")
      .then((r) => r.json())
      .then((data: Employee[]) => setManagers(data));
  }, []);

  useEffect(() => {
    if (selectedDepartment) {
      fetch(`/api/positions?departmentId=${selectedDepartment}`)
        .then((r) => r.json())
        .then(setPositions);
    }
  }, [selectedDepartment]);

  async function onSubmit(data: FormData) {
    setLoading(true);

    const payload = {
      ...data,
      salary: data.salary ? parseFloat(data.salary) : undefined,
      managerId: data.managerId || undefined,
      createAccount,
    };

    const url =
      mode === "edit" && initialData?.id
        ? `/api/employees/${initialData.id}`
        : "/api/employees";
    const method = mode === "edit" ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await res.json();

    if (!res.ok) {
      toast.error(result.error ?? "Error al guardar el empleado");
      setLoading(false);
      return;
    }

    toast.success(
      mode === "create" ? "Empleado creado correctamente" : "Empleado actualizado"
    );
    router.push("/employees");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Datos personales */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base text-slate-900">Datos personales</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Nombre *</Label>
            <Input placeholder="Juan" {...register("firstName")} />
            {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Apellido *</Label>
            <Input placeholder="Pérez" {...register("lastName")} />
            {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Correo electrónico *</Label>
            <Input type="email" placeholder="juan@sgconsulting.com" {...register("email")} />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Teléfono</Label>
            <Input placeholder="+593 9..." {...register("phone")} />
          </div>
          <div className="space-y-1.5">
            <Label>Fecha de nacimiento</Label>
            <Input type="date" {...register("birthDate")} />
          </div>
          <div className="space-y-1.5">
            <Label>Ciudad</Label>
            <Input placeholder="Quito" {...register("city")} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Dirección</Label>
            <Input placeholder="Av. Amazonas..." {...register("address")} />
          </div>
        </CardContent>
      </Card>

      {/* Datos laborales */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base text-slate-900">Datos laborales</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Fecha de ingreso *</Label>
            <Input type="date" {...register("hireDate")} />
            {errors.hireDate && <p className="text-xs text-red-500">{errors.hireDate.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Salario (USD)</Label>
            <Input type="number" step="0.01" placeholder="1200.00" {...register("salary")} />
          </div>
          <div className="space-y-1.5">
            <Label>Tipo de contrato *</Label>
            <Select
              defaultValue={initialData?.contractType ?? "INDEFINITE"}
              onValueChange={(v) => setValue("contractType", v as never)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(CONTRACT_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Estado *</Label>
            <Select
              defaultValue={initialData?.status ?? "ACTIVE"}
              onValueChange={(v) => setValue("status", v as never)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Departamento *</Label>
            <Select
              defaultValue={initialData?.departmentId}
              onValueChange={(v) => { setValue("departmentId", v); setValue("positionId", ""); }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.departmentId && <p className="text-xs text-red-500">{errors.departmentId.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Cargo *</Label>
            <Select
              defaultValue={initialData?.positionId}
              onValueChange={(v) => setValue("positionId", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar departamento primero..." />
              </SelectTrigger>
              <SelectContent>
                {positions.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.positionId && <p className="text-xs text-red-500">{errors.positionId.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Jefe directo</Label>
            <Select
              defaultValue={initialData?.managerId ?? "none"}
              onValueChange={(v) => setValue("managerId", v === "none" ? undefined : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin jefe directo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin jefe directo</SelectItem>
                {managers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.firstName} {m.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Notas</Label>
            <Textarea rows={3} placeholder="Observaciones adicionales..." {...register("notes")} />
          </div>
        </CardContent>
      </Card>

      {/* Cuenta de acceso (solo en creación) */}
      {mode === "create" && (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base text-slate-900">Cuenta de acceso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="createAccount"
                checked={createAccount}
                onChange={(e) => {
                  setCreateAccount(e.target.checked);
                  setValue("createAccount", e.target.checked);
                }}
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              <Label htmlFor="createAccount" className="cursor-pointer">
                Crear cuenta de acceso para este empleado
              </Label>
            </div>
            {createAccount && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Contraseña temporal *</Label>
                  <Input type="password" placeholder="••••••••" {...register("password")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Rol *</Label>
                  <Select
                    defaultValue="EMPLOYEE"
                    onValueChange={(v) => setValue("role", v as "ADMIN" | "EMPLOYEE")}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMPLOYEE">Empleado</SelectItem>
                      <SelectItem value="ADMIN">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/employees")}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
          {loading
            ? "Guardando..."
            : mode === "create"
            ? "Crear empleado"
            : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
