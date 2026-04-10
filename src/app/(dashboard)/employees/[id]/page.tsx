"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import Link from "next/link";
import {
  Edit, ArrowLeft, Camera, FileText, DollarSign, Users, Info,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  personalEmail: string | null;
  corporateEmail: string | null;
  phone: string | null;
  birthDate: string | null;
  hireDate: string;
  endDate: string | null;
  contractType: string;
  status: string;
  salary: number | null;
  address: string | null;
  city: string | null;
  bloodType: string | null;
  notes: string | null;
  avatarUrl: string | null;
  role: string;
  department: { id: string; name: string };
  position: { id: string; title: string };
  manager: { id: string; firstName: string; lastName: string } | null;
  subordinates: { id: string; firstName: string; lastName: string; employeeCode: string }[];
  documents: { id: string; title: string; type: string; createdAt: string }[];
  payrollRecords: { id: string; period: string; netSalary: number; status: string }[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CONTRACT_LABELS: Record<string, string> = {
  INDEFINITE: "Indefinido",
  FIXED_TERM: "Plazo fijo",
  PART_TIME: "Medio tiempo",
  FREELANCE: "Freelance",
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:     "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  INACTIVE:   "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  ON_LEAVE:   "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  TERMINATED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  ON_LEAVE: "En permiso",
  TERMINATED: "Terminado",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

function colorFromString(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360} 55% 48%)`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch(`/api/employees/${id}`)
      .then((r) => {
        if (r.status === 404) router.replace("/employees");
        return r.json();
      })
      .then(setEmployee)
      .catch(() => toast.error("Error al cargar el empleado"))
      .finally(() => setLoading(false));
  }, [id, router]);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const form = new FormData();
    form.append("file", file);

    const res = await fetch(`/api/employees/${id}/avatar`, {
      method: "POST",
      body: form,
    });

    if (res.ok) {
      const { avatarUrl } = await res.json();
      setEmployee((prev) => prev ? { ...prev, avatarUrl } : prev);
      toast.success("Foto actualizada");
    } else {
      const { error } = await res.json();
      toast.error(error ?? "Error al subir la imagen");
    }
    setUploading(false);
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="h-32 bg-muted rounded-xl" />
        <div className="h-64 bg-muted rounded-xl" />
      </div>
    );
  }

  if (!employee) return null;

  const avatarBg = colorFromString(employee.id);
  const initials = getInitials(employee.firstName, employee.lastName);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back link */}
      <Link
        href="/employees"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Colaboradores
      </Link>

      {/* Header card */}
      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div
                className="h-20 w-20 rounded-full overflow-hidden flex items-center justify-center text-white text-2xl font-bold"
                style={{ background: employee.avatarUrl ? "transparent" : avatarBg }}
              >
                {employee.avatarUrl ? (
                  <img
                    src={employee.avatarUrl}
                    alt={`${employee.firstName} ${employee.lastName}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white shadow hover:bg-blue-700 disabled:opacity-50"
                title="Cambiar foto"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {employee.firstName} {employee.lastName}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {employee.position.title} · {employee.department.name}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      {employee.employeeCode}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[employee.status] ?? ""}`}>
                      {STATUS_LABELS[employee.status] ?? employee.status}
                    </span>
                  </div>
                </div>
                <Link href={`/employees/${employee.id}/edit`}>
                  <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700">
                    <Edit className="h-4 w-4" />
                    Editar
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="info">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="info" className="gap-1.5">
            <Info className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Info general</span>
            <span className="sm:hidden">Info</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-1.5">
            <Users className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Equipo</span>
            <span className="sm:hidden">Equipo</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Documentos</span>
            <span className="sm:hidden">Docs</span>
          </TabsTrigger>
          <TabsTrigger value="payroll" className="gap-1.5">
            <DollarSign className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Nóminas</span>
            <span className="sm:hidden">Nómina</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Info general */}
        <TabsContent value="info" className="mt-4 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-muted-foreground">Datos personales</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                {[
                  { label: "Correo corporativo", value: employee.corporateEmail ?? employee.email },
                  { label: "Correo personal", value: employee.personalEmail ?? "—" },
                  { label: "Teléfono", value: employee.phone ?? "—" },
                  { label: "Fecha de nacimiento", value: employee.birthDate ? new Date(employee.birthDate).toLocaleDateString("es-EC") : "—" },
                  { label: "Tipo de sangre", value: employee.bloodType ?? "—" },
                  { label: "Dirección", value: employee.address ?? "—" },
                  { label: "Ciudad", value: employee.city ?? "—" },
                ].map((item) => (
                  <div key={item.label} className="flex items-start justify-between gap-4">
                    <dt className="text-xs text-muted-foreground shrink-0">{item.label}</dt>
                    <dd className="text-sm font-medium text-right">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-muted-foreground">Datos laborales</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                {[
                  { label: "Fecha de ingreso", value: new Date(employee.hireDate).toLocaleDateString("es-EC") },
                  { label: "Tipo de contrato", value: CONTRACT_LABELS[employee.contractType] ?? employee.contractType },
                  { label: "Salario", value: employee.salary ? `$${Number(employee.salary).toLocaleString("es-EC", { minimumFractionDigits: 2 })}` : "—" },
                  { label: "Jefe directo", value: employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : "—" },
                  { label: "Fecha de salida", value: employee.endDate ? new Date(employee.endDate).toLocaleDateString("es-EC") : "—" },
                ].map((item) => (
                  <div key={item.label} className="flex items-start justify-between gap-4">
                    <dt className="text-xs text-muted-foreground shrink-0">{item.label}</dt>
                    <dd className="text-sm font-medium text-right">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          {employee.notes && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-muted-foreground">Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{employee.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Equipo */}
        <TabsContent value="team" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Subordinados ({employee.subordinates.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {employee.subordinates.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin subordinados directos.</p>
              ) : (
                <ul className="space-y-2">
                  {employee.subordinates.map((sub) => (
                    <li key={sub.id}>
                      <Link
                        href={`/employees/${sub.id}`}
                        className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted transition-colors"
                      >
                        <span className="text-sm font-medium">{sub.firstName} {sub.lastName}</span>
                        <span className="text-xs text-muted-foreground font-mono">{sub.employeeCode}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Documentos */}
        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-muted-foreground">Documentos</CardTitle>
            </CardHeader>
            <CardContent>
              {employee.documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin documentos asociados.</p>
              ) : (
                <ul className="space-y-2">
                  {employee.documents.map((doc) => (
                    <li key={doc.id} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted">
                      <span className="text-sm font-medium">{doc.title}</span>
                      <span className="text-xs text-muted-foreground">{doc.type}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Nóminas */}
        <TabsContent value="payroll" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-muted-foreground">Nóminas recientes</CardTitle>
            </CardHeader>
            <CardContent>
              {employee.payrollRecords.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin registros de nómina.</p>
              ) : (
                <ul className="space-y-2">
                  {employee.payrollRecords.map((rec) => (
                    <li key={rec.id} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted">
                      <span className="text-sm font-medium">{rec.period}</span>
                      <span className="text-sm font-mono">
                        ${Number(rec.netSalary).toLocaleString("es-EC", { minimumFractionDigits: 2 })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
