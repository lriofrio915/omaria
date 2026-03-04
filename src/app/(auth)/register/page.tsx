"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const registerSchema = z
  .object({
    email: z.string().email("Ingresa un correo válido"),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string(),
    role: z.enum(["ADMIN", "EMPLOYEE"]),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"ADMIN" | "EMPLOYEE">("EMPLOYEE");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "EMPLOYEE" },
  });

  async function onSubmit(data: RegisterFormData) {
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { role: data.role },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("Cuenta creada. Revisa tu correo para confirmar.");
    router.push("/login");
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
            <Label htmlFor="role" className="text-slate-200">
              Rol
            </Label>
            <Select
              value={role}
              onValueChange={(v: "ADMIN" | "EMPLOYEE") => {
                setRole(v);
                setValue("role", v);
              }}
            >
              <SelectTrigger className="border-slate-600 bg-slate-700 text-white focus:border-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-slate-600 bg-slate-700 text-white">
                <SelectItem value="EMPLOYEE">Empleado</SelectItem>
                <SelectItem value="ADMIN">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-200">
              Contraseña
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              className="border-slate-600 bg-slate-700 text-white placeholder:text-slate-400 focus:border-blue-500"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-red-400">{errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-slate-200">
              Confirmar contraseña
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              className="border-slate-600 bg-slate-700 text-white placeholder:text-slate-400 focus:border-blue-500"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-400">
                {errors.confirmPassword.message}
              </p>
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
