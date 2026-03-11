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
  X,
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
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ role, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const nav = role === "ADMIN" ? adminNav : employeeNav;

  const content = (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-slate-200 dark:border-slate-800 px-6">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600">
          <span className="text-sm font-bold text-white">O</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">OmarIA</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">SG Consulting Group</p>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="md:hidden ml-2 rounded-md p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          aria-label="Cerrar menú"
        >
          <X className="h-5 w-5" />
        </button>
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
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"
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
      <div className="border-t border-slate-200 dark:border-slate-800 px-4 py-3">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
            role === "ADMIN"
              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
              : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
          )}
        >
          {role === "ADMIN" ? "Administrador" : "Empleado"}
        </span>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop: always visible */}
      <aside className="hidden md:flex h-full w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {content}
      </aside>

      {/* Mobile: slide-in drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 transition-transform duration-300 md:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {content}
      </aside>
    </>
  );
}
