import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { ProfileEditor } from "@/components/profile/ProfileEditor";
import { ProfileSetup } from "@/components/profile/ProfileSetup";
import { UserCircle2 } from "lucide-react";

export const metadata = { title: "Mi Perfil — OmarIA" };

export default async function EmployeeProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let employee = null;
  try {
    employee = await prisma.employee.findFirst({
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
  } catch (error) {
    console.error("[EmployeeProfile] DB error:", error);
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Mi Perfil</h1>
        <div className="mt-8 flex flex-col items-center text-center gap-4 rounded-xl border border-dashed border-red-200 dark:border-red-800 py-16">
          <UserCircle2 className="h-12 w-12 text-red-400" />
          <div className="space-y-1">
            <p className="font-medium text-slate-700 dark:text-slate-300">Error al cargar el perfil</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
              No se pudo conectar a la base de datos. Por favor intenta de nuevo más tarde.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return <ProfileSetup user={user} />;
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
