"use client";

import { useState } from "react";
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

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

const setupSchema = z.object({
  whatsapp: z.string().min(7, "Ingresa un número de WhatsApp válido"),
  birthDate: z.string().optional(),
  bloodType: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  personalEmail: z
    .string()
    .email("Ingresa un email válido")
    .optional()
    .or(z.literal("")),
});

type SetupFormData = z.infer<typeof setupSchema>;

export function ProfileSetup({ user }: { user: User }) {
  const [loading, setLoading] = useState(false);

  const meta = user.user_metadata ?? {};
  const firstName = meta.firstName ?? meta.full_name?.split(" ")[0] ?? "";

  const { register, handleSubmit, formState: { errors } } = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      whatsapp: "",
      birthDate: "",
      bloodType: "",
      city: "",
      address: "",
      personalEmail: "",
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
      let errMsg = "Error al configurar el perfil";
      try {
        const err = await res.json();
        errMsg = err.error ?? errMsg;
      } catch {
        // respuesta no-JSON (ej. 500 HTML de Next.js)
      }
      toast.error(errMsg);
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
          <CardTitle>
            {firstName ? `Hola, ${firstName}` : "Completa tu perfil"}
          </CardTitle>
          <CardDescription>
            Ingresa tus datos personales para que el equipo de Talento Humano pueda contactarte y gestionar tu perfil.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="whatsapp">Número de WhatsApp <span className="text-red-500">*</span></Label>
              <Input
                id="whatsapp"
                type="tel"
                placeholder="Ej: +593 99 123 4567"
                {...register("whatsapp")}
              />
              {errors.whatsapp && <p className="text-sm text-red-500">{errors.whatsapp.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="birthDate">Fecha de nacimiento</Label>
                <Input
                  id="birthDate"
                  type="date"
                  {...register("birthDate")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bloodType">Tipo de sangre</Label>
                <select
                  id="bloodType"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  defaultValue=""
                  {...register("bloodType")}
                >
                  <option value="">Seleccionar</option>
                  {BLOOD_TYPES.map((bt) => (
                    <option key={bt} value={bt}>{bt}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Ciudad de residencia</Label>
              <Input
                id="city"
                placeholder="Ej: Quito"
                {...register("city")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                placeholder="Ej: Av. Amazonas N12-34 y Colón"
                {...register("address")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="personalEmail">Email personal</Label>
              <Input
                id="personalEmail"
                type="email"
                placeholder="Ej: juan@gmail.com"
                {...register("personalEmail")}
              />
              {errors.personalEmail && <p className="text-sm text-red-500">{errors.personalEmail.message}</p>}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cuenta: {user.email}
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
