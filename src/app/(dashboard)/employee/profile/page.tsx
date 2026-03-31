import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma/client";
import { ProfileEditor } from "@/components/profile/ProfileEditor";

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

  if (!employee) redirect("/employee");

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
