import { prisma } from "@/lib/prisma/client";
import { CompanyGrid } from "@/components/companies/CompanyGrid";
import { GitBranch } from "lucide-react";

async function getCompanies() {
  try {
    return await prisma.company.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
  } catch {
    return [];
  }
}

export default async function OrganigramPage() {
  const companies = await getCompanies();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30">
          <GitBranch className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Organigramas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Selecciona una empresa para explorar su estructura organizacional
          </p>
        </div>
      </div>

      <CompanyGrid companies={companies} />
    </div>
  );
}
