import { CompanyCard } from "./CompanyCard";

interface Company {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  primaryColor: string;
  secondaryColor?: string | null;
}

interface CompanyGridProps {
  companies: Company[];
}

export function CompanyGrid({ companies }: CompanyGridProps) {
  if (companies.length === 0) {
    return (
      <p className="text-sm text-slate-500 py-4">
        No hay empresas registradas.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {companies.map((company) => (
        <CompanyCard key={company.id} company={company} />
      ))}
    </div>
  );
}
