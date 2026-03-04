"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  DollarSign,
  GitBranch,
  MessageSquare,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const adminNav = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Empleados", href: "/employees", icon: Users },
  { label: "Documentos", href: "/documents", icon: FileText },
  { label: "Nóminas", href: "/payroll", icon: DollarSign },
  { label: "Organigrama", href: "/organigram", icon: GitBranch },
  { label: "OmarIA", href: "/ai-agent", icon: MessageSquare },
];

const employeeNav = [
  { label: "Mi Portal", href: "/employee", icon: LayoutDashboard },
  { label: "Mis Documentos", href: "/documents", icon: FileText },
  { label: "Mis Nóminas", href: "/payroll", icon: DollarSign },
  { label: "OmarIA", href: "/ai-agent", icon: MessageSquare },
  { label: "Mi Perfil", href: "/employee/profile", icon: UserCircle },
];

interface SidebarProps {
  role: string;
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const nav = role === "ADMIN" ? adminNav : employeeNav;

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
          <span className="text-sm font-bold text-white">O</span>
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">OmarIA</p>
          <p className="text-xs text-slate-500">SG Consulting Group</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {nav.map((item) => {
            const isActive =
              item.href === "/admin" || item.href === "/employee"
                ? pathname === item.href
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isActive ? "text-blue-600" : "text-slate-400"
                    )}
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Role badge */}
      <div className="border-t border-slate-200 px-4 py-3">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
            role === "ADMIN"
              ? "bg-purple-100 text-purple-700"
              : "bg-green-100 text-green-700"
          )}
        >
          {role === "ADMIN" ? "Administrador" : "Empleado"}
        </span>
      </div>
    </aside>
  );
}
