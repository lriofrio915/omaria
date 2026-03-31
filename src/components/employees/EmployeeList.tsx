"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search, Plus, Edit, Trash2, Eye, ChevronLeft, ChevronRight,
  Building2, Users, Filter, X, ChevronsLeft, ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ── Types ────────────────────────────────────────────────────────────────────

interface Company {
  id: string;
  name: string;
  slug: string;
  primaryColor: string;
}

interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  city: string | null;
  status: string;
  department: {
    id: string;
    name: string;
    company: Company | null;
  };
  position: { id: string; title: string };
}

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:     "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-800",
  INACTIVE:   "bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700",
  ON_LEAVE:   "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-800",
  TERMINATED: "bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-800",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  ON_LEAVE: "En permiso",
  TERMINATED: "Terminado",
};

const PAGE_SIZE_OPTIONS = [15, 25, 50, 100];

// ── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

function colorFromString(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 55% 48%)`;
}

// ── Component ────────────────────────────────────────────────────────────────

export function EmployeeList() {
  const router = useRouter();

  // Data
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [filterCompany, setFilterCompany] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");
  const [deleting, setDeleting] = useState(false);

  // ── Fetch companies once ──────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/companies")
      .then((r) => r.json())
      .then((data: Company[]) => setCompanies(data))
      .catch(() => {});
  }, []);

  // ── Fetch employees ───────────────────────────────────────────────────────
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterCompany !== "all") params.set("companyId", filterCompany);
    if (filterStatus !== "all") params.set("status", filterStatus);
    const res = await fetch(`/api/employees?${params}`);
    if (res.ok) {
      const data = await res.json();
      setEmployees(data);
      setPage(1); // reset page on new filter
    }
    setLoading(false);
  }, [search, filterCompany, filterStatus]);

  useEffect(() => {
    const t = setTimeout(fetchEmployees, 300);
    return () => clearTimeout(t);
  }, [fetchEmployees]);

  // ── Pagination ────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(employees.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = employees.slice((safePage - 1) * pageSize, safePage * pageSize);

  // ── Filters active count ──────────────────────────────────────────────────
  const activeFilters = [filterCompany !== "all", filterStatus !== "all"].filter(Boolean).length;

  function clearFilters() {
    setFilterCompany("all");
    setFilterStatus("all");
    setSearch("");
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const res = await fetch(`/api/employees/${deleteId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Colaborador eliminado correctamente");
      setDeleteId(null);
      fetchEmployees();
    } else {
      toast.error("No se pudo eliminar el colaborador");
    }
    setDeleting(false);
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* ── Toolbar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar por nombre, cargo o cédula..."
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

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Filter toggle */}
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 text-sm"
            onClick={() => setFiltersOpen((v) => !v)}
          >
            <Filter className="h-3.5 w-3.5" />
            Filtros
            {activeFilters > 0 && (
              <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white font-bold">
                {activeFilters}
              </span>
            )}
          </Button>

          <Link href="/employees/new">
            <Button size="sm" className="h-9 gap-1.5 bg-blue-600 hover:bg-blue-700 text-sm">
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Nuevo colaborador</span>
              <span className="sm:hidden">Nuevo</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Filters panel ── */}
      {filtersOpen && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
          {/* Empresa */}
          <div className="flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <Select value={filterCompany} onValueChange={setFilterCompany}>
              <SelectTrigger className="h-8 w-48 text-xs">
                <SelectValue placeholder="Empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las empresas</SelectItem>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estado */}
          <div className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {activeFilters > 0 && (
            <button
              onClick={clearFilters}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* ── Summary bar ── */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {loading ? "Cargando..." : (
            <>
              <span className="font-medium text-foreground">{employees.length}</span>
              {" "}colaborador{employees.length !== 1 ? "es" : ""}
              {activeFilters > 0 || search ? " encontrados" : " en total"}
            </>
          )}
        </span>
        {/* Page size */}
        {!loading && employees.length > 0 && (
          <div className="flex items-center gap-2">
            <span>Mostrar</span>
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
              <SelectTrigger className="h-7 w-16 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>por página</span>
          </div>
        )}
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border">
                <TableHead className="w-10 text-center font-semibold text-foreground text-xs uppercase tracking-wide py-3">
                  N°
                </TableHead>
                <TableHead className="text-center font-semibold text-foreground text-xs uppercase tracking-wide py-3 w-[210px] max-w-[210px]">
                  Colaborador
                </TableHead>
                <TableHead className="text-center font-semibold text-foreground text-xs uppercase tracking-wide py-3 w-[120px] max-w-[120px]">
                  Cargo
                </TableHead>
                <TableHead className="text-center font-semibold text-foreground text-xs uppercase tracking-wide py-3 w-[100px] max-w-[100px]">
                  Área
                </TableHead>
                <TableHead className="text-center font-semibold text-foreground text-xs uppercase tracking-wide py-3 w-[130px] max-w-[130px]">
                  Empresa
                </TableHead>
                <TableHead className="text-center font-semibold text-foreground text-xs uppercase tracking-wide py-3 w-20">
                  Estado
                </TableHead>
                <TableHead className="text-right font-semibold text-foreground text-xs uppercase tracking-wide py-3 pr-4 w-32">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Skeleton rows
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i} className="animate-pulse">
                    <TableCell className="text-center"><div className="h-3 w-6 bg-muted rounded mx-auto" /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
                        <div className="space-y-1.5">
                          <div className="h-3 w-32 bg-muted rounded" />
                          <div className="h-2.5 w-24 bg-muted rounded" />
                        </div>
                      </div>
                    </TableCell>
                    {[140, 100, 120, 60, 80].map((w, j) => (
                      <TableCell key={j}><div className={`h-3 w-${w < 80 ? 16 : 24} bg-muted rounded`} /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Users className="h-8 w-8 opacity-30" />
                      <p className="text-sm">
                        {search || activeFilters > 0
                          ? "No se encontraron colaboradores con los filtros actuales"
                          : "No hay colaboradores registrados"}
                      </p>
                      {(search || activeFilters > 0) && (
                        <button onClick={clearFilters} className="text-xs text-blue-600 hover:underline mt-1">
                          Limpiar filtros
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((emp, idx) => {
                  const globalIdx = (safePage - 1) * pageSize + idx + 1;
                  const company = emp.department.company;
                  const avatarColor = company?.primaryColor ?? colorFromString(emp.firstName + emp.lastName);
                  const initials = getInitials(emp.firstName, emp.lastName);

                  return (
                    <TableRow
                      key={emp.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                      onClick={() => router.push(`/employees/${emp.id}`)}
                    >
                      {/* N° */}
                      <TableCell className="text-center text-xs text-muted-foreground font-mono tabular-nums py-3">
                        {globalIdx}
                      </TableCell>

                      {/* Colaborador */}
                      <TableCell className="py-3 max-w-[210px]">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0 select-none"
                            style={{ backgroundColor: avatarColor }}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p
                              className="font-medium text-sm text-foreground leading-tight truncate"
                              title={`${emp.firstName} ${emp.lastName}`}
                            >
                              {emp.firstName} {emp.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">
                              {emp.employeeCode}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Cargo */}
                      <TableCell className="py-3 max-w-[120px]">
                        <span
                          className="text-sm text-foreground/80 leading-tight truncate block"
                          title={emp.position.title}
                        >
                          {emp.position.title}
                        </span>
                      </TableCell>

                      {/* Área */}
                      <TableCell className="py-3 max-w-[100px]">
                        <span
                          className="text-sm text-muted-foreground truncate block"
                          title={emp.department.name}
                        >
                          {emp.department.name}
                        </span>
                      </TableCell>

                      {/* Empresa */}
                      <TableCell className="py-3 max-w-[130px]">
                        {company ? (
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className="inline-block h-2 w-2 rounded-full shrink-0"
                              style={{ backgroundColor: company.primaryColor }}
                            />
                            <span
                              className="text-sm text-foreground/80 truncate"
                              title={company.name}
                            >
                              {company.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      {/* Estado */}
                      <TableCell className="py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${STATUS_STYLES[emp.status] ?? "bg-muted text-muted-foreground"}`}
                        >
                          {STATUS_LABELS[emp.status] ?? emp.status}
                        </span>
                      </TableCell>

                      {/* Acciones */}
                      <TableCell className="py-3 pr-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-0.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            onClick={() => router.push(`/employees/${emp.id}`)}
                            title="Ver perfil"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            onClick={() => router.push(`/employees/${emp.id}/edit`)}
                            title="Editar"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => {
                              setDeleteId(emp.id);
                              setDeleteName(`${emp.firstName} ${emp.lastName}`);
                            }}
                            title="Eliminar"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ── Pagination ── */}
      {!loading && totalPages > 1 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm">
          <p className="text-xs text-muted-foreground">
            Mostrando{" "}
            <span className="font-medium text-foreground">
              {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, employees.length)}
            </span>{" "}
            de{" "}
            <span className="font-medium text-foreground">{employees.length}</span>
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={safePage === 1}
              onClick={() => setPage(1)}
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={safePage === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>

            {/* Page numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
              .reduce<(number | "...")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span key={`dot-${i}`} className="px-1 text-muted-foreground text-xs">…</span>
                ) : (
                  <Button
                    key={p}
                    variant={p === safePage ? "default" : "outline"}
                    size="sm"
                    className={`h-7 w-7 p-0 text-xs ${p === safePage ? "bg-blue-600 hover:bg-blue-700 border-blue-600" : ""}`}
                    onClick={() => setPage(p as number)}
                  >
                    {p}
                  </Button>
                )
              )}

            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={safePage === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={safePage === totalPages}
              onClick={() => setPage(totalPages)}
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Delete dialog ── */}
      <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar colaborador</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar a{" "}
              <span className="font-semibold text-foreground">{deleteName}</span>?
              Esta acción no se puede deshacer y eliminará todos sus datos asociados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Eliminando..." : "Sí, eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
