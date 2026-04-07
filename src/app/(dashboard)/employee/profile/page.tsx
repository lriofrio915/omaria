import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { ProfileEditor } from "@/components/profile/ProfileEditor";
import { UserCircle2 } from "lucide-react";

export const metadata = { title: "Mi Perfil — OmarIA" };

export default async function EmployeeProfilePage() {
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
          company: { select: { name: true, primaryColor: true, slug: true } },
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
      <div className="max-w-5xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Mi Perfil</h1>
        <div className="mt-8 flex flex-col items-center text-center gap-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 py-16">
          <UserCircle2 className="h-12 w-12 text-slate-400" />
          <div className="space-y-1">
            <p className="font-medium text-slate-700 dark:text-slate-300">Perfil no configurado</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
              Tu ficha de empleado aún no ha sido creada. Contacta al administrador para que la configure.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-2">
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
