import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import {
  GraduationCap, Briefcase, Zap, Globe, Award,
  MapPin, ExternalLink, Mail, Phone, Download,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const profile = await prisma.employeeProfile.findUnique({
    where: { publicSlug: slug },
    include: { employee: { select: { firstName: true, lastName: true } } },
  });
  if (!profile) return { title: "Perfil no encontrado" };
  return {
    title: `${profile.employee.firstName} ${profile.employee.lastName} — OmarIA`,
    description: profile.headline ?? `Perfil profesional de ${profile.employee.firstName} ${profile.employee.lastName}`,
  };
}

export default async function PublicProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const profile = await prisma.employeeProfile.findUnique({
    where: { publicSlug: slug },
    include: {
      employee: {
        select: {
          firstName: true,
          lastName: true,
          avatarUrl: true,
          city: true,
          personalEmail: true,
          phone: true,
          position: { select: { title: true } },
          department: {
            select: {
              name: true,
              company: { select: { name: true, primaryColor: true, logoUrl: true } },
            },
          },
        },
      },
      education: { orderBy: { startYear: "desc" } },
      experience: { orderBy: { startDate: "desc" } },
      skills: { orderBy: { category: "asc" } },
      languages: true,
      certifications: { orderBy: { issueYear: "desc" } },
    },
  });

  if (!profile || !profile.isPublic) notFound();

  const emp = profile.employee;
  const company = emp.department?.company;
  const initials = `${emp.firstName[0] ?? ""}${emp.lastName[0] ?? ""}`.toUpperCase();

  const skillsByCategory = profile.skills.reduce<Record<string, typeof profile.skills>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});

  const LANG_LEVEL_COLORS: Record<string, string> = {
    A1: "bg-slate-100 text-slate-600",
    A2: "bg-slate-100 text-slate-700",
    B1: "bg-green-100 text-green-700",
    B2: "bg-blue-100 text-blue-700",
    C1: "bg-indigo-100 text-indigo-700",
    C2: "bg-purple-100 text-purple-700",
    Nativo: "bg-amber-100 text-amber-700",
  };

  const SKILL_LEVEL_LABELS: Record<number, string> = {
    1: "Básico", 2: "Elemental", 3: "Intermedio", 4: "Avanzado", 5: "Experto",
  };

  function fmtDate(iso: string | Date) {
    return new Date(iso).toLocaleDateString("es-EC", { month: "short", year: "numeric" });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="h-1 w-full" style={{ backgroundColor: company?.primaryColor ?? "#1B3D5C" }} />

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">

        {/* Header card */}
        <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
          <div className="h-28 w-full" style={{ background: `linear-gradient(135deg, ${company?.primaryColor ?? "#1B3D5C"} 0%, #6366f1 100%)` }} />

          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
              <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                <AvatarImage src={emp.avatarUrl ?? undefined} />
                <AvatarFallback
                  className="text-2xl font-bold text-white"
                  style={{ backgroundColor: company?.primaryColor ?? "#1B3D5C" }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0 pb-1">
                <h1 className="text-2xl font-bold text-slate-900">{emp.firstName} {emp.lastName}</h1>
                {profile.headline && (
                  <p className="text-base font-medium text-slate-600 mt-0.5">{profile.headline}</p>
                )}
                <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-500">
                  {emp.position?.title && (
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5" />
                      {emp.position.title}
                    </span>
                  )}
                  {emp.department?.company?.name && (
                    <span className="flex items-center gap-1">
                      · {emp.department.company.name}
                    </span>
                  )}
                  {emp.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {emp.city}
                    </span>
                  )}
                </div>
              </div>

              {profile.cvUrl && (
                <a
                  href={profile.cvUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
                  style={{ backgroundColor: company?.primaryColor ?? "#1B3D5C" }}
                >
                  <Download className="h-4 w-4" />
                  Descargar CV
                </a>
              )}
            </div>

            {/* Summary */}
            {profile.summary && (
              <div className="mt-5 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap border-t border-slate-100 pt-4">
                {profile.summary}
              </div>
            )}

            {/* Social links */}
            <div className="flex flex-wrap gap-3 mt-4">
              {emp.personalEmail && (
                <a href={`mailto:${emp.personalEmail}`} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors">
                  <Mail className="h-3.5 w-3.5" /> {emp.personalEmail}
                </a>
              )}
              {emp.phone && (
                <a href={`tel:${emp.phone}`} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors">
                  <Phone className="h-3.5 w-3.5" /> {emp.phone}
                </a>
              )}
              {profile.linkedinUrl && (
                <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                  <Globe className="h-3.5 w-3.5" /> LinkedIn
                </a>
              )}
              {profile.githubUrl && (
                <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                  <Globe className="h-3.5 w-3.5" /> GitHub
                </a>
              )}
              {profile.websiteUrl && (
                <a href={profile.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                  <ExternalLink className="h-3.5 w-3.5" /> Sitio web
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Left column */}
          <div className="md:col-span-2 space-y-6">

            {/* Experience */}
            {profile.experience.length > 0 && (
              <Section title="Experiencia Laboral" icon={<Briefcase className="h-4 w-4" />} color={company?.primaryColor}>
                <div className="space-y-5">
                  {profile.experience.map(exp => (
                    <div key={exp.id} className="relative pl-6 border-l-2 border-slate-200">
                      <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-slate-400" />
                      <p className="font-semibold text-slate-900 text-sm">{exp.position}</p>
                      <p className="text-sm text-slate-600">{exp.company}{exp.location ? ` · ${exp.location}` : ""}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {fmtDate(exp.startDate)} – {exp.current ? "Actualidad" : (exp.endDate ? fmtDate(exp.endDate) : "")}
                      </p>
                      {exp.description && <p className="text-sm text-slate-500 mt-1 leading-relaxed">{exp.description}</p>}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Education */}
            {(profile.education.length > 0 || profile.senescytUrl) && (
              <Section title="Formación Académica" icon={<GraduationCap className="h-4 w-4" />} color={company?.primaryColor}>
                <div className="space-y-4">
                  {profile.education.map(edu => (
                    <div key={edu.id} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${company?.primaryColor ?? "#1B3D5C"}15` }}>
                        <GraduationCap className="h-4 w-4" style={{ color: company?.primaryColor ?? "#1B3D5C" }} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{edu.degree} · {edu.field}</p>
                        <p className="text-sm text-slate-600">{edu.institution}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {edu.startYear} – {edu.current ? "Actualidad" : (edu.endYear ?? "")}
                        </p>
                        {edu.description && <p className="text-xs text-slate-500 mt-0.5">{edu.description}</p>}
                        {edu.fileUrl && (
                          <a href={edu.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1">
                            <ExternalLink className="h-3 w-3" />
                            {edu.fileName ?? "Ver documento"}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                  {profile.senescytUrl && (
                    <div className="flex items-center gap-3 pt-3 mt-1 border-t border-slate-100">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                        <GraduationCap className="h-4 w-4" style={{ color: company?.primaryColor ?? "#1B3D5C" }} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Certificado Senescyt</p>
                        <a
                          href={profile.senescytUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-0.5"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          {profile.senescytFileName ?? "Ver certificado"}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* Certifications */}
            {profile.certifications.length > 0 && (
              <Section title="Certificaciones y Cursos" icon={<Award className="h-4 w-4" />} color={company?.primaryColor}>
                <div className="space-y-3">
                  {profile.certifications.map(cert => (
                    <div key={cert.id} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                        <Award className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{cert.name}</p>
                        <p className="text-sm text-slate-600">{cert.issuer}</p>
                        {cert.issueYear && <p className="text-xs text-slate-400 mt-0.5">{cert.issueYear}{cert.expiryYear ? ` – ${cert.expiryYear}` : ""}</p>}
                        {cert.credentialUrl && (
                          <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5">
                            <ExternalLink className="h-3 w-3" /> Ver credencial
                          </a>
                        )}
                        {cert.fileUrl && (
                          <a href={cert.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5">
                            <ExternalLink className="h-3 w-3" /> {cert.fileName ?? "Ver archivo"}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-6">

            {/* Skills */}
            {profile.skills.length > 0 && (
              <Section title="Habilidades" icon={<Zap className="h-4 w-4" />} color={company?.primaryColor}>
                <div className="space-y-4">
                  {Object.entries(skillsByCategory).map(([cat, skills]) => (
                    <div key={cat}>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{cat}</p>
                      <div className="space-y-2">
                        {skills.map(skill => (
                          <div key={skill.id}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-slate-700 font-medium">{skill.name}</span>
                              <span className="text-slate-400">{SKILL_LEVEL_LABELS[skill.level]}</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${(skill.level / 5) * 100}%`,
                                  backgroundColor: company?.primaryColor ?? "#1B3D5C",
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Languages */}
            {profile.languages.length > 0 && (
              <Section title="Idiomas" icon={<Globe className="h-4 w-4" />} color={company?.primaryColor}>
                <div className="space-y-2">
                  {profile.languages.map(lang => (
                    <div key={lang.id} className="flex items-center justify-between">
                      <span className="text-sm text-slate-700">{lang.language}</span>
                      <Badge className={`text-xs border-0 ${LANG_LEVEL_COLORS[lang.level] ?? "bg-slate-100 text-slate-600"}`}>
                        {lang.level}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 py-4 border-t border-slate-200">
          Perfil generado con{" "}
          <span className="font-semibold" style={{ color: company?.primaryColor ?? "#1B3D5C" }}>OmarIA</span>
          {" "}· SG Consulting Group
        </div>
      </div>
    </div>
  );
}

function Section({
  title, icon, children, color,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  color?: string | null;
}) {
  return (
    <div className="rounded-xl bg-white shadow-sm border border-slate-100 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
        <span style={{ color: color ?? "#1B3D5C" }}>{icon}</span>
        <h2 className="font-semibold text-slate-900 text-sm">{title}</h2>
      </div>
      <div className="px-5 py-4">
        {children}
      </div>
    </div>
  );
}
