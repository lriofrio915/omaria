export const dynamic = 'force-dynamic';

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import {
  GraduationCap, Briefcase, Zap, Globe, Award,
  MapPin, ExternalLink, Mail, Phone, Download,
  Building2, Calendar, Link2, BookOpen,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  const primary = company?.primaryColor ?? "#1B3D5C";
  const initials = `${emp.firstName[0] ?? ""}${emp.lastName[0] ?? ""}`.toUpperCase();

  const skillsByCategory = profile.skills.reduce<Record<string, typeof profile.skills>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});

  const LANG_LEVEL: Record<string, { bg: string; text: string; label: string }> = {
    A1: { bg: "#f1f5f9", text: "#64748b", label: "Básico" },
    A2: { bg: "#f1f5f9", text: "#475569", label: "Elemental" },
    B1: { bg: "#dcfce7", text: "#15803d", label: "Intermedio" },
    B2: { bg: "#dbeafe", text: "#1d4ed8", label: "Intermedio alto" },
    C1: { bg: "#ede9fe", text: "#6d28d9", label: "Avanzado" },
    C2: { bg: "#fae8ff", text: "#86198f", label: "Proficiente" },
    Nativo: { bg: "#fef9c3", text: "#92400e", label: "Nativo" },
  };

  const SKILL_LABELS: Record<number, string> = {
    1: "Básico", 2: "Elemental", 3: "Intermedio", 4: "Avanzado", 5: "Experto",
  };

  function fmtDate(iso: string | Date) {
    return new Date(iso).toLocaleDateString("es-EC", { month: "short", year: "numeric" });
  }

  return (
    <div className="min-h-screen bg-gray-50 antialiased">

      {/* Banner */}
      <div
        className="h-40 sm:h-52 w-full relative overflow-hidden"
        style={{ backgroundColor: primary }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(ellipse at 70% 40%, rgba(255,255,255,0.12) 0%, transparent 60%),
                              radial-gradient(ellipse at 20% 80%, rgba(0,0,0,0.15) 0%, transparent 50%)`,
          }}
        />
      </div>

      {/* Profile card */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="relative -mt-14 sm:-mt-16 bg-white rounded-2xl shadow-lg overflow-hidden">

          {/* Top accent line */}
          <div className="h-1 w-full" style={{ backgroundColor: primary }} />

          <div className="p-5 sm:p-8">

            {/* Avatar + info row */}
            <div className="flex flex-col sm:flex-row gap-5 sm:gap-6">

              {/* Avatar */}
              <div className="shrink-0">
                <Avatar className="h-24 w-24 sm:h-28 sm:w-28 ring-4 ring-white shadow-md">
                  <AvatarImage src={emp.avatarUrl ?? undefined} />
                  <AvatarFallback
                    className="text-white text-2xl font-bold"
                    style={{ backgroundColor: primary }}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Name + headline + meta */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                      {emp.firstName} {emp.lastName}
                    </h1>
                    {profile.headline && (
                      <p className="text-base sm:text-lg text-gray-500 font-medium mt-1 leading-snug">
                        {profile.headline}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-sm text-gray-500">
                      {emp.position?.title && (
                        <span className="flex items-center gap-1.5">
                          <Briefcase className="h-3.5 w-3.5 shrink-0" />
                          {emp.position.title}
                        </span>
                      )}
                      {company?.name && (
                        <span className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 shrink-0" />
                          {company.name}
                        </span>
                      )}
                      {emp.city && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
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
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity shrink-0 self-start"
                      style={{ backgroundColor: primary }}
                    >
                      <Download className="h-4 w-4" />
                      Descargar CV
                    </a>
                  )}
                </div>

                {/* Summary */}
                {profile.summary && (
                  <p className="mt-4 pt-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 whitespace-pre-wrap">
                    {profile.summary}
                  </p>
                )}

                {/* Contact chips */}
                {(emp.personalEmail || emp.phone || profile.linkedinUrl || profile.githubUrl || profile.websiteUrl) && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {emp.personalEmail && (
                      <a
                        href={`mailto:${emp.personalEmail}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full text-xs text-gray-700 font-medium transition-colors"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        {emp.personalEmail}
                      </a>
                    )}
                    {emp.phone && (
                      <a
                        href={`tel:${emp.phone}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full text-xs text-gray-700 font-medium transition-colors"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        {emp.phone}
                      </a>
                    )}
                    {profile.linkedinUrl && (
                      <a
                        href={profile.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-full text-xs text-blue-700 font-semibold transition-colors"
                      >
                        <Link2 className="h-3.5 w-3.5" />
                        LinkedIn
                      </a>
                    )}
                    {profile.githubUrl && (
                      <a
                        href={profile.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full text-xs text-gray-700 font-semibold transition-colors"
                      >
                        <Link2 className="h-3.5 w-3.5" />
                        GitHub
                      </a>
                    )}
                    {profile.websiteUrl && (
                      <a
                        href={profile.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full text-xs text-gray-700 font-semibold transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Sitio web
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content grid */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6 pb-16">

          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Experience */}
            {profile.experience.length > 0 && (
              <Section title="Experiencia Laboral" icon={<Briefcase className="h-4 w-4" />} color={primary}>
                <div className="space-y-0">
                  {profile.experience.map((exp, i) => (
                    <div key={exp.id} className="flex gap-4">
                      {/* Timeline indicator */}
                      <div className="flex flex-col items-center shrink-0 pt-0.5">
                        <div
                          className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                          style={{ backgroundColor: `${primary}18` }}
                        >
                          <Briefcase className="h-3.5 w-3.5" style={{ color: primary }} />
                        </div>
                        {i < profile.experience.length - 1 && (
                          <div className="w-px flex-1 bg-gray-100 my-1 min-h-[1.5rem]" />
                        )}
                      </div>
                      {/* Content */}
                      <div className={`pb-6 flex-1 min-w-0 ${i < profile.experience.length - 1 ? "" : "pb-0"}`}>
                        <p className="font-semibold text-gray-900 text-sm leading-snug">{exp.position}</p>
                        <p className="text-sm text-gray-600 mt-0.5">
                          {exp.company}
                          {exp.location ? <span className="text-gray-400"> · {exp.location}</span> : null}
                        </p>
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 shrink-0" />
                          {fmtDate(exp.startDate)} – {exp.current ? "Presente" : exp.endDate ? fmtDate(exp.endDate) : ""}
                        </p>
                        {exp.description && (
                          <p className="text-sm text-gray-500 mt-2 leading-relaxed">{exp.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Education */}
            {(profile.education.length > 0 || profile.senescytUrl) && (
              <Section title="Formación Académica" icon={<GraduationCap className="h-4 w-4" />} color={primary}>
                <div className="space-y-5">
                  {profile.education.map(edu => (
                    <div key={edu.id} className="flex gap-4">
                      <div
                        className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                        style={{ backgroundColor: `${primary}18` }}
                      >
                        <GraduationCap className="h-4 w-4" style={{ color: primary }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm leading-snug">
                          {edu.degree}
                          {edu.field ? <span className="font-normal text-gray-500"> · {edu.field}</span> : null}
                        </p>
                        <p className="text-sm text-gray-600 mt-0.5">{edu.institution}</p>
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 shrink-0" />
                          {edu.startYear} – {edu.current ? "Presente" : edu.endYear ?? ""}
                        </p>
                        {edu.description && (
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{edu.description}</p>
                        )}
                        {edu.fileUrl && (
                          <a
                            href={edu.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium mt-2 hover:underline"
                            style={{ color: primary }}
                          >
                            <ExternalLink className="h-3 w-3" />
                            {edu.fileName ?? "Ver documento"}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}

                  {profile.senescytUrl && (
                    <div className="flex gap-4 pt-2 border-t border-gray-100">
                      <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                        <BookOpen className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Registro Senescyt
                        </p>
                        <a
                          href={profile.senescytUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline mt-0.5"
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
              <Section title="Certificaciones y Cursos" icon={<Award className="h-4 w-4" />} color={primary}>
                <div className="space-y-4">
                  {profile.certifications.map(cert => (
                    <div key={cert.id} className="flex gap-4">
                      <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                        <Award className="h-4 w-4 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm leading-snug">{cert.name}</p>
                        <p className="text-sm text-gray-600 mt-0.5">{cert.issuer}</p>
                        {cert.issueYear && (
                          <p className="text-xs text-gray-400 mt-1">
                            {cert.issueYear}{cert.expiryYear ? ` – ${cert.expiryYear}` : ""}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-3 mt-1.5">
                          {cert.credentialUrl && (
                            <a
                              href={cert.credentialUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium hover:underline"
                              style={{ color: primary }}
                            >
                              <ExternalLink className="h-3 w-3" />
                              Ver credencial
                            </a>
                          )}
                          {cert.fileUrl && (
                            <a
                              href={cert.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium hover:underline"
                              style={{ color: primary }}
                            >
                              <ExternalLink className="h-3 w-3" />
                              {cert.fileName ?? "Ver archivo"}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">

            {/* Skills */}
            {profile.skills.length > 0 && (
              <Section title="Habilidades" icon={<Zap className="h-4 w-4" />} color={primary}>
                <div className="space-y-5">
                  {Object.entries(skillsByCategory).map(([cat, skills]) => (
                    <div key={cat}>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                        {cat}
                      </p>
                      <div className="space-y-3">
                        {skills.map(skill => (
                          <div key={skill.id}>
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="text-sm font-medium text-gray-800">{skill.name}</span>
                              <span className="text-xs text-gray-400">{SKILL_LABELS[skill.level]}</span>
                            </div>
                            {/* Dot indicator */}
                            <div className="flex gap-1.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <div
                                  key={i}
                                  className="h-2 flex-1 rounded-full transition-colors"
                                  style={{
                                    backgroundColor: i < skill.level
                                      ? primary
                                      : "#e5e7eb",
                                    opacity: i < skill.level ? (0.5 + (i / skill.level) * 0.5) : 1,
                                  }}
                                />
                              ))}
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
              <Section title="Idiomas" icon={<Globe className="h-4 w-4" />} color={primary}>
                <div className="space-y-3">
                  {profile.languages.map(lang => {
                    const lvl = LANG_LEVEL[lang.level] ?? { bg: "#f1f5f9", text: "#64748b", label: lang.level };
                    return (
                      <div key={lang.id} className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-gray-800">{lang.language}</span>
                        <span
                          className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
                          style={{ backgroundColor: lvl.bg, color: lvl.text }}
                        >
                          {lang.level}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}

          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 text-center">
          <p className="text-xs text-gray-400">
            Perfil generado con{" "}
            <span className="font-bold" style={{ color: primary }}>OmarIA</span>
            {" "}· SG Consulting Group
          </p>
        </div>
      </footer>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
  color,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  color?: string | null;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 sm:px-6 py-4 border-b border-gray-100">
        <span style={{ color: color ?? "#1B3D5C" }}>{icon}</span>
        <h2 className="font-bold text-gray-900 text-sm tracking-tight">{title}</h2>
      </div>
      <div className="px-5 sm:px-6 py-5">
        {children}
      </div>
    </div>
  );
}
