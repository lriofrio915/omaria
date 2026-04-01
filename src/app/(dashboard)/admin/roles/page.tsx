"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, ShieldCheck, User, ExternalLink, X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: { name: string; company: { name: string } | null } | null;
  position: { title: string } | null;
  profile: { publicSlug: string | null } | null;
}

export default function RolesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/roles");
    if (res.ok) setEmployees(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const filtered = employees.filter((e) => {
    const q = search.toLowerCase();
    return (
      e.firstName.toLowerCase().includes(q) ||
      e.lastName.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      e.position?.title.toLowerCase().includes(q) ||
      e.department?.name.toLowerCase().includes(q)
    );
  });

  async function toggleRole(emp: Employee) {
    const newRole = emp.role === "ADMIN" ? "EMPLOYEE" : "ADMIN";
    setUpdating(emp.id);
    const res = await fetch("/api/admin/roles", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId: emp.id, role: newRole }),
    });
    if (res.ok) {
      toast.success(
        newRole === "ADMIN"
          ? `${emp.firstName} ${emp.lastName} ahora es Administrador`
          : `${emp.firstName} ${emp.lastName} ahora es Colaborador`
      );
      setEmployees((prev) =>
        prev.map((e) => (e.id === emp.id ? { ...e, role: newRole } : e))
      );
    } else {
      toast.error("No se pudo actualizar el rol");
    }
    setUpdating(null);
  }

  const admins = filtered.filter((e) => e.role === "ADMIN");
  const employees_ = filtered.filter((e) => e.role !== "ADMIN");

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Gestión de Roles
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Asigna o revoca permisos de Administrador a los colaboradores.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Buscar colaborador..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Administradores */}
          {admins.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-purple-600 dark:text-purple-400 mb-3 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                Administradores ({admins.length})
              </h2>
              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden divide-y divide-border">
                {admins.map((emp) => (
                  <EmployeeRow
                    key={emp.id}
                    emp={emp}
                    onToggle={toggleRole}
                    updating={updating === emp.id}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Colaboradores */}
          {employees_.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                Colaboradores ({employees_.length})
              </h2>
              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden divide-y divide-border">
                {employees_.map((emp) => (
                  <EmployeeRow
                    key={emp.id}
                    emp={emp}
                    onToggle={toggleRole}
                    updating={updating === emp.id}
                  />
                ))}
              </div>
            </section>
          )}

          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-12">
              No se encontraron colaboradores
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function EmployeeRow({
  emp,
  onToggle,
  updating,
}: {
  emp: Employee;
  onToggle: (e: Employee) => void;
  updating: boolean;
}) {
  const isAdmin = emp.role === "ADMIN";
  const profileUrl = emp.profile?.publicSlug
    ? `/p/${emp.profile.publicSlug}`
    : null;

  return (
    <div className="flex items-center gap-4 px-4 py-3">
      {/* Avatar */}
      <div
        className={`h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-white text-xs font-bold ${
          isAdmin ? "bg-purple-500" : "bg-blue-500"
        }`}
      >
        {emp.firstName[0]}{emp.lastName[0]}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground leading-tight">
          {emp.firstName} {emp.lastName}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {emp.position?.title ?? "—"} · {emp.department?.company?.name ?? emp.department?.name ?? "—"}
        </p>
      </div>

      {/* Role badge */}
      <Badge
        variant="outline"
        className={
          isAdmin
            ? "border-purple-300 text-purple-700 bg-purple-50 dark:border-purple-700 dark:text-purple-300 dark:bg-purple-900/20"
            : "border-blue-300 text-blue-700 bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:bg-blue-900/20"
        }
      >
        {isAdmin ? "Administrador" : "Colaborador"}
      </Badge>

      {/* Public profile link */}
      {profileUrl ? (
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-blue-600 flex items-center gap-1 shrink-0"
          title="Ver perfil público"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Perfil</span>
        </a>
      ) : (
        <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline">Sin perfil</span>
      )}

      {/* Toggle button */}
      <Button
        size="sm"
        variant={isAdmin ? "outline" : "default"}
        className={
          isAdmin
            ? "text-xs h-8 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
            : "text-xs h-8 bg-purple-600 hover:bg-purple-700 text-white"
        }
        disabled={updating}
        onClick={() => onToggle(emp)}
      >
        {updating
          ? "..."
          : isAdmin
          ? "Quitar Admin"
          : "Hacer Admin"}
      </Button>
    </div>
  );
}
