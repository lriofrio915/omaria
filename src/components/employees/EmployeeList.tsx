"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Plus, Edit, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  contractType: string;
  department: { name: string };
  position: { title: string };
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  INACTIVE: "bg-slate-100 text-slate-600",
  ON_LEAVE: "bg-yellow-100 text-yellow-700",
  TERMINATED: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  ON_LEAVE: "En permiso",
  TERMINATED: "Terminado",
};

export function EmployeeList() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const res = await fetch(`/api/employees?${params}`);
    if (res.ok) {
      const data = await res.json();
      setEmployees(data);
    }
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const timeout = setTimeout(fetchEmployees, 300);
    return () => clearTimeout(timeout);
  }, [fetchEmployees]);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const res = await fetch(`/api/employees/${deleteId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Empleado eliminado");
      setDeleteId(null);
      fetchEmployees();
    } else {
      toast.error("Error al eliminar el empleado");
    }
    setDeleting(false);
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar empleado..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Link href="/employees/new">
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            Nuevo empleado
          </Button>
        </Link>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="font-semibold text-slate-700">Código</TableHead>
              <TableHead className="font-semibold text-slate-700">Empleado</TableHead>
              <TableHead className="font-semibold text-slate-700">Cargo</TableHead>
              <TableHead className="font-semibold text-slate-700">Departamento</TableHead>
              <TableHead className="font-semibold text-slate-700">Estado</TableHead>
              <TableHead className="text-right font-semibold text-slate-700">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                  Cargando empleados...
                </TableCell>
              </TableRow>
            ) : employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                  {search ? "No se encontraron empleados" : "No hay empleados registrados"}
                </TableCell>
              </TableRow>
            ) : (
              employees.map((emp) => (
                <TableRow key={emp.id} className="hover:bg-slate-50">
                  <TableCell className="font-mono text-xs text-slate-500">
                    {emp.employeeCode}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-slate-900">
                        {emp.firstName} {emp.lastName}
                      </p>
                      <p className="text-xs text-slate-400">{emp.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {emp.position.title}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {emp.department.name}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[emp.status] ?? "bg-slate-100 text-slate-600"}`}
                    >
                      {STATUS_LABELS[emp.status] ?? emp.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600"
                        onClick={() => router.push(`/employees/${emp.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600"
                        onClick={() => router.push(`/employees/${emp.id}/edit`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-slate-500 hover:text-red-600"
                        onClick={() => setDeleteId(emp.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-sm text-slate-400">
        {employees.length} empleado{employees.length !== 1 ? "s" : ""}
      </p>

      {/* Delete dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar empleado</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. ¿Estás seguro de que deseas
              eliminar este empleado y todos sus datos asociados?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
