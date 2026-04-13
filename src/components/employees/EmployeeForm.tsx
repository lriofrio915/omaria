"use client";

import { useEffect, useState } from "react";
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
  companyName: z.string().min(1, "Requerido"),
  positionTitle: z.string().min(1, "Requerido"),
  departmentName: z.string().min(1, "Requerido"),
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

// ── EMPRESA_DATA ──────────────────────────────────────────────────────────────

const EMPRESA_DATA: Record<string, { cargos: string[]; areas: string[] }> = {
  "SG - FINTECH": {
    cargos: [
      "Gerente General",
      "Gerente Comercial",
      "Gerente de Operaciones",
      "Gerente de Tecnología",
      "Gerente de Riesgos",
      "Gerente de Cumplimiento",
      "Gerente de Producto",
      "Gerente de Marketing",
      "Gerente de Recursos Humanos",
      "Gerente de Finanzas",
      "Director de Ventas",
      "Director de Tecnología",
      "Director de Operaciones",
      "Director de Marketing",
      "Director de Riesgos",
      "Jefe de Desarrollo de Software",
      "Jefe de Infraestructura",
      "Jefe de Seguridad Informática",
      "Jefe de Soporte Técnico",
      "Jefe de Operaciones",
      "Jefe de Cumplimiento",
      "Jefe de Ventas",
      "Jefe de Atención al Cliente",
      "Jefe de Producto",
      "Jefe de Análisis de Datos",
      "Analista de Sistemas",
      "Analista de Datos",
      "Analista de Riesgos",
      "Analista de Cumplimiento",
      "Analista Financiero",
      "Analista de Marketing",
      "Analista de Operaciones",
      "Analista de Seguridad",
      "Desarrollador Backend",
      "Desarrollador Frontend",
      "Desarrollador Full Stack",
      "Desarrollador Mobile",
      "Desarrollador de Software",
      "Ingeniero de Datos",
      "Ingeniero DevOps",
      "Ingeniero de Seguridad",
      "Científico de Datos",
      "Arquitecto de Software",
      "Arquitecto de Soluciones",
      "Diseñador UX/UI",
      "Diseñador Gráfico",
      "Especialista en Marketing Digital",
      "Especialista en SEO",
      "Especialista en Redes Sociales",
      "Especialista en Cumplimiento",
      "Especialista en Seguridad",
      "Especialista en Soporte",
      "Coordinador de Proyectos",
      "Coordinador de Operaciones",
      "Coordinador de Ventas",
      "Coordinador de Atención al Cliente",
      "Ejecutivo de Ventas",
      "Ejecutivo de Cuenta",
      "Asesor Comercial",
      "Asesor de Riesgos",
      "Oficial de Cumplimiento",
      "Oficial de Seguridad",
      "Auditor Interno",
      "Contador",
      "Tesorero",
      "Asistente Administrativo",
      "Asistente de Gerencia",
      "Recepcionista",
      "Agente de Soporte",
      "Agente de Ventas",
      "Pasante / Practicante",
    ],
    areas: [
      "Gerencia General",
      "Tecnología e Innovación",
      "Operaciones",
      "Comercial y Ventas",
      "Marketing y Comunicación",
      "Riesgos",
      "Cumplimiento",
      "Producto",
      "Análisis de Datos",
      "Seguridad Informática",
      "Infraestructura",
      "Soporte Técnico",
      "Finanzas y Contabilidad",
      "Recursos Humanos",
      "Atención al Cliente",
      "Auditoría Interna",
      "Legal",
      "Administración",
    ],
  },
  "SG - CONSULTING GROUP": {
    cargos: [
      "Gerente General",
      "Gerente de Consultoría",
      "Gerente de Proyectos",
      "Gerente Comercial",
      "Gerente de Recursos Humanos",
      "Gerente de Finanzas",
      "Director de Consultoría",
      "Director de Proyectos",
      "Director Comercial",
      "Jefe de Proyectos",
      "Jefe de Consultoría",
      "Jefe de Operaciones",
      "Jefe de Ventas",
      "Consultor Senior",
      "Consultor Junior",
      "Consultor de Negocios",
      "Consultor de Procesos",
      "Consultor de Estrategia",
      "Consultor de Tecnología",
      "Consultor de Recursos Humanos",
      "Analista de Proyectos",
      "Analista de Negocios",
      "Analista de Procesos",
      "Analista Financiero",
      "Analista de Datos",
      "Coordinador de Proyectos",
      "Coordinador Administrativo",
      "Ejecutivo de Cuentas",
      "Ejecutivo de Ventas",
      "Asesor Comercial",
      "Especialista en Gestión del Cambio",
      "Especialista en Procesos",
      "Especialista en Calidad",
      "Diseñador de Procesos",
      "Auditor",
      "Contador",
      "Asistente Administrativo",
      "Asistente de Gerencia",
      "Recepcionista",
      "Pasante / Practicante",
    ],
    areas: [
      "Gerencia General",
      "Consultoría",
      "Gestión de Proyectos",
      "Comercial y Ventas",
      "Recursos Humanos",
      "Finanzas y Contabilidad",
      "Operaciones",
      "Calidad y Mejora Continua",
      "Legal",
      "Administración",
      "Marketing",
    ],
  },
  "SG - TECH": {
    cargos: [
      "Gerente General",
      "Gerente de Tecnología",
      "Gerente de Proyectos",
      "Gerente Comercial",
      "Gerente de Operaciones",
      "Director de Tecnología",
      "Director de Proyectos",
      "Jefe de Desarrollo",
      "Jefe de Infraestructura",
      "Jefe de Soporte",
      "Jefe de Proyectos",
      "Arquitecto de Software",
      "Arquitecto de Soluciones",
      "Arquitecto de Nube",
      "Desarrollador Backend",
      "Desarrollador Frontend",
      "Desarrollador Full Stack",
      "Desarrollador Mobile",
      "Ingeniero DevOps",
      "Ingeniero de Datos",
      "Ingeniero de Seguridad",
      "Científico de Datos",
      "Analista de Sistemas",
      "Analista de Datos",
      "Analista de Seguridad",
      "Analista de QA",
      "Tester QA",
      "Diseñador UX/UI",
      "Diseñador Gráfico",
      "Especialista en Cloud",
      "Especialista en Ciberseguridad",
      "Especialista en Big Data",
      "Especialista en Inteligencia Artificial",
      "Coordinador de Proyectos",
      "Scrum Master",
      "Product Owner",
      "Ejecutivo de Ventas Tech",
      "Consultor Técnico",
      "Soporte de TI",
      "Administrador de Sistemas",
      "Administrador de Bases de Datos",
      "Asistente Administrativo",
      "Pasante / Practicante",
    ],
    areas: [
      "Gerencia General",
      "Desarrollo de Software",
      "Infraestructura y Cloud",
      "Ciberseguridad",
      "Datos e Inteligencia Artificial",
      "QA y Testing",
      "Diseño y Experiencia de Usuario",
      "Gestión de Proyectos",
      "Soporte Técnico",
      "Comercial",
      "Administración",
    ],
  },
  "SG - ACADEMY": {
    cargos: [
      "Gerente General",
      "Gerente Académico",
      "Gerente Comercial",
      "Gerente de Operaciones",
      "Director Académico",
      "Director de Programas",
      "Coordinador Académico",
      "Coordinador de Programas",
      "Coordinador Comercial",
      "Docente / Instructor Senior",
      "Docente / Instructor Junior",
      "Facilitador",
      "Tutor",
      "Diseñador Instruccional",
      "Desarrollador de Contenido",
      "Especialista en E-Learning",
      "Analista Académico",
      "Analista de Datos Educativos",
      "Ejecutivo de Ventas",
      "Asesor Académico",
      "Asesor Comercial",
      "Soporte Técnico Educativo",
      "Administrador de Plataformas",
      "Asistente Administrativo",
      "Recepcionista",
      "Pasante / Practicante",
    ],
    areas: [
      "Gerencia General",
      "Dirección Académica",
      "Diseño Curricular",
      "Docencia",
      "Operaciones Académicas",
      "Comercial y Ventas",
      "Tecnología Educativa",
      "Atención al Estudiante",
      "Administración",
    ],
  },
  "SG - LEGAL": {
    cargos: [
      "Gerente General",
      "Socio Director",
      "Socio",
      "Director Legal",
      "Gerente Legal",
      "Abogado Senior",
      "Abogado Junior",
      "Abogado Corporativo",
      "Abogado Tributario",
      "Abogado Laboral",
      "Abogado Civil",
      "Abogado Mercantil",
      "Abogado de Cumplimiento",
      "Especialista en Regulación",
      "Especialista en Cumplimiento",
      "Notario",
      "Paralegal Senior",
      "Paralegal Junior",
      "Investigador Legal",
      "Analista Legal",
      "Coordinador Legal",
      "Asistente Legal",
      "Asistente Administrativo",
      "Recepcionista",
      "Pasante / Practicante",
    ],
    areas: [
      "Gerencia General",
      "Derecho Corporativo",
      "Derecho Tributario",
      "Derecho Laboral",
      "Derecho Civil y Mercantil",
      "Cumplimiento y Regulación",
      "Notaría",
      "Investigación Legal",
      "Administración",
    ],
  },
  "SG - REAL ESTATE": {
    cargos: [
      "Gerente General",
      "Gerente Comercial",
      "Gerente de Proyectos",
      "Gerente de Operaciones",
      "Director Comercial",
      "Director de Proyectos",
      "Jefe de Ventas",
      "Jefe de Proyectos",
      "Jefe de Operaciones",
      "Coordinador de Proyectos",
      "Coordinador Comercial",
      "Coordinador de Obras",
      "Agente Inmobiliario Senior",
      "Agente Inmobiliario Junior",
      "Asesor Comercial",
      "Analista de Mercado",
      "Analista de Proyectos",
      "Analista Financiero",
      "Arquitecto",
      "Ingeniero Civil",
      "Ingeniero de Proyectos",
      "Residente de Obra",
      "Supervisor de Obra",
      "Valuador",
      "Especialista en Marketing Inmobiliario",
      "Community Manager",
      "Diseñador Gráfico",
      "Asistente Administrativo",
      "Recepcionista",
      "Pasante / Practicante",
    ],
    areas: [
      "Gerencia General",
      "Comercial y Ventas",
      "Gestión de Proyectos",
      "Obras y Construcción",
      "Marketing Inmobiliario",
      "Análisis de Mercado",
      "Finanzas",
      "Legal",
      "Administración",
    ],
  },
  "SG - INVESTMENTS": {
    cargos: [
      "Gerente General",
      "Director de Inversiones",
      "Director de Portafolio",
      "Gerente de Inversiones",
      "Gerente de Riesgos",
      "Gerente Comercial",
      "Analista de Inversiones Senior",
      "Analista de Inversiones Junior",
      "Analista de Riesgos",
      "Analista Financiero",
      "Analista de Mercados",
      "Gestor de Portafolio",
      "Especialista en Estructuración",
      "Especialista en Cumplimiento",
      "Asesor de Inversiones",
      "Trader",
      "Economista",
      "Contador",
      "Auditor",
      "Oficial de Cumplimiento",
      "Coordinador de Operaciones",
      "Asistente Administrativo",
      "Pasante / Practicante",
    ],
    areas: [
      "Gerencia General",
      "Inversiones",
      "Gestión de Portafolio",
      "Riesgos",
      "Cumplimiento",
      "Comercial",
      "Finanzas y Contabilidad",
      "Análisis de Mercados",
      "Operaciones",
      "Administración",
    ],
  },
  "SG - HEALTH": {
    cargos: [
      "Gerente General",
      "Director Médico",
      "Gerente de Operaciones",
      "Gerente Comercial",
      "Coordinador Médico",
      "Coordinador de Enfermería",
      "Médico General",
      "Médico Especialista",
      "Médico Ocupacional",
      "Enfermero/a",
      "Auxiliar de Enfermería",
      "Nutricionista",
      "Psicólogo/a",
      "Fisioterapeuta",
      "Odontólogo/a",
      "Tecnólogo Médico",
      "Farmacéutico",
      "Paramédico",
      "Coordinador de Salud Ocupacional",
      "Especialista en Salud Ocupacional",
      "Analista de Salud",
      "Asistente Médico",
      "Recepcionista Médica",
      "Asistente Administrativo",
      "Pasante / Practicante",
    ],
    areas: [
      "Gerencia General",
      "Dirección Médica",
      "Enfermería",
      "Especialidades Médicas",
      "Salud Ocupacional",
      "Nutrición",
      "Psicología",
      "Fisioterapia",
      "Odontología",
      "Farmacia",
      "Operaciones",
      "Comercial",
      "Administración",
    ],
  },
  "SG - AGRO": {
    cargos: [
      "Gerente General",
      "Gerente de Operaciones",
      "Gerente Comercial",
      "Director Agrícola",
      "Director de Producción",
      "Ingeniero Agrónomo",
      "Ingeniero Agroindustrial",
      "Ingeniero de Producción",
      "Jefe de Campo",
      "Jefe de Producción",
      "Jefe de Calidad",
      "Supervisor de Campo",
      "Supervisor de Producción",
      "Técnico Agrícola",
      "Técnico de Campo",
      "Analista de Calidad",
      "Analista de Producción",
      "Especialista en Sostenibilidad",
      "Especialista en Riego",
      "Especialista en Plagas",
      "Coordinador Logístico",
      "Operador de Maquinaria",
      "Trabajador Agrícola",
      "Asistente Administrativo",
      "Pasante / Practicante",
    ],
    areas: [
      "Gerencia General",
      "Producción Agrícola",
      "Agroindustria",
      "Control de Calidad",
      "Campo y Operaciones",
      "Logística",
      "Comercial",
      "Sostenibilidad",
      "Administración",
    ],
  },
};

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

// ── Normalize string (removes \xa0 and extra spaces for pre-selection) ────────

function normalizeStr(s: string): string {
  return s.replace(/\xa0/g, " ").trim();
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
  const [managers, setManagers] = useState<EmployeeOption[]>([]);
  const [createAccount, setCreateAccount] = useState(false);
  const [resetSending, setResetSending] = useState(false);

  // Normalize initialData company name for matching against EMPRESA_DATA keys
  const normalizedInitialCompany = initialData?.companyName
    ? normalizeStr(initialData.companyName)
    : undefined;
  const matchedInitialCompany = normalizedInitialCompany
    ? Object.keys(EMPRESA_DATA).find((k) => normalizeStr(k) === normalizedInitialCompany)
    : undefined;

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
      companyName: matchedInitialCompany ?? initialData?.companyName ?? "",
    },
  });

  const selectedCompany = watch("companyName") ?? "";
  const phoneValue = watch("phone") ?? "";

  const cargos = selectedCompany ? (EMPRESA_DATA[selectedCompany]?.cargos ?? []) : [];
  const areas = selectedCompany ? (EMPRESA_DATA[selectedCompany]?.areas ?? []) : [];

  // Load managers once
  useEffect(() => {
    fetch("/api/employees")
      .then((r) => r.json())
      .then((json) => setManagers(Array.isArray(json) ? json : (json.data ?? [])))
      .catch(() => {});
  }, []);

  // Submit
  async function onSubmit(data: FormData) {
    setLoading(true);

    const payload = {
      ...data,
      salary: data.salary ? parseFloat(data.salary) : undefined,
      managerId: data.managerId || undefined,
      personalEmail: data.personalEmail || undefined,
      corporateEmail: data.corporateEmail || undefined,
      bloodType: data.bloodType || undefined,
      role: data.role ?? "EMPLOYEE",
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

          {/* Empresa */}
          <Field label="Empresa" required error={errors.companyName?.message}>
            <Select
              value={selectedCompany}
              onValueChange={(v) => {
                setValue("companyName", v);
                setValue("positionTitle", "");
                setValue("departmentName", "");
              }}
            >
              <SelectTrigger className="cursor-pointer">
                <SelectValue placeholder="Seleccionar empresa..." />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(EMPRESA_DATA).map((k) => (
                  <SelectItem key={k} value={k} className="cursor-pointer">{k}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Cargo */}
          <Field label="Cargo" required error={errors.positionTitle?.message}>
            <Select
              value={watch("positionTitle") ?? ""}
              onValueChange={(v) => setValue("positionTitle", v)}
              disabled={!selectedCompany}
            >
              <SelectTrigger className={selectedCompany ? "cursor-pointer" : "cursor-not-allowed opacity-60"}>
                <SelectValue placeholder={selectedCompany ? "Seleccionar cargo..." : "Selecciona empresa primero"} />
              </SelectTrigger>
              <SelectContent>
                {cargos.map((c) => (
                  <SelectItem key={c} value={c} className="cursor-pointer">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Área / Departamento */}
          <Field label="Área / Departamento" required error={errors.departmentName?.message}>
            <Select
              value={watch("departmentName") ?? ""}
              onValueChange={(v) => setValue("departmentName", v)}
              disabled={!selectedCompany}
            >
              <SelectTrigger className={selectedCompany ? "cursor-pointer" : "cursor-not-allowed opacity-60"}>
                <SelectValue placeholder={selectedCompany ? "Seleccionar área..." : "Selecciona empresa primero"} />
              </SelectTrigger>
              <SelectContent>
                {areas.map((a) => (
                  <SelectItem key={a} value={a} className="cursor-pointer">{a}</SelectItem>
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
          <div className="space-y-5">

            {/* Selector de rol — siempre visible */}
            <div>
              <p className="text-sm font-medium text-foreground mb-3">
                Rol en el sistema <span className="text-red-500">*</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                    watch("role") !== "ADMIN"
                      ? "border-blue-500 bg-blue-50/60 dark:bg-blue-900/20"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                  onClick={() => setValue("role", "EMPLOYEE")}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
                      <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Colaborador</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        Solo puede ver su perfil, documentos y recibos de nómina propios.
                      </p>
                    </div>
                    {watch("role") !== "ADMIN" && (
                      <div className="h-4 w-4 shrink-0 rounded-full bg-blue-500 flex items-center justify-center mt-0.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-white" />
                      </div>
                    )}
                  </div>
                </div>

                <div
                  className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                    watch("role") === "ADMIN"
                      ? "border-purple-500 bg-purple-50/60 dark:bg-purple-900/20"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                  onClick={() => setValue("role", "ADMIN")}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/40">
                      <ShieldCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Administrador</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        Acceso completo: gestión de empleados, documentos, nóminas y configuración.
                      </p>
                    </div>
                    {watch("role") === "ADMIN" && (
                      <div className="h-4 w-4 shrink-0 rounded-full bg-purple-500 flex items-center justify-center mt-0.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-white" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Crear cuenta de acceso */}
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
              <div className="rounded-lg border border-blue-200 bg-blue-50/50 dark:bg-blue-900/10 dark:border-blue-900/40 p-4 space-y-4">
                <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20 rounded-md px-3 py-2">
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
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ── 5. GESTIÓN DE CUENTA (solo edición) ───────────────────────────── */}
      {mode === "edit" && (
        <Section icon={KeyRound} title="Gestión de cuenta">
          <div className="space-y-5">

            {/* Selector de rol */}
            <div>
              <p className="text-sm font-medium text-foreground mb-3">
                Rol en el sistema <span className="text-red-500">*</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                    watch("role") !== "ADMIN"
                      ? "border-blue-500 bg-blue-50/60 dark:bg-blue-900/20"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                  onClick={() => setValue("role", "EMPLOYEE")}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
                      <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Colaborador</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        Solo puede ver su perfil, documentos y recibos de nómina propios.
                      </p>
                    </div>
                    {watch("role") !== "ADMIN" && (
                      <div className="h-4 w-4 shrink-0 rounded-full bg-blue-500 flex items-center justify-center mt-0.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-white" />
                      </div>
                    )}
                  </div>
                </div>

                <div
                  className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                    watch("role") === "ADMIN"
                      ? "border-purple-500 bg-purple-50/60 dark:bg-purple-900/20"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                  onClick={() => setValue("role", "ADMIN")}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/40">
                      <ShieldCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Administrador</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        Acceso completo: gestión de empleados, documentos, nóminas y configuración.
                      </p>
                    </div>
                    {watch("role") === "ADMIN" && (
                      <div className="h-4 w-4 shrink-0 rounded-full bg-purple-500 flex items-center justify-center mt-0.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-white" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4 space-y-3">
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
