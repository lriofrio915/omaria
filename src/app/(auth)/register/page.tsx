"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const COMPANIES = ["Emporium", "SG Consulting", "Livin", "Eureka", "Spartans"] as const;

const registerSchema = z
  .object({
    firstName: z.string().min(1, "El nombre es requerido"),
    lastName: z.string().min(1, "El apellido es requerido"),
    email: z.string().email("Ingresa un correo válido"),
    company: z.enum(COMPANIES, { error: "Selecciona una empresa" }),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterFormData) {
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          role: "EMPLOYEE",
          firstName: data.firstName,
          lastName: data.lastName,
          company: data.company,
        },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    setRegisteredEmail(data.email);
  }

  // Pantalla de confirmación tras el registro exitoso
  if (registeredEmail) {
    return (
      <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 text-white backdrop-blur-sm">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5H4.5a2.25 2.25 0 00-2.25 2.25m19.5 0l-9.75 6.75L2.25 6.75"
              />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-white">Revisa tu correo</h2>
            <p className="text-sm text-slate-400">
              Enviamos un enlace de confirmación a{" "}
              <span className="font-medium text-blue-400">{registeredEmail}</span>
            </p>
            <p className="text-sm text-slate-400">
              Haz clic en el enlace del correo para activar tu cuenta. Si no lo
              ves, revisa tu carpeta de spam.
            </p>
          </div>
          <Link
            href="/login"
            className="mt-2 text-sm text-blue-400 underline-offset-4 hover:text-blue-300 hover:underline"
          >
            Volver al inicio de sesión
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 text-white backdrop-blur-sm">
      <CardHeader className="space-y-1 pb-6">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500">
            <span className="text-sm font-bold">O</span>
          </div>
          <span className="text-xl font-bold tracking-tight">OmarIA</span>
        </div>
        <CardTitle className="text-2xl text-white">Crear cuenta</CardTitle>
        <CardDescription className="text-slate-400">
          Regístrate en la plataforma de Talento Humano
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-slate-200">Nombre</Label>
              <Input
                id="firstName"
                placeholder="Juan"
                className="border-slate-600 bg-slate-700 text-white placeholder:text-slate-400 focus:border-blue-500"
                {...register("firstName")}
              />
              {errors.firstName && <p className="text-sm text-red-400">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-slate-200">Apellido</Label>
              <Input
                id="lastName"
                placeholder="Pérez"
                className="border-slate-600 bg-slate-700 text-white placeholder:text-slate-400 focus:border-blue-500"
                {...register("lastName")}
              />
              {errors.lastName && <p className="text-sm text-red-400">{errors.lastName.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-200">
              Correo electrónico
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@sgconsulting.com"
              autoComplete="email"
              className="border-slate-600 bg-slate-700 text-white placeholder:text-slate-400 focus:border-blue-500"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-red-400">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="company" className="text-slate-200">Empresa</Label>
            <select
              id="company"
              className="w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              defaultValue=""
              {...register("company")}
            >
              <option value="" disabled className="text-slate-400">Selecciona tu empresa</option>
              {COMPANIES.map((c) => (
                <option key={c} value={c} className="bg-slate-700">{c}</option>
              ))}
            </select>
            {errors.company && (
              <p className="text-sm text-red-400">{errors.company.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-200">
              Contraseña
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                className="border-slate-600 bg-slate-700 pr-10 text-white placeholder:text-slate-400 focus:border-blue-500"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-400">{errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-slate-200">
              Confirmar contraseña
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="new-password"
                className="border-slate-600 bg-slate-700 pr-10 text-white placeholder:text-slate-400 focus:border-blue-500"
                {...register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-400">{errors.confirmPassword.message}</p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-400">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-blue-400 hover:text-blue-300">
            Iniciar sesión
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
