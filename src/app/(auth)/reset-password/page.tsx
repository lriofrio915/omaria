"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { CheckCircle2, ShieldAlert } from "lucide-react";

const resetSchema = z
  .object({
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Las contraseñas no coinciden",
    path: ["confirm"],
  });

type ResetFormData = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  });

  useEffect(() => {
    // Supabase pone el token en el hash de la URL.
    // El SDK lo procesa automáticamente al instanciar el cliente.
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) setInvalidLink(true);
    });
  }, []);

  async function onSubmit(data: ResetFormData) {
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({
      password: data.password,
    });

    setLoading(false);

    if (error) {
      toast.error("No se pudo actualizar la contraseña. El enlace puede haber expirado.");
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/login"), 3000);
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
        <CardTitle className="text-2xl text-white">Nueva contraseña</CardTitle>
        <CardDescription className="text-slate-400">
          Plataforma de Talento Humano — SG Consulting Group
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Enlace inválido o expirado */}
        {invalidLink && (
          <div className="flex flex-col items-center text-center py-4 space-y-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/20">
              <ShieldAlert className="h-7 w-7 text-red-400" />
            </div>
            <p className="text-sm text-slate-400">
              El enlace es inválido o ha expirado. Solicita uno nuevo desde la pantalla de inicio de sesión.
            </p>
            <Button
              variant="outline"
              className="border-slate-600 text-slate-200 hover:bg-slate-700"
              onClick={() => router.push("/login")}
            >
              Volver al inicio de sesión
            </Button>
          </div>
        )}

        {/* Contraseña actualizada */}
        {done && !invalidLink && (
          <div className="flex flex-col items-center text-center py-4 space-y-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/20">
              <CheckCircle2 className="h-7 w-7 text-green-400" />
            </div>
            <p className="font-medium text-white">¡Contraseña actualizada!</p>
            <p className="text-sm text-slate-400">
              Serás redirigido al inicio de sesión en unos segundos...
            </p>
          </div>
        )}

        {/* Formulario */}
        {!done && !invalidLink && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-200">
                Nueva contraseña
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                className="border-slate-600 bg-slate-700 text-white placeholder:text-slate-400 focus:border-blue-500"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-red-400">{errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-slate-200">
                Confirmar contraseña
              </Label>
              <Input
                id="confirm"
                type="password"
                placeholder="Repite la contraseña"
                autoComplete="new-password"
                className="border-slate-600 bg-slate-700 text-white placeholder:text-slate-400 focus:border-blue-500"
                {...register("confirm")}
              />
              {errors.confirm && (
                <p className="text-sm text-red-400">{errors.confirm.message}</p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Guardando..." : "Guardar nueva contraseña"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
