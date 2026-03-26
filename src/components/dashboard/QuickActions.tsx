"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FileUp, ReceiptText, UserPlus, GitBranch } from "lucide-react";

const ACTION_SETS = [
  [
    {
      label: "Subir documento",
      description: "Manuales, políticas, contratos",
      href: "/documents",
      icon: FileUp,
      color: "#1B52B5",
      bg: "#1B52B5",
    },
    {
      label: "Registrar nómina",
      description: "Recibos y pagos del período",
      href: "/payroll",
      icon: ReceiptText,
      color: "#7c3aed",
      bg: "#7c3aed",
    },
  ],
  [
    {
      label: "Nuevo colaborador",
      description: "Agregar al equipo de trabajo",
      href: "/employees/new",
      icon: UserPlus,
      color: "#059669",
      bg: "#059669",
    },
    {
      label: "Ver organigrama",
      description: "Estructura organizacional",
      href: "/organigram",
      icon: GitBranch,
      color: "#0891b2",
      bg: "#0891b2",
    },
  ],
] as const;

const INTERVAL_MS = 5000;
const FADE_MS = 280;

export function QuickActions() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % ACTION_SETS.length);
        setVisible(true);
      }, FADE_MS);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const actions = ACTION_SETS[index];

  return (
    <div className="space-y-3">
      {/* Acciones con transición */}
      <div
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0px)" : "translateY(-5px)",
          transition: `opacity ${FADE_MS}ms ease, transform ${FADE_MS}ms ease`,
        }}
        className="space-y-3"
      >
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-center gap-3 rounded-xl p-3 transition-all hover:shadow-md"
              style={{
                background: `${action.bg}08`,
                border: `1px solid ${action.bg}20`,
              }}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105"
                style={{ backgroundColor: `${action.bg}18` }}
              >
                <Icon className="h-4 w-4" style={{ color: action.color }} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{action.label}</p>
                <p className="text-xs text-muted-foreground truncate">{action.description}</p>
              </div>
              <span className="ml-auto text-muted-foreground text-xs group-hover:translate-x-0.5 transition-transform">
                →
              </span>
            </Link>
          );
        })}
      </div>

      {/* Dots indicadores */}
      <div className="flex items-center justify-center gap-1.5 pt-1">
        {ACTION_SETS.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              if (i === index) return;
              setVisible(false);
              setTimeout(() => {
                setIndex(i);
                setVisible(true);
              }, FADE_MS);
            }}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === index ? 16 : 6,
              height: 6,
              backgroundColor: i === index ? "#1B52B5" : "#cbd5e1",
            }}
            aria-label={`Ver grupo ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
