"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Building2, User, Briefcase, ShieldCheck, ChevronRight, KeyRound } from "lucide-react";
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

// ── Schema ────────────────────────────────────────────────────────────────────

const employeeSchema = z.object({
  firstName: z.string().min(1, "Requerido"),
  lastName: z.string().min(1, "Requerido"),
  email: z.string().email("Correo inválido"),
  personalEmail: z.string().email("Correo inválido").optional().or(z.literal("")),
  corporateEmail: z.string().email("Correo inválido").optional().or(z.literal("")),
  bloodType: z.string().optional(),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  hireDate: z.string().min(1, "Requerido"),
  contractType: z.enum(["INDEFINITE", "FIXED_TERM", "PART_TIME", "FREELANCE"]),
  status: z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE", "TERMINATED"]),
  salary: z.string().optional(),
  companyId: z.string().min(1, "Requerido"),
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

// ── Types ─────────────────────────────────────────────────────────────────────

interface Company { id: string; name: string; primaryColor: string }
interface Department { id: string; name: string; companyId: string | null }
interface Position { id: string; title: string; departmentId: string }
interface EmployeeOption { id: string; firstName: string; lastName: string }

interface EmployeeFormProps {
  initialData?: Partial<FormData & { id: string }>;
  mode: "create" | "edit";
}

// ── Constants ─────────────────────────────────────────────────────────────────

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

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// ── Phone formatter ───────────────────────────────────────────────────────────

function formatEcuadorPhone(input: string): string {
  const allDigits = input.replace(/\D/g, "");
  let local = allDigits;
  if (local.startsWith("593")) local = local.slice(3);
  else if (local.startsWith("0")) local = local.slice(1);
  local = local.slice(0, 9);
  if (local.length === 0) return "";
  let result = "+593 " + local.slice(0, 2);
  if (local.length > 2) result += " " + local.slice(2, 5);
  if (local.length > 5) result += " " + local.slice(5);
  return result;
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-4 border-b border-border/60">
        <CardTitle className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600/10">
            <Icon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-5">{children}</CardContent>
    </Card>
  );
}

// ── Field wrapper ─────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  error,
  children,
  hint,
  className,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5${className ? ` ${className}` : ""}`}>
      <Label className="text-xs font-medium text-foreground/80">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EmployeeForm({ initialData, mode }: EmployeeFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [managers, setManagers] = useState<EmployeeOption[]>([]);
  const [createAccount, setCreateAccount] = useState(false);
  const [resetSending, setResetSending] = useState(false);

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

  const selectedCompany = watch("companyId");
  const selectedDepartment = watch("departmentId");
  const phoneValue = watch("phone") ?? "";

  // Load companies + managers once
  useEffect(() => {
    fetch("/api/companies")
      .then((r) => r.json())
      .then((data: Company[]) => setCompanies(data))
      .catch(() => {});

    fetch("/api/employees")
      .then((r) => r.json())
      .then((data: EmployeeOption[]) => setManagers(data))
      .catch(() => {});
  }, []);

  // Load departments when company changes
  const loadDepartments = useCallback(async (companyId: string) => {
    const res = await fetch(`/api/departments?companyId=${companyId}`);
    if (res.ok) {
      const data: Department[] = await res.json();
      setDepartments(data);
    }
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      loadDepartments(selectedCompany);
      setValue("departmentId", "");
      setValue("positionId", "");
      setPositions([]);
    }
  }, [selectedCompany, loadDepartments, setValue]);

  // Load positions when department changes
  useEffect(() => {
    if (selectedDepartment) {
      fetch(`/api/positions?departmentId=${selectedDepartment}`)
        .then((r) => r.json())
        .then((data: Position[]) => setPositions(data))
        .catch(() => setPositions([]));
    }
  }, [selectedDepartment]);

  // Submit
  async function onSubmit(data: FormData) {
    setLoading(true);
    const { companyId: _companyId, ...rest } = data;

    const payload = {
      ...rest,
      salary: rest.salary ? parseFloat(rest.salary) : undefined,
      managerId: rest.managerId || undefined,
      personalEmail: rest.personalEmail || undefined,
      corporateEmail: rest.corporateEmail || undefined,
      bloodType: rest.bloodType || undefined,
      createAccount,
    };

    const url = mode === "edit" && initialData?.id
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
      toast.error(result.error ?? "Error al guardar el colaborador");
      setLoading(false);
      return;
    }

    toast.success(mode === "create" ? "Colaborador creado correctamente" : "Cambios guardados");
    router.push("/employees");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

      {/* ── 1. DATOS PERSONALES ────────────────────────────────────────────── */}
      <Section icon={User} title="Datos personales">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombres" required error={errors.firstName?.message}>
            <Input placeholder="Juan Andrés" {...register("firstName")} className="cursor-text" />
          </Field>
          <Field label="Apellidos" required error={errors.lastName?.message}>
            <Input placeholder="Pérez López" {...register("lastName")} className="cursor-text" />
          </Field>

          <Field label="WhatsApp">
            <Input
              placeholder="+593 99 651 7455"
              value={phoneValue}
              onChange={(e) => setValue("phone", formatEcuadorPhone(e.target.value))}
              className="cursor-text font-mono text-sm"
            />
          </Field>

          <Field label="Fecha de nacimiento">
            <Input type="date" {...register("birthDate")} className="cursor-pointer" />
          </Field>

          <Field label="Tipo de sangre">
            <Select
              defaultValue={initialData?.bloodType ?? ""}
              onValueChange={(v) => setValue("bloodType", v)}
            >
              <SelectTrigger className="cursor-pointer">
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="cursor-pointer">No especificado</SelectItem>
                {BLOOD_TYPES.map((bt) => (
                  <SelectItem key={bt} value={bt} className="cursor-pointer">{bt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Ciudad de Residencia">
            <Input placeholder="Quito" {...register("city")} className="cursor-text" />
          </Field>

          <Field label="Dirección de Residencia" className="sm:col-span-2">
            <Input placeholder="Av. República del El Salvador N36-183..." {...register("address")} className="cursor-text" />
          </Field>
        </div>
      </Section>

      {/* ── 2. CONTACTO ───────────────────────────────────────────────────── */}
      <Section icon={ShieldCheck} title="Correos electrónicos">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Email corporativo (acceso)"
            required
            error={errors.email?.message}
            hint="Este email es el usuario de login"
          >
            <Input
              type="email"
              placeholder="jperez@sgconsultinggroup.com"
              {...register("email")}
              className="cursor-text"
            />
          </Field>

          <Field label="Email personal" error={errors.personalEmail?.message}>
            <Input
              type="email"
              placeholder="juanperez@gmail.com"
              {...register("personalEmail")}
              className="cursor-text"
            />
          </Field>
        </div>
      </Section>

      {/* ── 3. DATOS LABORALES ────────────────────────────────────────────── */}
      <Section icon={Briefcase} title="Datos laborales">
        <div className="grid gap-4 sm:grid-cols-2">

          {/* Empresa — selector que controla los departamentos */}
          <Field label="Empresa" required error={errors.companyId?.message}>
            <Select
              defaultValue={initialData?.companyId ?? ""}
              onValueChange={(v) => setValue("companyId", v)}
            >
              <SelectTrigger className="cursor-pointer">
                <SelectValue placeholder="Seleccionar empresa..." />
              </SelectTrigger>
              <SelectContent>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="cursor-pointer">
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: c.primaryColor }}
                      />
                      {c.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Departamento */}
          <Field label="Área / Departamento" required error={errors.departmentId?.message}>
            <Select
              value={watch("departmentId") ?? ""}
              onValueChange={(v) => { setValue("departmentId", v); setValue("positionId", ""); }}
              disabled={!selectedCompany}
            >
              <SelectTrigger className={selectedCompany ? "cursor-pointer" : "cursor-not-allowed opacity-60"}>
                <SelectValue placeholder={selectedCompany ? "Seleccionar área..." : "Selecciona empresa primero"} />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id} className="cursor-pointer">{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Cargo */}
          <Field label="Cargo" required error={errors.positionId?.message}>
            <Select
              value={watch("positionId") ?? ""}
              onValueChange={(v) => setValue("positionId", v)}
              disabled={!selectedDepartment}
            >
              <SelectTrigger className={selectedDepartment ? "cursor-pointer" : "cursor-not-allowed opacity-60"}>
                <SelectValue placeholder={selectedDepartment ? "Seleccionar cargo..." : "Selecciona área primero"} />
              </SelectTrigger>
              <SelectContent>
                {positions.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="cursor-pointer">{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Jefe directo */}
          <Field label="Jefe directo">
            <Select
              defaultValue={initialData?.managerId ?? "none"}
              onValueChange={(v) => setValue("managerId", v === "none" ? undefined : v)}
            >
              <SelectTrigger className="cursor-pointer">
                <SelectValue placeholder="Sin jefe directo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="cursor-pointer">Sin jefe directo</SelectItem>
                {managers.map((m) => (
                  <SelectItem key={m.id} value={m.id} className="cursor-pointer">
                    {m.firstName} {m.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Fecha de ingreso */}
          <Field label="Fecha de ingreso" required error={errors.hireDate?.message}>
            <Input type="date" {...register("hireDate")} className="cursor-pointer" />
          </Field>

          {/* Salario */}
          <Field label="Salario mensual (USD)">
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="1.200,00"
              {...register("salary")}
              className="cursor-text"
            />
          </Field>

          {/* Tipo de contrato */}
          <Field label="Tipo de contrato" required>
            <Select
              defaultValue={initialData?.contractType ?? "INDEFINITE"}
              onValueChange={(v) => setValue("contractType", v as never)}
            >
              <SelectTrigger className="cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CONTRACT_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k} className="cursor-pointer">{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Estado */}
          <Field label="Estado" required>
            <Select
              defaultValue={initialData?.status ?? "ACTIVE"}
              onValueChange={(v) => setValue("status", v as never)}
            >
              <SelectTrigger className="cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k} className="cursor-pointer">{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Notas */}
          <Field label="Notas / Observaciones" className="sm:col-span-2">
            <Textarea
              rows={3}
              placeholder="Información adicional relevante..."
              {...register("notes")}
              className="cursor-text resize-none"
            />
          </Field>
        </div>
      </Section>

      {/* ── 4. CUENTA DE ACCESO (solo creación) ───────────────────────────── */}
      {mode === "create" && (
        <Section icon={ShieldCheck} title="Cuenta de acceso al sistema">
          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                id="createAccount"
                checked={createAccount}
                onChange={(e) => {
                  setCreateAccount(e.target.checked);
                  setValue("createAccount", e.target.checked);
                }}
                className="mt-0.5 h-4 w-4 rounded border-border text-blue-600 cursor-pointer"
              />
              <div>
                <span className="text-sm font-medium text-foreground group-hover:text-blue-600 transition-colors">
                  Crear cuenta de acceso
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  El colaborador podrá iniciar sesión con el <strong>email del sistema</strong> y la contraseña temporal que definas aquí.
                </p>
              </div>
            </label>

            {createAccount && (
              <div className="rounded-lg border border-blue-200 bg-blue-50/50 dark:bg-blue-900/10 dark:border-blue-900/40 p-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2 flex items-center gap-2 text-xs text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20 rounded-md px-3 py-2">
                  <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                  El <strong>usuario</strong> de login será el email del sistema indicado arriba.
                </div>
                <Field label="Contraseña temporal" hint="El colaborador podrá cambiarla al ingresar">
                  <Input
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    {...register("password")}
                    className="cursor-text"
                  />
                </Field>
                <Field label="Rol en el sistema">
                  <Select
                    defaultValue="EMPLOYEE"
                    onValueChange={(v) => setValue("role", v as "ADMIN" | "EMPLOYEE")}
                  >
                    <SelectTrigger className="cursor-pointer">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMPLOYEE" className="cursor-pointer">Colaborador</SelectItem>
                      <SelectItem value="ADMIN" className="cursor-pointer">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ── 5. GESTIÓN DE CUENTA (solo edición) ───────────────────────────── */}
      {mode === "edit" && (
        <Section icon={KeyRound} title="Gestión de cuenta">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Envía un correo de restablecimiento de contraseña al colaborador. Recibirá un enlace para crear una nueva contraseña.
            </p>
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              disabled={resetSending}
              onClick={async () => {
                const email = initialData?.email;
                if (!email) { toast.error("No hay email registrado para este empleado"); return; }
                setResetSending(true);
                try {
                  const res = await fetch(`/api/employees/${initialData?.id}/reset-password`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || "Error al enviar");
                  toast.success(`Correo de restablecimiento enviado a ${email}`);
                } catch (err: any) {
                  toast.error(err.message);
                } finally {
                  setResetSending(false);
                }
              }}
            >
              <KeyRound className="h-4 w-4" />
              {resetSending ? "Enviando..." : "Enviar correo de restablecimiento"}
            </Button>
          </div>
        </Section>
      )}

      {/* ── Actions ───────────────────────────────────────────────────────── */}
      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/employees")}
          className="cursor-pointer"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 cursor-pointer min-w-[140px]"
        >
          {loading
            ? "Guardando..."
            : mode === "create"
            ? "Crear colaborador"
            : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
