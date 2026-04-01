"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { ArrowLeft, CheckCircle2, MailCheck } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Ingresa un correo válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

const forgotSchema = z.object({
  email: z.string().email("Ingresa un correo válido"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type ForgotFormData = z.infer<typeof forgotSchema>;

type View = "login" | "forgot" | "forgot-sent";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<View>("login");
  const [emailConfirmed, setEmailConfirmed] = useState(false);

  useEffect(() => {
    if (searchParams.get("confirmed") === "1") {
      setEmailConfirmed(true);
    }
  }, [searchParams]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const forgotForm = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
  });

  async function onLogin(data: LoginFormData) {
    setLoading(true);
    const supabase = createClient();

    const { error, data: authData } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      toast.error("Credenciales incorrectas. Verifica tu correo y contraseña.");
      setLoading(false);
      return;
    }

    const role = authData.user?.user_metadata?.role;
    toast.success("Sesión iniciada correctamente");
    router.push(role === "ADMIN" ? "/admin" : "/employee");
    router.refresh();
  }

  async function onForgotPassword(data: ForgotFormData) {
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (error) {
      toast.error("No se pudo enviar el correo. Intenta de nuevo.");
      return;
    }

    setView("forgot-sent");
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

        {view === "login" && (
          <>
            <CardTitle className="text-2xl text-white">Iniciar sesión</CardTitle>
            <CardDescription className="text-slate-400">
              Plataforma de Talento Humano — SG Consulting Group
            </CardDescription>
          </>
        )}
        {view === "forgot" && (
          <>
            <CardTitle className="text-2xl text-white">Restablecer contraseña</CardTitle>
            <CardDescription className="text-slate-400">
              Te enviaremos un enlace a tu correo para crear una nueva contraseña.
            </CardDescription>
          </>
        )}
        {view === "forgot-sent" && (
          <>
            <CardTitle className="text-2xl text-white">Revisa tu correo</CardTitle>
            <CardDescription className="text-slate-400">
              Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.
            </CardDescription>
          </>
        )}
      </CardHeader>

      <CardContent>
        {/* Banner: email confirmado */}
        {emailConfirmed && (
          <div className="mb-4 flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-400" />
            <p className="text-sm text-green-300">
              ¡Correo confirmado! Ya puedes iniciar sesión.
            </p>
          </div>
        )}

        {/* Vista: Login */}
        {view === "login" && (
          <>
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
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
                  {...loginForm.register("email")}
                />
                {loginForm.formState.errors.email && (
                  <p className="text-sm text-red-400">{loginForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-slate-200">
                    Contraseña
                  </Label>
                  <button
                    type="button"
                    onClick={() => setView("forgot")}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="border-slate-600 bg-slate-700 text-white placeholder:text-slate-400 focus:border-blue-500"
                  {...loginForm.register("password")}
                />
                {loginForm.formState.errors.password && (
                  <p className="text-sm text-red-400">{loginForm.formState.errors.password.message}</p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? "Iniciando sesión..." : "Iniciar sesión"}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-slate-400">
              ¿No tienes cuenta?{" "}
              <Link href="/register" className="text-blue-400 hover:text-blue-300">
                Regístrate
              </Link>
            </p>
          </>
        )}

        {/* Vista: Formulario de recuperación */}
        {view === "forgot" && (
          <>
            <form onSubmit={forgotForm.handleSubmit(onForgotPassword)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email" className="text-slate-200">
                  Correo electrónico
                </Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="tu@sgconsulting.com"
                  autoComplete="email"
                  className="border-slate-600 bg-slate-700 text-white placeholder:text-slate-400 focus:border-blue-500"
                  {...forgotForm.register("email")}
                />
                {forgotForm.formState.errors.email && (
                  <p className="text-sm text-red-400">{forgotForm.formState.errors.email.message}</p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? "Enviando..." : "Enviar enlace de restablecimiento"}
              </Button>
            </form>
            <button
              type="button"
              onClick={() => setView("login")}
              className="mt-4 flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver al inicio de sesión
            </button>
          </>
        )}

        {/* Vista: Email enviado */}
        {view === "forgot-sent" && (
          <div className="flex flex-col items-center text-center py-4 space-y-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/20">
              <MailCheck className="h-7 w-7 text-blue-400" />
            </div>
            <p className="text-sm text-slate-400">
              Revisa tu bandeja de entrada y sigue las instrucciones del correo.
              El enlace expira en 24 horas.
            </p>
            <button
              type="button"
              onClick={() => setView("login")}
              className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver al inicio de sesión
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
