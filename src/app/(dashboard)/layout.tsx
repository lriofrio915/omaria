import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const role = (user.user_metadata?.role as string) ?? "EMPLOYEE";

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar role={role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar email={user.email ?? ""} role={role} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
