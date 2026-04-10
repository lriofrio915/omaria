"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { User } from "@supabase/supabase-js";

const setupSchema = z.object({
  firstName: z.string().min(1, "El nombre es requerido"),
  lastName: z.string().min(1, "El apellido es requerido"),
});

type SetupFormData = z.infer<typeof setupSchema>;

export function ProfileSetup({ user }: { user: User }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const meta = user.user_metadata ?? {};

  const { register, handleSubmit, formState: { errors } } = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      firstName: meta.firstName ?? meta.full_name?.split(" ")[0] ?? "",
      lastName: meta.lastName ?? meta.full_name?.split(" ").slice(1).join(" ") ?? "",
    },
  });

  async function onSubmit(data: SetupFormData) {
    setLoading(true);
    const res = await fetch("/api/profile/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error ?? "Error al configurar el perfil");
      setLoading(false);
      return;
    }

    toast.success("Perfil creado. ¡Bienvenido!");
    window.location.href = "/employee/profile";
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-3">
            <UserCircle2 className="h-12 w-12 text-blue-500" />
          </div>
          <CardTitle>Configura tu perfil</CardTitle>
          <CardDescription>
            Ingresa tu nombre para comenzar. Podrás completar el resto de tu información después.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nombre</Label>
              <Input id="firstName" placeholder="Ej: Daniel" {...register("firstName")} />
              {errors.firstName && <p className="text-sm text-red-500">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Apellido</Label>
              <Input id="lastName" placeholder="Ej: García" {...register("lastName")} />
              {errors.lastName && <p className="text-sm text-red-500">{errors.lastName.message}</p>}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cuenta activa: {user.email}
            </p>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Guardando..." : "Guardar y continuar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
