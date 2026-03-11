import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface Company {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  primaryColor: string;
  secondaryColor?: string | null;
}

export function CompanyCard({ company }: { company: Company }) {
  return (
    <Link
      href={`/organigram/${company.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
    >
      {/* Barra de color de marca */}
      <div className="h-1.5 w-full" style={{ backgroundColor: company.primaryColor }} />

      {/* Área del logo */}
      <div className="flex items-center justify-center p-8 min-h-[140px] bg-slate-50/60">
        {company.logoUrl ? (
          <div className="relative h-20 w-40">
            <Image
              src={company.logoUrl}
              alt={`Logo ${company.name}`}
              fill
              className="object-contain"
              sizes="160px"
            />
          </div>
        ) : (
          <div
            className="flex h-16 w-16 items-center justify-center rounded-xl text-2xl font-bold text-white"
            style={{ backgroundColor: company.primaryColor }}
          >
            {company.name[0]}
          </div>
        )}
      </div>

      {/* Info + acción */}
      <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
        <div>
          <p className="font-semibold text-slate-900">{company.name}</p>
          <p className="text-xs text-slate-400 mt-0.5">Ver organigrama</p>
        </div>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full transition-all group-hover:scale-110"
          style={{ backgroundColor: `${company.primaryColor}20` }}
        >
          <ArrowRight
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
            style={{ color: company.primaryColor }}
          />
        </div>
      </div>
    </Link>
  );
}
