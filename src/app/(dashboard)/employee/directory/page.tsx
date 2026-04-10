"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, X, Users } from "lucide-react";
import { Input } from "@/components/ui/input";

interface DirectoryEmployee {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  city: string | null;
  department: { name: string };
  position: { title: string };
}

function colorFromString(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360} 55% 48%)`;
}

function getInitials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

export default function EmployeeDirectoryPage() {
  const [employees, setEmployees] = useState<DirectoryEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchDirectory = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const res = await fetch(`/api/employees/directory?${params}`);
    if (res.ok) {
      setEmployees(await res.json());
    }
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchDirectory, 300);
    return () => clearTimeout(t);
  }, [fetchDirectory]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/10">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Directorio</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-[42px]">
            Conoce a tu equipo — SG Consulting Group
          </p>
        </div>
        <p className="text-sm text-muted-foreground ml-[42px] sm:ml-0">
          {employees.length} colaboradores
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          aria-label="Buscar colaboradores"
          placeholder="Buscar por nombre o cargo..."
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

      {/* Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-5 flex flex-col items-center gap-3">
              <div className="h-16 w-16 rounded-full bg-muted" />
              <div className="h-4 w-28 bg-muted rounded" />
              <div className="h-3 w-20 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : employees.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-foreground">
            {search ? `Sin resultados para "${search}"` : "No hay colaboradores activos"}
          </p>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="mt-2 text-xs text-blue-600 hover:underline"
            >
              Limpiar búsqueda
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {employees.map((emp) => (
            <div
              key={emp.id}
              className="rounded-xl border border-border bg-card p-5 flex flex-col items-center gap-3 text-center hover:shadow-md transition-shadow"
            >
              {/* Avatar */}
              <div
                className="h-16 w-16 rounded-full overflow-hidden flex items-center justify-center text-white text-xl font-bold shrink-0"
                style={{ background: emp.avatarUrl ? "transparent" : colorFromString(emp.id) }}
              >
                {emp.avatarUrl ? (
                  <img
                    src={emp.avatarUrl}
                    alt={`${emp.firstName} ${emp.lastName}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  getInitials(emp.firstName, emp.lastName)
                )}
              </div>

              {/* Info */}
              <div>
                <p className="text-sm font-semibold text-foreground leading-tight">
                  {emp.firstName} {emp.lastName}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{emp.position.title}</p>
                <p className="text-xs text-muted-foreground">{emp.department.name}</p>
                {emp.city && (
                  <p className="text-xs text-muted-foreground/60 mt-1">{emp.city}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
