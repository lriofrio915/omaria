import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { ProfileEditor } from "@/components/profile/ProfileEditor";

export const metadata = { title: "Mi Perfil — OmarIA" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const employee = await prisma.employee.findFirst({
    where: { OR: [{ userId: user.id }, { email: user.email! }] },
    include: {
      position: { select: { title: true } },
      department: {
        select: {
          name: true,
          company: { select: { name: true, primaryColor: true } },
        },
      },
      profile: {
        include: {
          education: { orderBy: { startYear: "desc" } },
          experience: { orderBy: { startDate: "desc" } },
          skills: { orderBy: { category: "asc" } },
          languages: true,
          certifications: { orderBy: { createdAt: "desc" } },
        },
      },
    },
  });

  if (!employee) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center space-y-4">
        <div className="text-5xl">🔗</div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Perfil no vinculado
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Tu cuenta de administrador no está vinculada a un registro de empleado. Pide a otro administrador que vincule tu cuenta en la ficha del empleado, o verifica que el correo de tu cuenta coincida con el registrado en el sistema.
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-600 font-mono">
          Cuenta activa: {user.email}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-2">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Mi Perfil</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Gestiona tu información profesional y mantén tu hoja de vida actualizada.
        </p>
      </div>
      <ProfileEditor initialData={employee as any} />
    </div>
  );
}
