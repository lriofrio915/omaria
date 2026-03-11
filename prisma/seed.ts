import * as dotenv from "dotenv";
dotenv.config();

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, CompetencyLevel } from "../src/generated/prisma";

const pool = new Pool({
  host: process.env.DB_HOST_POOLER!,
  port: 6543,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: "postgres",
  ssl: { rejectUnauthorized: false },
});

const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const L = CompetencyLevel;

async function upsertCompetency(name: string, category: string, description: string) {
  return prisma.competency.upsert({
    where: { name },
    create: { name, category, description },
    update: { category, description },
  });
}

async function upsertDept(id: string, name: string, companyId: string, description?: string, parentId?: string) {
  return prisma.department.upsert({
    where: { id },
    create: { id, name, companyId, description, parentId },
    update: { name, companyId, description, parentId },
  });
}

async function upsertPosition(
  id: string,
  title: string,
  departmentId: string,
  opts: {
    purpose: string;
    responsibilities: string[];
    education: string;
    experience: string;
    skills: string[];
    level?: number;
  }
) {
  return prisma.position.upsert({
    where: { id },
    create: { id, title, departmentId, ...opts },
    update: { title, departmentId, ...opts },
  });
}

async function upsertEmployee(
  id: string,
  data: {
    userId: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    email: string;
    bio: string;
    hireDate: Date;
    departmentId: string;
    positionId: string;
    managerId?: string;
    phone?: string;
  }
) {
  return prisma.employee.upsert({
    where: { id },
    create: { id, ...data, status: "ACTIVE", contractType: "INDEFINITE" },
    update: { ...data },
  });
}

async function setPositionCompetencies(
  positionId: string,
  reqs: { competencyId: string; requiredLevel: CompetencyLevel; isCritical?: boolean }[]
) {
  await prisma.positionCompetency.deleteMany({ where: { positionId } });
  await prisma.positionCompetency.createMany({
    data: reqs.map((r) => ({ positionId, ...r })),
  });
}

async function setEmployeeCompetencies(
  employeeId: string,
  levels: { competencyId: string; currentLevel: CompetencyLevel }[]
) {
  await prisma.employeeCompetency.deleteMany({ where: { employeeId } });
  await prisma.employeeCompetency.createMany({
    data: levels.map((l) => ({ employeeId, ...l })),
  });
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
async function main() {
  console.log("🌱 Iniciando seed completo de OmarIA...\n");

  // ── 1. EMPRESAS ──────────────────────────────────────────────────────────
  const companyData = [
    {
      name: "Emporium",
      slug: "emporium",
      description: "Fintech de gestión de capital e inversiones",
      logoUrl: "https://res.cloudinary.com/deusntwkn/image/upload/v1773262182/emporium_logo_jthk74.png",
      primaryColor: "#1B52B5",
      secondaryColor: "#9EA8B3",
    },
    {
      name: "Adwa Creativa",
      slug: "adwa",
      description: "Agencia de marketing y publicidad",
      logoUrl: "https://res.cloudinary.com/deusntwkn/image/upload/v1773262182/adwa_logo_kaigng.png",
      primaryColor: "#9B00FF",
      secondaryColor: "#6A00B0",
    },
    {
      name: "Livin",
      slug: "livin",
      description: "Broker de seguros y gestión de riesgos",
      logoUrl: "https://res.cloudinary.com/deusntwkn/image/upload/v1773262181/livin_logo_zhkqkw.png",
      primaryColor: "#8B6B9E",
      secondaryColor: "#F3EEF8",
    },
    {
      name: "Spartans",
      slug: "spartans",
      description: "Club de basketball profesional",
      logoUrl: "https://res.cloudinary.com/deusntwkn/image/upload/v1773262182/spartans_logo_xk8t8c.png",
      primaryColor: "#54C238",
      secondaryColor: "#F37320",
    },
  ];

  const companies: Record<string, string> = {};
  for (const c of companyData) {
    const company = await prisma.company.upsert({
      where: { slug: c.slug },
      create: c,
      update: c,
    });
    companies[c.slug] = company.id;
    console.log(`✅ Empresa: ${company.name}`);
  }

  // ── 2. CATÁLOGO DE COMPETENCIAS ──────────────────────────────────────────
  console.log("\n📋 Creando catálogo de competencias...");
  const comps: Record<string, string> = {};

  const competencyList = [
    // Directivas
    { key: "liderazgo", name: "Liderazgo Estratégico", cat: "Directiva", desc: "Capacidad de definir visión y alinear equipos hacia objetivos organizacionales" },
    { key: "decisiones", name: "Toma de Decisiones", cat: "Directiva", desc: "Análisis crítico para tomar decisiones informadas bajo presión" },
    { key: "recursos", name: "Gestión de Recursos", cat: "Directiva", desc: "Optimización eficiente de presupuestos, personal y activos" },
    { key: "vision", name: "Visión Empresarial", cat: "Directiva", desc: "Comprensión integral del negocio, mercado y tendencias futuras" },
    { key: "negociacion", name: "Negociación Estratégica", cat: "Directiva", desc: "Capacidad de alcanzar acuerdos mutuamente beneficiosos con stakeholders" },
    // Técnicas
    { key: "analisis", name: "Análisis Técnico", cat: "Técnica", desc: "Capacidad de descomponer problemas complejos y proponer soluciones sistémicas" },
    { key: "herramientas", name: "Dominio de Herramientas Digitales", cat: "Técnica", desc: "Fluidez con tecnologías y plataformas específicas del rol" },
    { key: "datos", name: "Gestión de Datos", cat: "Técnica", desc: "Extracción, análisis e interpretación de información para toma de decisiones" },
    { key: "seguridad", name: "Ciberseguridad", cat: "Técnica", desc: "Comprensión y aplicación de prácticas seguras en sistemas y datos" },
    { key: "normativa", name: "Conocimiento Normativo", cat: "Técnica", desc: "Comprensión de regulaciones y normas aplicables al sector" },
    // Blandas
    { key: "comunicacion", name: "Comunicación Efectiva", cat: "Blanda", desc: "Capacidad de expresar ideas con claridad, oral y escrita" },
    { key: "cliente", name: "Orientación al Cliente", cat: "Blanda", desc: "Comprensión de necesidades y enfoque en satisfacción del cliente" },
    { key: "equipo", name: "Trabajo en Equipo", cat: "Blanda", desc: "Colaboración armónica con diversidad de perfiles y personalidades" },
    { key: "adaptabilidad", name: "Adaptabilidad", cat: "Blanda", desc: "Capacidad de responder ágilmente a cambios del entorno" },
    { key: "emocional", name: "Inteligencia Emocional", cat: "Blanda", desc: "Autorregulación, autoconciencia y manejo de relaciones interpersonales" },
    { key: "problemas", name: "Resolución de Problemas", cat: "Blanda", desc: "Creatividad e iniciativa para superar obstáculos" },
    { key: "aprendizaje", name: "Aprendizaje Continuo", cat: "Blanda", desc: "Disposición a actualizar conocimientos y habilidades permanentemente" },
    { key: "critico", name: "Pensamiento Crítico", cat: "Blanda", desc: "Análisis profundo sin aceptar supuestos sin validar" },
  ];

  for (const c of competencyList) {
    const comp = await upsertCompetency(c.name, c.cat, c.desc);
    comps[c.key] = comp.id;
  }
  console.log(`   ${competencyList.length} competencias registradas`);

  // ─────────────────────────────────────────────────────────────────────────
  // ADWA CREATIVA
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n🎨 Construyendo Adwa Creativa...");
  const adwaId = companies["adwa"];

  const adwaDepts = {
    dir: await upsertDept("dept-adwa-dir", "Dirección General", adwaId, "Dirección estratégica de la agencia"),
    creativo: await upsertDept("dept-adwa-cre", "Departamento Creativo", adwaId, "Diseño, conceptualización y producción visual", "dept-adwa-dir"),
    cuentas: await upsertDept("dept-adwa-cue", "Cuentas y Estrategia", adwaId, "Gestión de relaciones con clientes", "dept-adwa-dir"),
    digital: await upsertDept("dept-adwa-dig", "Digital y Performance", adwaId, "Marketing digital, SEO/SEM y analítica", "dept-adwa-dir"),
    admin: await upsertDept("dept-adwa-adm", "Administración y Finanzas", adwaId, "Gestión operativa y financiera", "dept-adwa-dir"),
  };

  const adwaPos = {
    dirGeneral: await upsertPosition("pos-adwa-dg", "Director General", adwaDepts.dir.id, {
      level: 1,
      purpose: "Responsable de la dirección estratégica, rentabilidad y crecimiento de la agencia. Define la visión de negocio, supervisa todas las operaciones y gestiona relaciones con clientes clave e inversores.",
      responsibilities: ["Definir estrategia comercial y objetivos anuales de la agencia", "Supervisar desempeño financiero y gestionar presupuesto general", "Mantener y expandir cartera de clientes estratégicos", "Liderar cultura organizacional y gestión del talento", "Representar la agencia ante clientes, proveedores y medios"],
      education: "Licenciatura en Administración, Marketing o Negocios. MBA preferible.",
      experience: "7-10 años en gestión empresarial, mínimo 3 años en rol directivo en agencias.",
      skills: ["Dirección estratégica", "Gestión P&L", "Pitch de cuentas", "Negociación de contratos", "Liderazgo de equipos creativos"],
    }),
    dirCreativo: await upsertPosition("pos-adwa-dc", "Director Creativo", adwaDepts.creativo.id, {
      level: 2,
      purpose: "Lidera toda la producción creativa de la agencia. Define el estilo visual, conceptos estratégicos y asegura que todas las propuestas cumplan estándares de excelencia alineados con el brand del cliente.",
      responsibilities: ["Conceptualizar y desarrollar ideas creativas para campañas", "Revisar y aprobar todo trabajo creativo antes de entrega", "Mentorizar y dirigir equipo de diseñadores y creativos", "Presentar propuestas creativas a clientes directamente", "Mantenerse actualizado en tendencias de diseño y comunicación visual"],
      education: "Licenciatura en Diseño Gráfico, Artes Visuales, Publicidad o Comunicación.",
      experience: "5-8 años como diseñador/creativo, mínimo 2 años en liderazgo de equipo creativo.",
      skills: ["Adobe Creative Suite", "Figma", "Dirección de arte", "Conceptualización creativa", "Branding y identidad visual"],
    }),
    dirCuentas: await upsertPosition("pos-adwa-dcu", "Director de Cuentas", adwaDepts.cuentas.id, {
      level: 2,
      purpose: "Gestiona la relación entre la agencia y sus clientes. Entiende las necesidades comerciales del cliente, coordina soluciones integradas entre departamentos internos y asegura satisfacción y retención.",
      responsibilities: ["Entender profundamente el negocio y objetivos de cada cliente", "Coordinar briefs y requerimientos entre cliente y equipos internos", "Presentar propuestas y resultados de campaña a clientes", "Identificar oportunidades de servicios adicionales (upselling)", "Reportar sobre avance, resultados y rentabilidad por cuenta"],
      education: "Licenciatura en Administración, Marketing, Comunicación o Negocios.",
      experience: "3-5 años en gestión de cuentas o roles comerciales en agencias.",
      skills: ["Gestión de clientes", "Briefing creativo", "Presentaciones ejecutivas", "Herramientas de gestión de proyectos", "Análisis de ROI de campañas"],
    }),
    gerenteDigital: await upsertPosition("pos-adwa-gd", "Gerente de Marketing Digital", adwaDepts.digital.id, {
      level: 2,
      purpose: "Especialista en estrategias digitales y ejecución en canales online. Gestiona campañas SEO/SEM, redes sociales y analítica digital para los clientes de la agencia.",
      responsibilities: ["Diseñar y ejecutar estrategias de marketing digital para clientes", "Gestionar presupuestos en plataformas publicitarias (Google Ads, Meta)", "Analizar métricas y reportar resultados de campañas con KPIs", "Optimizar performance y ROI de campañas continuamente", "Mantenerse actualizado en algoritmos y cambios de plataformas"],
      education: "Licenciatura en Marketing, Administración, Sistemas o afín.",
      experience: "3-5 años en marketing digital, con experiencia comprobada en manejo de cuentas.",
      skills: ["Google Ads", "Meta Ads", "Google Analytics 4", "SEO técnico", "Power BI o Looker Studio"],
    }),
    disenador: await upsertPosition("pos-adwa-dis", "Diseñador Gráfico Senior", adwaDepts.creativo.id, {
      level: 3,
      purpose: "Profesional creativo responsable de la producción visual de proyectos. Crea piezas gráficas, diseña interfaces y material promocional bajo dirección del Director Creativo.",
      responsibilities: ["Crear diseños gráficos según especificaciones de proyectos", "Desarrollar conceptos visuales e interfaces web y mobile", "Producir variantes y adaptaciones de diseños para múltiples formatos", "Colaborar con equipo creativo en sesiones de brainstorming", "Mantener consistencia con brand guidelines del cliente"],
      education: "Licenciatura o Técnico en Diseño Gráfico, Artes Visuales o Comunicación Visual.",
      experience: "3-5 años como diseñador gráfico con portfolio sólido.",
      skills: ["Adobe Illustrator", "Adobe Photoshop", "Figma", "Motion graphics", "Diseño UI/UX"],
    }),
    asistente: await upsertPosition("pos-adwa-ast", "Asistente Administrativo", adwaDepts.admin.id, {
      level: 3,
      purpose: "Apoyo operacional de la agencia. Gestiona calendarios, coordina reuniones, mantiene archivo de proyectos y soporta operaciones diarias de todos los departamentos.",
      responsibilities: ["Organizar agenda de directivos y coordinar reuniones", "Coordinar envíos de propuestas, contratos y documentación", "Mantener base de datos de clientes y proyectos actualizada", "Generar reportes operacionales y de facturación", "Apoyo en organización de eventos internos de la agencia"],
      education: "Licenciatura en Administración, Secretariado Ejecutivo o Técnico Administrativo.",
      experience: "1-2 años como asistente administrativo o similar.",
      skills: ["Microsoft Office 365", "Google Workspace", "CRM básico", "Gestión documental", "Facturación electrónica"],
    }),
  };

  // Competencias requeridas por posición - Adwa
  await setPositionCompetencies("pos-adwa-dg", [
    { competencyId: comps.liderazgo, requiredLevel: L.ADVANCED, isCritical: true },
    { competencyId: comps.vision, requiredLevel: L.EXPERT, isCritical: true },
    { competencyId: comps.negociacion, requiredLevel: L.ADVANCED },
    { competencyId: comps.recursos, requiredLevel: L.ADVANCED },
    { competencyId: comps.comunicacion, requiredLevel: L.ADVANCED },
    { competencyId: comps.emocional, requiredLevel: L.ADVANCED },
  ]);
  await setPositionCompetencies("pos-adwa-dc", [
    { competencyId: comps.herramientas, requiredLevel: L.EXPERT, isCritical: true },
    { competencyId: comps.critico, requiredLevel: L.ADVANCED },
    { competencyId: comps.comunicacion, requiredLevel: L.ADVANCED },
    { competencyId: comps.liderazgo, requiredLevel: L.INTERMEDIATE },
    { competencyId: comps.analisis, requiredLevel: L.ADVANCED },
  ]);
  await setPositionCompetencies("pos-adwa-dcu", [
    { competencyId: comps.negociacion, requiredLevel: L.ADVANCED, isCritical: true },
    { competencyId: comps.cliente, requiredLevel: L.ADVANCED, isCritical: true },
    { competencyId: comps.comunicacion, requiredLevel: L.ADVANCED },
    { competencyId: comps.equipo, requiredLevel: L.ADVANCED },
    { competencyId: comps.emocional, requiredLevel: L.ADVANCED },
  ]);
  await setPositionCompetencies("pos-adwa-gd", [
    { competencyId: comps.herramientas, requiredLevel: L.EXPERT, isCritical: true },
    { competencyId: comps.datos, requiredLevel: L.ADVANCED },
    { competencyId: comps.analisis, requiredLevel: L.ADVANCED },
    { competencyId: comps.critico, requiredLevel: L.ADVANCED },
    { competencyId: comps.aprendizaje, requiredLevel: L.ADVANCED },
  ]);
  await setPositionCompetencies("pos-adwa-dis", [
    { competencyId: comps.herramientas, requiredLevel: L.ADVANCED, isCritical: true },
    { competencyId: comps.critico, requiredLevel: L.INTERMEDIATE },
    { competencyId: comps.analisis, requiredLevel: L.INTERMEDIATE },
    { competencyId: comps.adaptabilidad, requiredLevel: L.INTERMEDIATE },
    { competencyId: comps.equipo, requiredLevel: L.INTERMEDIATE },
  ]);
  await setPositionCompetencies("pos-adwa-ast", [
    { competencyId: comps.herramientas, requiredLevel: L.INTERMEDIATE },
    { competencyId: comps.comunicacion, requiredLevel: L.INTERMEDIATE },
    { competencyId: comps.equipo, requiredLevel: L.INTERMEDIATE },
    { competencyId: comps.adaptabilidad, requiredLevel: L.INTERMEDIATE },
    { competencyId: comps.problemas, requiredLevel: L.BASIC },
  ]);

  // Empleados Adwa
  const adwaEmps = {
    martin: await upsertEmployee("emp-adwa-01", {
      userId: "seed-adwa-01", employeeCode: "ADW-001",
      firstName: "Martín", lastName: "Contreras",
      email: "m.contreras@adwacreativa.com",
      bio: "Director con más de 10 años liderando agencias de publicidad en LATAM. Especialista en estrategia de marca y captación de cuentas regionales.",
      hireDate: new Date("2020-03-01"), departmentId: adwaDepts.dir.id, positionId: adwaPos.dirGeneral.id,
    }),
    catalina: await upsertEmployee("emp-adwa-02", {
      userId: "seed-adwa-02", employeeCode: "ADW-002",
      firstName: "Catalina", lastName: "Rojas",
      email: "c.rojas@adwacreativa.com",
      bio: "Diseñadora con background en comunicación visual y dirección de arte para marcas retail y tecnología. Portfolio con premios regionales.",
      hireDate: new Date("2021-06-15"), departmentId: adwaDepts.creativo.id, positionId: adwaPos.dirCreativo.id,
      managerId: "emp-adwa-01",
    }),
    roberto: await upsertEmployee("emp-adwa-03", {
      userId: "seed-adwa-03", employeeCode: "ADW-003",
      firstName: "Roberto", lastName: "Sánchez",
      email: "r.sanchez@adwacreativa.com",
      bio: "Ejecutivo de cuentas con experiencia en sectores consumo masivo, banca y telecomunicaciones. Especialista en manejo de cuentas A.",
      hireDate: new Date("2021-09-01"), departmentId: adwaDepts.cuentas.id, positionId: adwaPos.dirCuentas.id,
      managerId: "emp-adwa-01",
    }),
    andrea: await upsertEmployee("emp-adwa-04", {
      userId: "seed-adwa-04", employeeCode: "ADW-004",
      firstName: "Andrea", lastName: "Luna",
      email: "a.luna@adwacreativa.com",
      bio: "Especialista en performance marketing y analítica digital. Google y Meta Ads certified. Maneja cuentas con presupuesto mensual de $50k+.",
      hireDate: new Date("2022-01-10"), departmentId: adwaDepts.digital.id, positionId: adwaPos.gerenteDigital.id,
      managerId: "emp-adwa-01",
    }),
    diego: await upsertEmployee("emp-adwa-05", {
      userId: "seed-adwa-05", employeeCode: "ADW-005",
      firstName: "Diego", lastName: "Muñoz",
      email: "d.munoz@adwacreativa.com",
      bio: "Diseñador gráfico con enfoque en branding y diseño digital. 4 años de experiencia en agencias boutique. En transición hacia motion graphics.",
      hireDate: new Date("2022-08-01"), departmentId: adwaDepts.creativo.id, positionId: adwaPos.disenador.id,
      managerId: "emp-adwa-02",
    }),
    sofia: await upsertEmployee("emp-adwa-06", {
      userId: "seed-adwa-06", employeeCode: "ADW-006",
      firstName: "Sofía", lastName: "Mendoza",
      email: "s.mendoza@adwacreativa.com",
      bio: "Asistente administrativa con formación en marketing. Organizada y proactiva, apoya en coordinación de proyectos y relación con proveedores.",
      hireDate: new Date("2023-02-01"), departmentId: adwaDepts.admin.id, positionId: adwaPos.asistente.id,
      managerId: "emp-adwa-01",
    }),
  };

  await setEmployeeCompetencies("emp-adwa-01", [
    { competencyId: comps.liderazgo, currentLevel: L.ADVANCED },
    { competencyId: comps.vision, currentLevel: L.EXPERT },
    { competencyId: comps.negociacion, currentLevel: L.ADVANCED },
    { competencyId: comps.recursos, currentLevel: L.ADVANCED },
    { competencyId: comps.comunicacion, currentLevel: L.ADVANCED },
    { competencyId: comps.emocional, currentLevel: L.INTERMEDIATE }, // brecha leve
  ]);
  await setEmployeeCompetencies("emp-adwa-02", [
    { competencyId: comps.herramientas, currentLevel: L.EXPERT },
    { competencyId: comps.critico, currentLevel: L.ADVANCED },
    { competencyId: comps.comunicacion, currentLevel: L.INTERMEDIATE }, // brecha leve
    { competencyId: comps.liderazgo, currentLevel: L.BASIC }, // brecha moderada
    { competencyId: comps.analisis, currentLevel: L.ADVANCED },
  ]);
  await setEmployeeCompetencies("emp-adwa-03", [
    { competencyId: comps.negociacion, currentLevel: L.ADVANCED },
    { competencyId: comps.cliente, currentLevel: L.ADVANCED },
    { competencyId: comps.comunicacion, currentLevel: L.ADVANCED },
    { competencyId: comps.equipo, currentLevel: L.INTERMEDIATE }, // brecha leve
    { competencyId: comps.emocional, currentLevel: L.ADVANCED },
  ]);
  await setEmployeeCompetencies("emp-adwa-04", [
    { competencyId: comps.herramientas, currentLevel: L.EXPERT },
    { competencyId: comps.datos, currentLevel: L.ADVANCED },
    { competencyId: comps.analisis, currentLevel: L.ADVANCED },
    { competencyId: comps.critico, currentLevel: L.INTERMEDIATE }, // brecha leve
    { competencyId: comps.aprendizaje, currentLevel: L.ADVANCED },
  ]);
  await setEmployeeCompetencies("emp-adwa-05", [
    { competencyId: comps.herramientas, currentLevel: L.INTERMEDIATE }, // brecha moderada
    { competencyId: comps.critico, currentLevel: L.INTERMEDIATE },
    { competencyId: comps.analisis, currentLevel: L.INTERMEDIATE },
    { competencyId: comps.adaptabilidad, currentLevel: L.ADVANCED },
    { competencyId: comps.equipo, currentLevel: L.INTERMEDIATE },
  ]);
  await setEmployeeCompetencies("emp-adwa-06", [
    { competencyId: comps.herramientas, currentLevel: L.INTERMEDIATE },
    { competencyId: comps.comunicacion, currentLevel: L.INTERMEDIATE },
    { competencyId: comps.equipo, currentLevel: L.ADVANCED },
    { competencyId: comps.adaptabilidad, currentLevel: L.INTERMEDIATE },
    { competencyId: comps.problemas, currentLevel: L.BASIC },
  ]);
  console.log(`   6 empleados de Adwa creados con ${Object.keys(adwaEmps).length} registros`);

  // ─────────────────────────────────────────────────────────────────────────
  // EMPORIUM
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n💰 Construyendo Emporium...");
  const emporiumId = companies["emporium"];

  const empDepts = {
    dir: await upsertDept("dept-emp-dir", "Dirección Ejecutiva", emporiumId, "Estrategia y liderazgo de la fintech"),
    tech: await upsertDept("dept-emp-tec", "Tecnología", emporiumId, "Desarrollo de plataforma y arquitectura", "dept-emp-dir"),
    producto: await upsertDept("dept-emp-pro", "Producto y Datos", emporiumId, "Roadmap del producto y analítica", "dept-emp-dir"),
    ops: await upsertDept("dept-emp-ops", "Operaciones y Cumplimiento", emporiumId, "Operaciones, compliance y customer success", "dept-emp-dir"),
    finanzas: await upsertDept("dept-emp-fin", "Finanzas", emporiumId, "Gestión financiera y contable", "dept-emp-dir"),
  };

  const empPos = {
    ceo: await upsertPosition("pos-emp-ceo", "CEO / Director Ejecutivo", empDepts.dir.id, {
      level: 1,
      purpose: "Máxima autoridad ejecutiva de Emporium. Define visión estratégica, lidera levantamiento de capital, toma decisiones críticas de producto y asegura viabilidad financiera y regulatoria del negocio fintech.",
      responsibilities: ["Definir y comunicar visión de largo plazo de Emporium", "Dirigir estrategia de crecimiento y expansión a nuevos mercados", "Liderar relaciones con inversionistas, bancos y reguladores", "Tomar decisiones ejecutivas sobre pivots de producto o mercado", "Asegurar alineación estratégica entre todos los departamentos"],
      education: "Licenciatura en Administración, Finanzas, Ingeniería o Economía. MBA recomendable.",
      experience: "7-12 años en roles ejecutivos, mínimo 2-3 años en startup o scaleup fintech.",
      skills: ["Estrategia corporativa", "Fundraising y relaciones con inversores", "Finanzas corporativas", "Regulación financiera", "OKRs y gestión por objetivos"],
    }),
    cto: await upsertPosition("pos-emp-cto", "CTO / Chief Technology Officer", empDepts.tech.id, {
      level: 2,
      purpose: "Responsable de toda la estrategia tecnológica y arquitectura de sistemas. Define stack tecnológico, asegura escalabilidad e infraestructura segura y lidera el equipo de desarrollo.",
      responsibilities: ["Definir arquitectura y stack tecnológico de la plataforma", "Supervisar desarrollo e implementación de features del producto", "Asegurar ciberseguridad y cumplimiento de estándares PCI-DSS", "Liderar decisiones sobre cloud infrastructure y DevOps", "Mentorizar equipo técnico y establecer best practices de código"],
      education: "Licenciatura en Ingeniería de Sistemas, Informática o Computación.",
      experience: "8-12 años en desarrollo, mínimo 3 años como tech lead o arquitecto.",
      skills: ["Arquitectura de sistemas", "Cloud AWS/GCP", "DevOps/CI-CD", "Ciberseguridad financiera", "Gestión de equipos técnicos"],
    }),
    productManager: await upsertPosition("pos-emp-pm", "Gerente de Producto", empDepts.producto.id, {
      level: 2,
      purpose: "Define el roadmap del producto, prioriza features según datos y feedback de usuarios, y coordina entre tecnología y negocio para asegurar product-market fit.",
      responsibilities: ["Definir visión y roadmap del producto fintech", "Recopilar y analizar feedback de usuarios e identificar oportunidades", "Priorizar features y escribir especificaciones detalladas", "Coordinar con equipo técnico en implementación y QA", "Medir y reportar métricas de adopción, engagement y retención"],
      education: "Licenciatura en Administración, Marketing, Ingeniería o Negocios. PM certification preferible.",
      experience: "3-6 años en product management, preferiblemente en fintech o SaaS B2B.",
      skills: ["Product roadmapping", "User stories y backlog", "A/B testing", "Métricas de producto (DAU, MAU, LTV)", "Herramientas como Jira o Linear"],
    }),
    devSenior: await upsertPosition("pos-emp-dev", "Analista Programador Senior", empDepts.tech.id, {
      level: 3,
      purpose: "Desarrollador experimentado responsable de features críticas, code review y mentoring. Referente técnico del equipo de desarrollo de la plataforma fintech.",
      responsibilities: ["Desarrollar features complejas en backend y frontend", "Realizar code review y mentorizar desarrolladores junior", "Resolver problemas técnicos complejos y proponer optimizaciones", "Documentar arquitectura y prácticas de desarrollo del equipo", "Colaborar en definición de estándares técnicos del stack"],
      education: "Licenciatura en Ingeniería, Informática o afín. Bootcamp top-tier con experiencia equivalente aceptable.",
      experience: "5-7 años como desarrollador, mínimo 2 años en rol senior.",
      skills: ["TypeScript/Node.js o Python", "Bases de datos relacionales y NoSQL", "API REST y GraphQL", "Testing automatizado", "Git y metodologías ágiles"],
    }),
    compliance: await upsertPosition("pos-emp-com", "Especialista Compliance", empDepts.ops.id, {
      level: 3,
      purpose: "Asegura cumplimiento de regulaciones financieras, prevención de lavado de dinero (AML), KYC y regulaciones de privacidad. Interfaz crítica con autoridades regulatorias.",
      responsibilities: ["Monitorear cambios en regulaciones de fintech y supervisión bancaria", "Implementar procedimientos de AML/KYC en la plataforma", "Revisar y aprobar términos de servicio y políticas de privacidad", "Reportar a autoridades según requerimientos regulatorios", "Capacitar al equipo en regulaciones aplicables al sector"],
      education: "Licenciatura en Derecho, Administración o Finanzas. Certificación AML/KYC preferible.",
      experience: "3-6 años en compliance financiero o regulación de fintech.",
      skills: ["Regulación AML/KYC", "Prevención de fraude", "GDPR/LOPD", "Reportes regulatorios", "Gestión de riesgos de cumplimiento"],
    }),
    dataAnalyst: await upsertPosition("pos-emp-da", "Especialista en Datos", empDepts.producto.id, {
      level: 3,
      purpose: "Experto en análisis de datos de usuarios, transacciones e inversiones. Genera insights que informan decisiones de producto y detecta patrones de fraude o riesgo.",
      responsibilities: ["Desarrollar queries y pipelines de datos para análisis", "Analizar comportamiento de usuarios e identificar patrones de riesgo", "Crear dashboards y reportes para stakeholders y directivos", "Detectar anomalías en transacciones e inversiones", "Colaborar con producto en diseño de experimentos y A/B testing"],
      education: "Licenciatura en Estadística, Matemáticas, Ingeniería o Ciencia de Datos.",
      experience: "2-4 años en análisis de datos o data science, preferiblemente en fintech.",
      skills: ["Python/SQL", "Tableau o Looker", "Machine Learning básico", "Estadística descriptiva e inferencial", "Detección de anomalías"],
    }),
  };

  await setPositionCompetencies("pos-emp-ceo", [
    { competencyId: comps.liderazgo, requiredLevel: L.EXPERT, isCritical: true },
    { competencyId: comps.vision, requiredLevel: L.EXPERT, isCritical: true },
    { competencyId: comps.decisiones, requiredLevel: L.EXPERT },
    { competencyId: comps.negociacion, requiredLevel: L.ADVANCED },
    { competencyId: comps.normativa, requiredLevel: L.ADVANCED },
    { competencyId: comps.adaptabilidad, requiredLevel: L.ADVANCED },
  ]);
  await setPositionCompetencies("pos-emp-cto", [
    { competencyId: comps.herramientas, requiredLevel: L.EXPERT, isCritical: true },
    { competencyId: comps.analisis, requiredLevel: L.EXPERT, isCritical: true },
    { competencyId: comps.seguridad, requiredLevel: L.ADVANCED },
    { competencyId: comps.liderazgo, requiredLevel: L.ADVANCED },
    { competencyId: comps.critico, requiredLevel: L.EXPERT },
    { competencyId: comps.comunicacion, requiredLevel: L.ADVANCED },
  ]);
  await setPositionCompetencies("pos-emp-pm", [
    { competencyId: comps.analisis, requiredLevel: L.ADVANCED, isCritical: true },
    { competencyId: comps.datos, requiredLevel: L.ADVANCED },
    { competencyId: comps.comunicacion, requiredLevel: L.ADVANCED },
    { competencyId: comps.critico, requiredLevel: L.ADVANCED },
    { competencyId: comps.equipo, requiredLevel: L.ADVANCED },
  ]);
  await setPositionCompetencies("pos-emp-dev", [
    { competencyId: comps.herramientas, requiredLevel: L.EXPERT, isCritical: true },
    { competencyId: comps.analisis, requiredLevel: L.ADVANCED },
    { competencyId: comps.seguridad, requiredLevel: L.ADVANCED },
    { competencyId: comps.problemas, requiredLevel: L.EXPERT, isCritical: true },
    { competencyId: comps.equipo, requiredLevel: L.ADVANCED },
  ]);
  await setPositionCompetencies("pos-emp-com", [
    { competencyId: comps.normativa, requiredLevel: L.EXPERT, isCritical: true },
    { competencyId: comps.analisis, requiredLevel: L.ADVANCED },
    { competencyId: comps.critico, requiredLevel: L.ADVANCED },
    { competencyId: comps.comunicacion, requiredLevel: L.ADVANCED },
    { competencyId: comps.problemas, requiredLevel: L.ADVANCED },
  ]);
  await setPositionCompetencies("pos-emp-da", [
    { competencyId: comps.datos, requiredLevel: L.EXPERT, isCritical: true },
    { competencyId: comps.herramientas, requiredLevel: L.ADVANCED },
    { competencyId: comps.analisis, requiredLevel: L.ADVANCED },
    { competencyId: comps.critico, requiredLevel: L.ADVANCED },
    { competencyId: comps.problemas, requiredLevel: L.ADVANCED },
  ]);

  await upsertEmployee("emp-emp-01", {
    userId: "seed-emp-01", employeeCode: "EMP-001",
    firstName: "Felipe", lastName: "Morales",
    email: "f.morales@emporium.io",
    bio: "Fundador de Emporium con background en banca de inversión y ecosistemas fintech. Lideró dos rondas de financiamiento semilla. Visión de democratizar el acceso al capital en LATAM.",
    hireDate: new Date("2019-06-01"), departmentId: empDepts.dir.id, positionId: empPos.ceo.id,
  });
  await upsertEmployee("emp-emp-02", {
    userId: "seed-emp-02", employeeCode: "EMP-002",
    firstName: "Alejandra", lastName: "Ortiz",
    email: "a.ortiz@emporium.io",
    bio: "Ingeniera de sistemas con maestría en ciberseguridad. Ex-arquitecta en banco digital latinoamericano. Construyó la plataforma de Emporium desde cero.",
    hireDate: new Date("2019-09-01"), departmentId: empDepts.tech.id, positionId: empPos.cto.id, managerId: "emp-emp-01",
  });
  await upsertEmployee("emp-emp-03", {
    userId: "seed-emp-03", employeeCode: "EMP-003",
    firstName: "Iván", lastName: "Quispe",
    email: "i.quispe@emporium.io",
    bio: "Product manager con experiencia en SaaS B2B y fintech. Certificado en Product Management. Ha lanzado 3 productos digitales con más de 10k usuarios.",
    hireDate: new Date("2020-08-01"), departmentId: empDepts.producto.id, positionId: empPos.productManager.id, managerId: "emp-emp-01",
  });
  await upsertEmployee("emp-emp-04", {
    userId: "seed-emp-04", employeeCode: "EMP-004",
    firstName: "Valentina", lastName: "Cruz",
    email: "v.cruz@emporium.io",
    bio: "Full-stack developer especializada en TypeScript y microservicios. Apasionada por el clean code y los sistemas de alta disponibilidad. Open source contributor.",
    hireDate: new Date("2021-01-15"), departmentId: empDepts.tech.id, positionId: empPos.devSenior.id, managerId: "emp-emp-02",
  });
  await upsertEmployee("emp-emp-05", {
    userId: "seed-emp-05", employeeCode: "EMP-005",
    firstName: "Rodrigo", lastName: "Núñez",
    email: "r.nunez@emporium.io",
    bio: "Abogado especializado en derecho financiero y regulación de fintechs. Conocimiento profundo de normativa AML/KYC en Ecuador, Colombia y Perú.",
    hireDate: new Date("2021-05-01"), departmentId: empDepts.ops.id, positionId: empPos.compliance.id, managerId: "emp-emp-01",
  });
  await upsertEmployee("emp-emp-06", {
    userId: "seed-emp-06", employeeCode: "EMP-006",
    firstName: "Mateo", lastName: "González",
    email: "m.gonzalez@emporium.io",
    bio: "Data scientist con background en economía y machine learning. Especialista en modelos predictivos de riesgo crediticio y detección de fraude.",
    hireDate: new Date("2022-03-01"), departmentId: empDepts.producto.id, positionId: empPos.dataAnalyst.id, managerId: "emp-emp-03",
  });

  await setEmployeeCompetencies("emp-emp-01", [
    { competencyId: comps.liderazgo, currentLevel: L.EXPERT },
    { competencyId: comps.vision, currentLevel: L.EXPERT },
    { competencyId: comps.decisiones, currentLevel: L.EXPERT },
    { competencyId: comps.negociacion, currentLevel: L.ADVANCED },
    { competencyId: comps.normativa, currentLevel: L.ADVANCED },
    { competencyId: comps.adaptabilidad, currentLevel: L.ADVANCED },
  ]);
  await setEmployeeCompetencies("emp-emp-02", [
    { competencyId: comps.herramientas, currentLevel: L.EXPERT },
    { competencyId: comps.analisis, currentLevel: L.EXPERT },
    { competencyId: comps.seguridad, currentLevel: L.ADVANCED },
    { competencyId: comps.liderazgo, currentLevel: L.INTERMEDIATE }, // brecha moderada
    { competencyId: comps.critico, currentLevel: L.EXPERT },
    { competencyId: comps.comunicacion, currentLevel: L.INTERMEDIATE }, // brecha leve
  ]);
  await setEmployeeCompetencies("emp-emp-03", [
    { competencyId: comps.analisis, currentLevel: L.ADVANCED },
    { competencyId: comps.datos, currentLevel: L.ADVANCED },
    { competencyId: comps.comunicacion, currentLevel: L.ADVANCED },
    { competencyId: comps.critico, currentLevel: L.ADVANCED },
    { competencyId: comps.equipo, currentLevel: L.INTERMEDIATE }, // brecha leve
  ]);
  await setEmployeeCompetencies("emp-emp-04", [
    { competencyId: comps.herramientas, currentLevel: L.EXPERT },
    { competencyId: comps.analisis, currentLevel: L.ADVANCED },
    { competencyId: comps.seguridad, currentLevel: L.INTERMEDIATE }, // brecha leve
    { competencyId: comps.problemas, currentLevel: L.EXPERT },
    { competencyId: comps.equipo, currentLevel: L.ADVANCED },
  ]);
  await setEmployeeCompetencies("emp-emp-05", [
    { competencyId: comps.normativa, currentLevel: L.EXPERT },
    { competencyId: comps.analisis, currentLevel: L.ADVANCED },
    { competencyId: comps.critico, currentLevel: L.ADVANCED },
    { competencyId: comps.comunicacion, currentLevel: L.ADVANCED },
    { competencyId: comps.problemas, currentLevel: L.ADVANCED },
  ]);
  await setEmployeeCompetencies("emp-emp-06", [
    { competencyId: comps.datos, currentLevel: L.EXPERT },
    { competencyId: comps.herramientas, currentLevel: L.ADVANCED },
    { competencyId: comps.analisis, currentLevel: L.ADVANCED },
    { competencyId: comps.critico, currentLevel: L.INTERMEDIATE }, // brecha leve
    { competencyId: comps.problemas, currentLevel: L.ADVANCED },
  ]);
  console.log("   6 empleados de Emporium creados");

  // ─────────────────────────────────────────────────────────────────────────
  // LIVIN
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n🛡️  Construyendo Livin...");
  const livinId = companies["livin"];

  const livinDepts = {
    dir: await upsertDept("dept-liv-dir", "Dirección General", livinId, "Dirección y estrategia del broker"),
    comercial: await upsertDept("dept-liv-com", "Comercial y Ventas", livinId, "Ventas de seguros y gestión de cartera", "dept-liv-dir"),
    ops: await upsertDept("dept-liv-ops", "Operaciones y Siniestros", livinId, "Gestión de pólizas y tramitación de siniestros", "dept-liv-dir"),
    riesgos: await upsertDept("dept-liv-rie", "Riesgos y Compliance", livinId, "Análisis de riesgos y cumplimiento normativo", "dept-liv-dir"),
    admin: await upsertDept("dept-liv-adm", "Administración y Finanzas", livinId, "Gestión administrativa y contable", "dept-liv-dir"),
  };

  const livinPos = {
    dirGeneral: await upsertPosition("pos-liv-dg", "Gerente General", livinDepts.dir.id, {
      level: 1,
      purpose: "Responsable de rentabilidad, crecimiento y posicionamiento de Livin en el mercado asegurador. Define estrategia comercial, supervisa relaciones con aseguradoras y asegura cumplimiento regulatorio.",
      responsibilities: ["Definir estrategia comercial y objetivos de crecimiento del broker", "Supervisar desempeño financiero y margen de comisión", "Mantener relaciones clave con principales aseguradoras del mercado", "Asegurar cumplimiento de regulaciones de intermediarios de seguros", "Liderar cultura de servicio al cliente y orientación a resultados"],
      education: "Licenciatura en Administración, Seguros, Finanzas o Negocios.",
      experience: "8-12 años en seguros o intermediación financiera, mínimo 3 años en rol directivo.",
      skills: ["Estrategia de seguros", "Relaciones con aseguradoras", "Gestión de cartera", "Regulación de intermediarios", "Liderazgo de equipos comerciales"],
    }),
    gerComercial: await upsertPosition("pos-liv-gc", "Gerente Comercial", livinDepts.comercial.id, {
      level: 2,
      purpose: "Responsable del pipeline comercial, crecimiento de cartera de clientes y desempeño del equipo de ventas. Define estrategias de prospección y gestiona grandes cuentas corporativas.",
      responsibilities: ["Diseñar y ejecutar plan comercial anual del broker", "Supervisar actividades de ventas y cumplimiento de metas de prima", "Desarrollar y mantener relaciones con grandes clientes corporativos", "Identificar nuevas líneas de negocio y segmentos de mercado", "Capacitar y mentorizar equipo comercial de brokers"],
      education: "Licenciatura en Administración, Marketing, Ventas o Seguros.",
      experience: "5-8 años en ventas de seguros, mínimo 2 años en rol gerencial.",
      skills: ["Estrategia de ventas consultivas", "CRM de seguros", "Planes de cuenta corporativa", "Técnicas de negociación", "Gestión de equipo de ventas"],
    }),
    brokerSenior: await upsertPosition("pos-liv-bs", "Ejecutivo de Ventas / Broker Senior", livinDepts.comercial.id, {
      level: 3,
      purpose: "Vendedor especializado en seguros que gestiona cartera de clientes empresariales. Identifica necesidades de cobertura, propone soluciones personalizadas y negocia términos con aseguradoras.",
      responsibilities: ["Gestionar y hacer crecer cartera de clientes corporativos asignados", "Realizar análisis de riesgos y necesidades de cobertura del cliente", "Proponer pólizas adaptadas al perfil de riesgo específico", "Negociar términos, primas y coberturas con aseguradoras", "Realizar seguimiento post-venta, renovaciones y cross-selling"],
      education: "Licenciatura en Administración, Seguros o Negocios. Diploma en Seguros preferible.",
      experience: "3-6 años vendiendo seguros corporativos con colocaciones comprobadas.",
      skills: ["Seguros patrimoniales y de vida", "Análisis de pólizas", "Negociación con aseguradoras", "Gestión de siniestros básica", "Certificación IAIS o similar"],
    }),
    siniestros: await upsertPosition("pos-liv-si", "Especialista en Siniestros", livinDepts.ops.id, {
      level: 3,
      purpose: "Experto en tramitación de reclamaciones. Investiga siniestros, evalúa montos, coordina con peritos y aseguradoras para resolver reclamos de clientes de forma eficiente.",
      responsibilities: ["Recibir, registrar y procesar reportes de siniestros de clientes", "Investigar circunstancias del siniestro e inspeccionar daños in situ", "Coordinar con peritos y ajustadores independientes", "Negociar montos de cobertura con las aseguradoras en representación del cliente", "Informar al cliente sobre proceso, tiempos y resolución del reclamo"],
      education: "Licenciatura en Seguros, Administración o Derecho. Especialización en siniestros.",
      experience: "3-6 años en tramitación de siniestros o investigación aseguradora.",
      skills: ["Peritaje de siniestros", "Regulación de seguros", "Negociación con aseguradoras", "Gestión de expedientes", "Resolución de conflictos"],
    }),
    riskManager: await upsertPosition("pos-liv-rm", "Especialista Risk Manager", livinDepts.riesgos.id, {
      level: 2,
      purpose: "Experto en evaluación y gestión de riesgos empresariales. Ayuda a clientes a entender su exposición, diseña estrategias de mitigación y propone coberturas integrales alineadas con ISO 31000.",
      responsibilities: ["Realizar análisis cualitativos y cuantitativos de riesgos empresariales", "Desarrollar mapas de riesgos para clientes corporativos", "Proponer estrategias de transferencia o mitigación de riesgos", "Asesorar en implementación de medidas preventivas", "Mantenerse actualizado en metodologías ISO 31000 y COSO ERM"],
      education: "Licenciatura en Administración, Seguros, Ingeniería o Finanzas. Certificación ISO 31000.",
      experience: "4-7 años en risk management, análisis de riesgos empresariales o consultoría.",
      skills: ["ISO 31000 y COSO ERM", "Modelos de valoración de riesgo", "Seguros de responsabilidad civil", "Presentaciones ejecutivas", "Herramientas de modelado de riesgo"],
    }),
  };

  await setPositionCompetencies("pos-liv-dg", [
    { competencyId: comps.liderazgo, requiredLevel: L.ADVANCED, isCritical: true },
    { competencyId: comps.vision, requiredLevel: L.ADVANCED, isCritical: true },
    { competencyId: comps.normativa, requiredLevel: L.ADVANCED },
    { competencyId: comps.negociacion, requiredLevel: L.ADVANCED },
    { competencyId: comps.recursos, requiredLevel: L.ADVANCED },
    { competencyId: comps.comunicacion, requiredLevel: L.ADVANCED },
  ]);
  await setPositionCompetencies("pos-liv-gc", [
    { competencyId: comps.negociacion, requiredLevel: L.EXPERT, isCritical: true },
    { competencyId: comps.liderazgo, requiredLevel: L.ADVANCED },
    { competencyId: comps.cliente, requiredLevel: L.ADVANCED },
    { competencyId: comps.comunicacion, requiredLevel: L.ADVANCED },
    { competencyId: comps.recursos, requiredLevel: L.ADVANCED },
  ]);
  await setPositionCompetencies("pos-liv-bs", [
    { competencyId: comps.negociacion, requiredLevel: L.ADVANCED, isCritical: true },
    { competencyId: comps.cliente, requiredLevel: L.ADVANCED, isCritical: true },
    { competencyId: comps.analisis, requiredLevel: L.ADVANCED },
    { competencyId: comps.comunicacion, requiredLevel: L.ADVANCED },
    { competencyId: comps.normativa, requiredLevel: L.INTERMEDIATE },
  ]);
  await setPositionCompetencies("pos-liv-si", [
    { competencyId: comps.analisis, requiredLevel: L.ADVANCED, isCritical: true },
    { competencyId: comps.normativa, requiredLevel: L.ADVANCED },
    { competencyId: comps.negociacion, requiredLevel: L.INTERMEDIATE },
    { competencyId: comps.comunicacion, requiredLevel: L.ADVANCED },
    { competencyId: comps.problemas, requiredLevel: L.ADVANCED },
  ]);
  await setPositionCompetencies("pos-liv-rm", [
    { competencyId: comps.analisis, requiredLevel: L.EXPERT, isCritical: true },
    { competencyId: comps.normativa, requiredLevel: L.ADVANCED },
    { competencyId: comps.critico, requiredLevel: L.ADVANCED },
    { competencyId: comps.comunicacion, requiredLevel: L.ADVANCED },
    { competencyId: comps.datos, requiredLevel: L.INTERMEDIATE },
  ]);

  await upsertEmployee("emp-liv-01", {
    userId: "seed-liv-01", employeeCode: "LIV-001",
    firstName: "Rafael", lastName: "Gutiérrez",
    email: "r.gutierrez@livin.com.ec",
    bio: "Gerente con 15 años en el mercado asegurador latinoamericano. Fundó Livin con el propósito de dar acceso a seguros de calidad a medianas empresas que no cuentan con asesoría especializada.",
    hireDate: new Date("2018-01-15"), departmentId: livinDepts.dir.id, positionId: livinPos.dirGeneral.id,
  });
  await upsertEmployee("emp-liv-02", {
    userId: "seed-liv-02", employeeCode: "LIV-002",
    firstName: "Mauricio", lastName: "Delgado",
    email: "m.delgado@livin.com.ec",
    bio: "Comercial con trayectoria en grandes brokers de seguros internacionales. Especialista en seguros de responsabilidad civil, flota vehicular y vida colectiva corporativa.",
    hireDate: new Date("2019-04-01"), departmentId: livinDepts.comercial.id, positionId: livinPos.gerComercial.id, managerId: "emp-liv-01",
  });
  await upsertEmployee("emp-liv-03", {
    userId: "seed-liv-03", employeeCode: "LIV-003",
    firstName: "Gabriela", lastName: "Soto",
    email: "g.soto@livin.com.ec",
    bio: "Broker certificada con cartera propia de clientes corporativos. Especializada en seguros patrimoniales y de ingeniería para el sector construcción e inmobiliario.",
    hireDate: new Date("2020-07-01"), departmentId: livinDepts.comercial.id, positionId: livinPos.brokerSenior.id, managerId: "emp-liv-02",
  });
  await upsertEmployee("emp-liv-04", {
    userId: "seed-liv-04", employeeCode: "LIV-004",
    firstName: "Tomás", lastName: "Ramírez",
    email: "t.ramirez@livin.com.ec",
    bio: "Recién egresado con pasión por el mundo asegurador. Aprendiendo el oficio de broker bajo mentoría directa. Alto potencial en ventas consultivas.",
    hireDate: new Date("2023-09-01"), departmentId: livinDepts.comercial.id, positionId: livinPos.brokerSenior.id, managerId: "emp-liv-02",
  });
  await upsertEmployee("emp-liv-05", {
    userId: "seed-liv-05", employeeCode: "LIV-005",
    firstName: "Marisa", lastName: "Flores",
    email: "m.flores@livin.com.ec",
    bio: "Especialista en tramitación de siniestros de todo ramo con experiencia en aseguradoras nacionales e internacionales. Conocimiento profundo del proceso de ajuste de pérdidas.",
    hireDate: new Date("2021-03-01"), departmentId: livinDepts.ops.id, positionId: livinPos.siniestros.id, managerId: "emp-liv-01",
  });
  await upsertEmployee("emp-liv-06", {
    userId: "seed-liv-06", employeeCode: "LIV-006",
    firstName: "Javier", lastName: "Herrera",
    email: "j.herrera@livin.com.ec",
    bio: "Risk manager con certificación ISO 31000 y COSO ERM. Consultor de riesgos para empresas de manufactura, logística y retail. Docente universitario en gestión de riesgos.",
    hireDate: new Date("2020-11-01"), departmentId: livinDepts.riesgos.id, positionId: livinPos.riskManager.id, managerId: "emp-liv-01",
  });

  await setEmployeeCompetencies("emp-liv-01", [
    { competencyId: comps.liderazgo, currentLevel: L.ADVANCED },
    { competencyId: comps.vision, currentLevel: L.ADVANCED },
    { competencyId: comps.normativa, currentLevel: L.ADVANCED },
    { competencyId: comps.negociacion, currentLevel: L.ADVANCED },
    { competencyId: comps.recursos, currentLevel: L.ADVANCED },
    { competencyId: comps.comunicacion, currentLevel: L.ADVANCED },
  ]);
  await setEmployeeCompetencies("emp-liv-02", [
    { competencyId: comps.negociacion, currentLevel: L.EXPERT },
    { competencyId: comps.liderazgo, currentLevel: L.ADVANCED },
    { competencyId: comps.cliente, currentLevel: L.ADVANCED },
    { competencyId: comps.comunicacion, currentLevel: L.ADVANCED },
    { competencyId: comps.recursos, currentLevel: L.INTERMEDIATE }, // brecha leve
  ]);
  await setEmployeeCompetencies("emp-liv-03", [
    { competencyId: comps.negociacion, currentLevel: L.ADVANCED },
    { competencyId: comps.cliente, currentLevel: L.ADVANCED },
    { competencyId: comps.analisis, currentLevel: L.ADVANCED },
    { competencyId: comps.comunicacion, currentLevel: L.ADVANCED },
    { competencyId: comps.normativa, currentLevel: L.INTERMEDIATE }, // brecha leve
  ]);
  await setEmployeeCompetencies("emp-liv-04", [
    { competencyId: comps.negociacion, currentLevel: L.BASIC }, // brecha crítica vs Senior
    { competencyId: comps.cliente, currentLevel: L.INTERMEDIATE }, // brecha leve
    { competencyId: comps.analisis, currentLevel: L.BASIC }, // brecha moderada
    { competencyId: comps.comunicacion, currentLevel: L.INTERMEDIATE },
    { competencyId: comps.normativa, currentLevel: L.BASIC }, // brecha leve
  ]);
  await setEmployeeCompetencies("emp-liv-05", [
    { competencyId: comps.analisis, currentLevel: L.ADVANCED },
    { competencyId: comps.normativa, currentLevel: L.ADVANCED },
    { competencyId: comps.negociacion, currentLevel: L.INTERMEDIATE }, // brecha leve
    { competencyId: comps.comunicacion, currentLevel: L.ADVANCED },
    { competencyId: comps.problemas, currentLevel: L.ADVANCED },
  ]);
  await setEmployeeCompetencies("emp-liv-06", [
    { competencyId: comps.analisis, currentLevel: L.EXPERT },
    { competencyId: comps.normativa, currentLevel: L.ADVANCED },
    { competencyId: comps.critico, currentLevel: L.ADVANCED },
    { competencyId: comps.comunicacion, currentLevel: L.ADVANCED },
    { competencyId: comps.datos, currentLevel: L.INTERMEDIATE }, // brecha leve
  ]);
  console.log("   6 empleados de Livin creados");

  // ─────────────────────────────────────────────────────────────────────────
  // SPARTANS
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n🏀 Construyendo Spartans...");
  const spartansId = companies["spartans"];

  const spartansDepts = {
    dir: await upsertDept("dept-spt-dir", "Dirección Deportiva", spartansId, "Estrategia deportiva y gestión del plantel"),
    tecnico: await upsertDept("dept-spt-tec", "Cuerpo Técnico", spartansId, "Entrenadores y preparación del equipo", "dept-spt-dir"),
    medico: await upsertDept("dept-spt-med", "Departamento Médico", spartansId, "Salud y rehabilitación del plantel", "dept-spt-dir"),
    admin: await upsertDept("dept-spt-adm", "Gerencia Administrativa", spartansId, "Operaciones, finanzas y logística del club", "dept-spt-dir"),
    mkt: await upsertDept("dept-spt-mkt", "Comunicación y Marketing", spartansId, "Imagen institucional y patrocinios", "dept-spt-dir"),
  };

  const spartansPos = {
    dirDep: await upsertPosition("pos-spt-dd", "Director Deportivo", spartansDepts.dir.id, {
      level: 1,
      purpose: "Responsable de toda la estrategia deportiva del club. Gestiona contrataciones de jugadores, define política deportiva y supervisa al cuerpo técnico para asegurar competitividad del equipo.",
      responsibilities: ["Definir política deportiva y objetivos anuales de competición", "Identificar, evaluar y contratar nuevos jugadores para reforzar el plantel", "Supervisar desempeño técnico del entrenador y cuerpo técnico", "Negociar contratos con jugadores, staff y agentes deportivos", "Gestionar relaciones con organismos de control deportivo nacionales"],
      education: "Licenciatura en Educación Física, Administración Deportiva o Ciencias del Deporte.",
      experience: "8-12 años en basketball profesional, mínimo 3 años en rol directivo deportivo.",
      skills: ["Scouting de jugadores", "Dirección de equipos deportivos", "Negociación de contratos deportivos", "Reglamento FIBA", "Gestión presupuestaria deportiva"],
    }),
    headCoach: await upsertPosition("pos-spt-hc", "Entrenador Principal (Head Coach)", spartansDepts.tecnico.id, {
      level: 2,
      purpose: "Máxima autoridad técnica en entrenamientos y competencias. Diseña estrategia táctica, prepara psicológicamente al equipo y es responsable del rendimiento competitivo en cancha.",
      responsibilities: ["Diseñar y ejecutar plan de entrenamiento y preparación anual", "Definir alineaciones y estrategias tácticas para cada partido", "Evaluar desempeño individual y colectivo del plantel continuamente", "Mantener cohesión, disciplina y motivación del equipo", "Comunicarse con dirección sobre necesidades de refuerzos y bajas"],
      education: "Licenciatura en Educación Física o Entrenador Deportivo Profesional certificado. Nivel 3 FIBA Coaching.",
      experience: "10-15 años en basketball, mínimo 5 años como entrenador principal profesional.",
      skills: ["Táctica y estrategia de basketball", "Análisis de video (Synergy/Hudl)", "Liderazgo de vestuario", "Certificación FIBA Coaching Level 3", "Gestión de egos y conflictos"],
    }),
    asisCoach: await upsertPosition("pos-spt-ac", "Entrenador Asistente", spartansDepts.tecnico.id, {
      level: 3,
      purpose: "Apoyo táctico y técnico al head coach. Especializado en aspectos defensivos, ofensivos o análisis de rivales. Colabora en la dirección de entrenamientos y en banquillo durante partidos.",
      responsibilities: ["Especializar en área técnica específica: defensa, ofensiva o scouting", "Conducir sesiones de entrenamiento bajo dirección del head coach", "Analizar video de rivales y preparar scouting reports detallados", "Apoyar en correcciones técnicas individuales con jugadores", "Asistir al head coach en banquillo durante partidos oficiales"],
      education: "Licenciatura en Educación Física o Entrenador Deportivo certificado. FIBA Coaching Level 2.",
      experience: "3-7 años en basketball, mínimo 2 años como asistente o experiencia como jugador profesional.",
      skills: ["Análisis de video deportivo", "Fundamentos técnicos de basketball", "Scouting de equipos", "FIBA Coaching Level 2", "Comunicación con jugadores"],
    }),
    prepFisico: await upsertPosition("pos-spt-pf", "Preparador Físico", spartansDepts.tecnico.id, {
      level: 3,
      purpose: "Especialista en acondicionamiento y entrenamiento físico. Diseña programas de preparación, prevención de lesiones y recuperación para optimizar rendimiento del plantel.",
      responsibilities: ["Diseñar y ejecutar programa de preparación física anual por temporada", "Evaluar capacidad física individual y elaborar planes personalizados", "Conducir sesiones de fuerza, resistencia y acondicionamiento", "Prevenir lesiones mediante programación y control de carga", "Monitorear evolución física durante temporada regular y playoffs"],
      education: "Licenciatura en Educación Física, Entrenamiento Deportivo, Kinesiología o Ciencias del Deporte.",
      experience: "4-8 años como preparador físico en basketball u otros deportes colectivos profesionales.",
      skills: ["Periodización del entrenamiento", "GPS y wearables deportivos", "Fuerza y acondicionamiento", "Prevención de lesiones", "Nutrición deportiva básica"],
    }),
    medico: await upsertPosition("pos-spt-md", "Médico Deportivo", spartansDepts.medico.id, {
      level: 2,
      purpose: "Profesional sanitario responsable de la salud integral del plantel. Realiza evaluaciones médicas, trata lesiones agudas, supervisa recuperación y certifica aptitud competitiva de los jugadores.",
      responsibilities: ["Realizar exámenes médicos periódicos y pre-temporada al plantel", "Diagnosticar y tratar lesiones agudas en entrenamientos y partidos", "Autorizar regreso a competencia post-lesión con criterio clínico", "Coordinar con especialistas externos para lesiones complejas", "Mantener registro médico completo y confidencial de cada jugador"],
      education: "Licenciatura en Medicina. Especialización en Medicina del Deporte o Traumatología.",
      experience: "3-8 años en medicina del deporte, traumatología clínica o medicina de alta competición.",
      skills: ["Medicina del deporte de alta competición", "Traumatología y ortopedia", "Ecografía musculoesquelética", "Protocolos de retorno al juego", "Farmacología deportiva y antidopaje"],
    }),
    gerAdmin: await upsertPosition("pos-spt-ga", "Gerente Administrativo", spartansDepts.admin.id, {
      level: 2,
      purpose: "Responsable de operaciones administrativas, financieras y logísticas del club. Gestiona presupuesto, nómina, viajes del equipo y asegura el funcionamiento operativo.",
      responsibilities: ["Administrar presupuesto anual y financiamiento del club", "Gestionar nómina, beneficios y pagos a jugadores y staff", "Coordinar logística de viajes (transporte, alojamiento, alimentación)", "Mantener relaciones con proveedores y patrocinadores", "Reportar financieramente a junta directiva y cumplir con normativa laboral"],
      education: "Licenciatura en Administración, Contabilidad o Negocios.",
      experience: "3-6 años en administración deportiva o gestión organizacional.",
      skills: ["Administración de clubes deportivos", "Legislación laboral deportiva", "Gestión de viajes de equipo", "Contabilidad básica", "Gestión de contratos deportivos"],
    }),
  };

  await setPositionCompetencies("pos-spt-dd", [
    { competencyId: comps.liderazgo, requiredLevel: L.ADVANCED, isCritical: true },
    { competencyId: comps.vision, requiredLevel: L.ADVANCED, isCritical: true },
    { competencyId: comps.negociacion, requiredLevel: L.ADVANCED },
    { competencyId: comps.decisiones, requiredLevel: L.ADVANCED },
    { competencyId: comps.recursos, requiredLevel: L.ADVANCED },
    { competencyId: comps.analisis, requiredLevel: L.ADVANCED },
  ]);
  await setPositionCompetencies("pos-spt-hc", [
    { competencyId: comps.liderazgo, requiredLevel: L.EXPERT, isCritical: true },
    { competencyId: comps.analisis, requiredLevel: L.EXPERT, isCritical: true },
    { competencyId: comps.emocional, requiredLevel: L.ADVANCED },
    { competencyId: comps.comunicacion, requiredLevel: L.ADVANCED },
    { competencyId: comps.adaptabilidad, requiredLevel: L.ADVANCED },
    { competencyId: comps.problemas, requiredLevel: L.ADVANCED },
  ]);
  await setPositionCompetencies("pos-spt-ac", [
    { competencyId: comps.analisis, requiredLevel: L.ADVANCED, isCritical: true },
    { competencyId: comps.comunicacion, requiredLevel: L.ADVANCED },
    { competencyId: comps.equipo, requiredLevel: L.ADVANCED },
    { competencyId: comps.liderazgo, requiredLevel: L.INTERMEDIATE },
    { competencyId: comps.adaptabilidad, requiredLevel: L.INTERMEDIATE },
  ]);
  await setPositionCompetencies("pos-spt-pf", [
    { competencyId: comps.analisis, requiredLevel: L.ADVANCED, isCritical: true },
    { competencyId: comps.datos, requiredLevel: L.INTERMEDIATE },
    { competencyId: comps.equipo, requiredLevel: L.ADVANCED },
    { competencyId: comps.comunicacion, requiredLevel: L.INTERMEDIATE },
    { competencyId: comps.aprendizaje, requiredLevel: L.ADVANCED },
  ]);
  await setPositionCompetencies("pos-spt-md", [
    { competencyId: comps.analisis, requiredLevel: L.EXPERT, isCritical: true },
    { competencyId: comps.decisiones, requiredLevel: L.ADVANCED },
    { competencyId: comps.comunicacion, requiredLevel: L.ADVANCED },
    { competencyId: comps.cliente, requiredLevel: L.ADVANCED },
    { competencyId: comps.problemas, requiredLevel: L.ADVANCED },
  ]);
  await setPositionCompetencies("pos-spt-ga", [
    { competencyId: comps.recursos, requiredLevel: L.ADVANCED, isCritical: true },
    { competencyId: comps.comunicacion, requiredLevel: L.INTERMEDIATE },
    { competencyId: comps.equipo, requiredLevel: L.INTERMEDIATE },
    { competencyId: comps.analisis, requiredLevel: L.INTERMEDIATE },
    { competencyId: comps.adaptabilidad, requiredLevel: L.INTERMEDIATE },
  ]);

  await upsertEmployee("emp-spt-01", {
    userId: "seed-spt-01", employeeCode: "SPT-001",
    firstName: "Luis", lastName: "Hernández",
    email: "l.hernandez@spartans.ec",
    bio: "Ex-jugador profesional reconvertido en directivo deportivo. Jugó 12 años en la liga nacional y fue seleccionado. Lideró dos equipos como director deportivo con resultados campeonatos.",
    hireDate: new Date("2020-01-01"), departmentId: spartansDepts.dir.id, positionId: spartansPos.dirDep.id,
  });
  await upsertEmployee("emp-spt-02", {
    userId: "seed-spt-02", employeeCode: "SPT-002",
    firstName: "Martín", lastName: "Pacheco",
    email: "m.pacheco@spartans.ec",
    bio: "Head coach con 20 años de trayectoria, exentrenador de la selección nacional sub-23. Campeón de liga en 3 ocasiones. Certificado FIBA Level 3. Conocido por su trabajo defensivo.",
    hireDate: new Date("2021-06-01"), departmentId: spartansDepts.tecnico.id, positionId: spartansPos.headCoach.id, managerId: "emp-spt-01",
  });
  await upsertEmployee("emp-spt-03", {
    userId: "seed-spt-03", employeeCode: "SPT-003",
    firstName: "Rodrigo", lastName: "Flores",
    email: "r.flores@spartans.ec",
    bio: "Asistente técnico especializado en análisis de video y scouting. Ex-base profesional. Apoya en la preparación táctica y en el análisis de rendimiento individual de los jugadores.",
    hireDate: new Date("2021-07-01"), departmentId: spartansDepts.tecnico.id, positionId: spartansPos.asisCoach.id, managerId: "emp-spt-02",
  });
  await upsertEmployee("emp-spt-04", {
    userId: "seed-spt-04", employeeCode: "SPT-004",
    firstName: "Carolina", lastName: "Molina",
    email: "c.molina@spartans.ec",
    bio: "Licenciada en Educación Física con especialidad en fuerza y acondicionamiento. Primera preparadora física femenina en un equipo masculino profesional de la liga nacional.",
    hireDate: new Date("2022-01-01"), departmentId: spartansDepts.tecnico.id, positionId: spartansPos.prepFisico.id, managerId: "emp-spt-02",
  });
  await upsertEmployee("emp-spt-05", {
    userId: "seed-spt-05", employeeCode: "SPT-005",
    firstName: "Felipe", lastName: "Castillo",
    email: "f.castillo@spartans.ec",
    bio: "Médico traumatólogo con especialización en medicina del deporte. Antes trabajó con selecciones nacionales de fútbol y atletismo. Especialista en lesiones de rodilla y tobillo.",
    hireDate: new Date("2021-01-15"), departmentId: spartansDepts.medico.id, positionId: spartansPos.medico.id, managerId: "emp-spt-01",
  });
  await upsertEmployee("emp-spt-06", {
    userId: "seed-spt-06", employeeCode: "SPT-006",
    firstName: "Pablo", lastName: "Jiménez",
    email: "p.jimenez@spartans.ec",
    bio: "Administrador con experiencia en clubes deportivos y organizaciones sin fines de lucro. Gestiona la logística de viajes y la parte financiera del club de manera eficiente.",
    hireDate: new Date("2020-06-01"), departmentId: spartansDepts.admin.id, positionId: spartansPos.gerAdmin.id, managerId: "emp-spt-01",
  });

  await setEmployeeCompetencies("emp-spt-01", [
    { competencyId: comps.liderazgo, currentLevel: L.ADVANCED },
    { competencyId: comps.vision, currentLevel: L.ADVANCED },
    { competencyId: comps.negociacion, currentLevel: L.ADVANCED },
    { competencyId: comps.decisiones, currentLevel: L.ADVANCED },
    { competencyId: comps.recursos, currentLevel: L.ADVANCED },
    { competencyId: comps.analisis, currentLevel: L.ADVANCED },
  ]);
  await setEmployeeCompetencies("emp-spt-02", [
    { competencyId: comps.liderazgo, currentLevel: L.EXPERT },
    { competencyId: comps.analisis, currentLevel: L.EXPERT },
    { competencyId: comps.emocional, currentLevel: L.ADVANCED },
    { competencyId: comps.comunicacion, currentLevel: L.ADVANCED },
    { competencyId: comps.adaptabilidad, currentLevel: L.ADVANCED },
    { competencyId: comps.problemas, currentLevel: L.ADVANCED },
  ]);
  await setEmployeeCompetencies("emp-spt-03", [
    { competencyId: comps.analisis, currentLevel: L.ADVANCED },
    { competencyId: comps.comunicacion, currentLevel: L.INTERMEDIATE }, // brecha leve
    { competencyId: comps.equipo, currentLevel: L.ADVANCED },
    { competencyId: comps.liderazgo, currentLevel: L.BASIC }, // brecha moderada
    { competencyId: comps.adaptabilidad, currentLevel: L.INTERMEDIATE }, // brecha leve
  ]);
  await setEmployeeCompetencies("emp-spt-04", [
    { competencyId: comps.analisis, currentLevel: L.ADVANCED },
    { competencyId: comps.datos, currentLevel: L.BASIC }, // brecha leve
    { competencyId: comps.equipo, currentLevel: L.ADVANCED },
    { competencyId: comps.comunicacion, currentLevel: L.INTERMEDIATE }, // brecha leve
    { competencyId: comps.aprendizaje, currentLevel: L.ADVANCED },
  ]);
  await setEmployeeCompetencies("emp-spt-05", [
    { competencyId: comps.analisis, currentLevel: L.EXPERT },
    { competencyId: comps.decisiones, currentLevel: L.ADVANCED },
    { competencyId: comps.comunicacion, currentLevel: L.ADVANCED },
    { competencyId: comps.cliente, currentLevel: L.ADVANCED },
    { competencyId: comps.problemas, currentLevel: L.ADVANCED },
  ]);
  await setEmployeeCompetencies("emp-spt-06", [
    { competencyId: comps.recursos, currentLevel: L.ADVANCED },
    { competencyId: comps.comunicacion, currentLevel: L.INTERMEDIATE }, // brecha leve
    { competencyId: comps.equipo, currentLevel: L.INTERMEDIATE }, // brecha leve
    { competencyId: comps.analisis, currentLevel: L.INTERMEDIATE }, // brecha leve
    { competencyId: comps.adaptabilidad, currentLevel: L.INTERMEDIATE },
  ]);
  console.log("   6 empleados de Spartans creados");

  console.log("\n✨ Seed completo finalizado exitosamente.");
  console.log(`   Total: 4 empresas | 20 departamentos | 24 cargos | 24 empleados | 18 competencias`);
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
