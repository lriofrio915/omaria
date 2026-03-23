import * as dotenv from "dotenv";
dotenv.config();

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma";

const pool = new Pool({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

// ── HELPERS ────────────────────────────────────────────────────────────────

function makeId(...parts: string[]): string {
  return parts
    .join("-")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 60);
}

function toTitle(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function makeEmail(cedula: string): string {
  return `emp.${cedula}@sgcg.ec`;
}

// ── STATIC DATA ─────────────────────────────────────────────────────────────

const COMPANIES = [
  {
    slug: "emporium",
    name: "Emporium Quality Funds",
    description: "Fintech de gestión de capital e inversiones del holding",
    primaryColor: "#1B52B5",
    secondaryColor: "#9EA8B3",
    logoUrl:
      "https://res.cloudinary.com/deusntwkn/image/upload/v1773262182/emporium_logo_jthk74.png",
  },
  {
    slug: "sg-fintech",
    name: "SG Fintech",
    description: "Plataforma fintech, servicios financieros y servicios profesionales del holding",
    primaryColor: "#1B3D5C",
    secondaryColor: "#4A7FC0",
  },
  {
    slug: "incoop",
    name: "Incoop",
    description: "Cooperativa de ahorro y crédito",
    primaryColor: "#2E7D32",
    secondaryColor: "#81C784",
  },
  {
    slug: "heureka",
    name: "Heureka",
    description: "Empresa de inversiones y captaciones del holding",
    primaryColor: "#E65100",
    secondaryColor: "#FFCCBC",
  },
  {
    slug: "adwa",
    name: "Adwa Creativa",
    description: "Agencia de marketing, publicidad y producción audiovisual",
    primaryColor: "#9B00FF",
    secondaryColor: "#6A00B0",
    logoUrl:
      "https://res.cloudinary.com/deusntwkn/image/upload/v1773262182/adwa_logo_kaigng.png",
  },
  {
    slug: "livin",
    name: "Livin",
    description: "Broker de seguros y gestión de riesgos",
    primaryColor: "#8B6B9E",
    secondaryColor: "#F3EEF8",
    logoUrl:
      "https://res.cloudinary.com/deusntwkn/image/upload/v1773262181/livin_logo_zhkqkw.png",
  },
  {
    slug: "spartans",
    name: "Club Deportivo Spartans",
    description: "Club de basketball profesional",
    primaryColor: "#54C238",
    secondaryColor: "#F37320",
    logoUrl:
      "https://res.cloudinary.com/deusntwkn/image/upload/v1773262182/spartans_logo_xk8t8c.png",
  },
];

// Each row: [cedula, firstName, lastName, cargo, department, companySlug, city]
type EmpRow = [string, string, string, string, string, string, string];

const EMPLOYEES: EmpRow[] = [
  // ── EMPORIUM ──────────────────────────────────────────────────────────────
  ["1722365267","Diego Andrés","Aluisa Jaramillo","Coordinador Operativo","Operaciones","emporium","Quito"],
  ["1715904635","Juan Fernando","Cadena Borja","Analista de Acciones y Renta Variable","Operaciones","emporium","Quito"],
  ["1755855747","Gabriel Sebastian","Marquez Muñoz","Coordinador Tech & AI","Operaciones","emporium","Quito"],
  ["1722121744","Daniel Antonio","Montero Lopez","Analista de Acciones y Renta Variable","Operaciones","emporium","Quito"],
  ["1721356671","Erick David","Moreno Ludeña","Coordinador del Área Operativa","Operaciones","emporium","Quito"],
  ["1721676458","Felipe Andrés","Narváez Parreño","Programador Jr","Operaciones","emporium","Quito"],
  ["1500760895","Luis Eduardo","Riofrio Lopez","Operador Jr","Operaciones","emporium","Quito"],
  ["1755688346","Mateo Alejandro","Saa Muñoz","Operador Jr","Operaciones","emporium","Quito"],
  ["1722275995","Alejandro Jhosue","Aguilera Velez","Analista de Mercados Internacionales","Operaciones","emporium","Quito"],
  ["1751643170","Jose Francisco","Sanchez Ortega","Programador Jr","Operaciones","emporium","Quito"],
  ["1726892324","Luis Felipe","Cepeda Peralta","Administrador de Bases de Datos Jr","Operaciones","emporium","Quito"],
  ["106045487","Esteban Patricio","Pizarro Marin","Analista de Mercados Internacionales","Operaciones","emporium","Cuenca"],
  ["1720091469","Karen Emilia","Flor Cajilema","Especialista Fintech","Operaciones","emporium","Quito"],
  ["1721533170","Katherine Sujey","Noboa Moscoso","Analista de Mercados Internacionales","Operaciones","emporium","Quito"],
  ["1754392635","Dennis Geovanna","Tovar Pacheco","Desarrollador Jr","Operaciones","emporium","Quito"],
  ["1752779908","Mateo Andres","Vasquez Unda","Pasante de Desarrollo","Operaciones","emporium","Quito"],

  // (antes: Servicios Profesionales Emporium → fusionado en Emporium Quality Funds)
  ["1718654823","Juan Andres","Arroyo Ochoa","CEO Emporium","Operaciones","emporium","Quito"],
  ["1717913568","Luis Alberto","Ayala Suntasig","Jefe de Inteligencia Artificial","Operaciones","emporium","Quito"],

  // ── SG - FINTECH ──────────────────────────────────────────────────────────
  // Administración
  ["1755656178","Paula Gabriela","Rodríguez Robayo","Asistente de Logística","Administración","sg-fintech","Quito"],
  ["1724725583","Anahi Mishell","Chasi Imba","Auxiliar de Limpieza","Administración","sg-fintech","Quito"],
  ["930395603","Melissa Yesennia","Mieles Gómez","Asistente Administrativa Comercial","Administración","sg-fintech","Guayaquil"],
  ["1803501293","Martin Sebastian","Perez Castillo","Mensajero","Administración","sg-fintech","Quito"],
  ["1723238661","Karen Genary","Guerrero Chiles","Analista Junior","Administración","sg-fintech","Quito"],
  ["1720444817","Gabriela Carolina","Haro Narvaez","Coordinadora de Logística","Administración","sg-fintech","Quito"],
  ["1753903978","Genesis Johanna","Iñamagua Cruz","Asistente de Logística","Administración","sg-fintech","Quito"],
  ["1723701817","Gloria Judith","Moya Ninacuri","Auxiliar de Limpieza","Administración","sg-fintech","Quito"],
  ["1723845069","Eliza Maria","Suasti Oña","Gerente Administrativa","Administración","sg-fintech","Quito"],
  ["1751642941","Vianca Cristina","Perez Galarza","Asistente Logístico","Administración","sg-fintech","Quito"],
  // Comercial
  ["1712083490","Pablo Sebastián","Agüero Sandoval","Asesor Financiero Master","Comercial","sg-fintech","Quito"],
  ["1724349558","Nicole Alexandra","Arrieta Andrade","Asesor Financiero","Comercial","sg-fintech","Quito"],
  ["1712693322","Maria Fernanda","Vargas Pujos","Asesor Financiero","Comercial","sg-fintech","Quito"],
  ["1713877023","Mery Aracely","Cajas Alencastro","Asesor Financiero Master","Comercial","sg-fintech","Quito"],
  ["1723798896","Carlos Danilo","Cuadrado Ponce","Asesor Financiero Master","Comercial","sg-fintech","Quito"],
  ["602135840","Maria Del Carmen","Barrera Novillo","Asesor Financiero","Comercial","sg-fintech","Quito"],
  ["1722448345","Daniela Belen","Moncayo Castro","Gerente Comercial","Comercial","sg-fintech","Quito"],
  ["1308528171","Mercedes Jeanina","Veloz Salcedo","Asesor Financiero","Comercial","sg-fintech","Quito"],
  ["928540129","Jose Rafael","Murillo Miranda","Asesor Financiero","Comercial","sg-fintech","Guayaquil"],
  ["943242446","Melanie Arlette","Lenis Guerra","Asesor Financiero","Comercial","sg-fintech","Guayaquil"],
  ["104881321","Angel Isaac","Cobos Garcia","Asesor Financiero","Comercial","sg-fintech","Guayaquil"],
  ["105686331","Santiago Ismael","Iñiguez Idrovo","Asesor Financiero","Comercial","sg-fintech","Cuenca"],
  ["106548381","Jessica Del Cisne","Ojeda Ojeda","Coordinador Comercial","Comercial","sg-fintech","Cuenca"],
  ["801642380","Denny Rocio","Zamora Cevallos","Asesor Financiero","Comercial","sg-fintech","Quito"],
  ["925680241","Ayleen Dayanne","Amén Piedrahita","Coordinador Comercial","Comercial","sg-fintech","Guayaquil"],
  ["928630292","David Abel","Alarcón Ocejo","Asesor Financiero","Comercial","sg-fintech","Guayaquil"],
  ["1719133991","Nicole Alejandra","Medina Jaramillo","Asistente Comercial de Gerencia","Comercial","sg-fintech","Quito"],
  ["1723063978","Cristian Fernando","Proaño Flores","Asesor Financiero","Comercial","sg-fintech","Quito"],
  ["940239023","Iván Andrés","Herrera Sandoya","Asesor Financiero","Comercial","sg-fintech","Guayaquil"],
  ["104043542","Carlos Sebastian","Jara Alvarado","Asesor Financiero","Comercial","sg-fintech","Cuenca"],
  ["106578610","Viviana Maricela","Rocano Ordóñez","Asesor Financiero","Comercial","sg-fintech","Cuenca"],
  ["104855002","Manuel Gonzalo","Soto Panama","Asesor Financiero","Comercial","sg-fintech","Cuenca"],
  ["105859862","Delia Isabel","Guaman Chavez","Asesor Financiero","Comercial","sg-fintech","Cuenca"],
  ["1714665609","Jenny Maricela","Carpio Herrera","Asesor Financiero","Comercial","sg-fintech","Quito"],
  ["104996590","Sara Inés","Villavicencio Cáceres","Asesor Financiero","Comercial","sg-fintech","Quito"],
  ["1719287631","Gina Paola","Pesantez Ponce","Asesor Financiero","Comercial","sg-fintech","Quito"],
  // Talento Humano
  ["1712172202","Washington Omar","Herrera Diaz","Gerente de Talento Humano","Talento Humano","sg-fintech","Quito"],
  ["1722127394","Coralia Samarkanda","Lopez Beltran","Coordinadora Cultura y Desarrollo Organizacional","Talento Humano","sg-fintech","Quito"],
  ["1723441901","Astrid Lilibeth","Tapia Puruncajas","Coordinador Administrativa de Nómina Laboral","Talento Humano","sg-fintech","Quito"],
  ["1726836784","Yoconda Elizabeth","Tequis Guerrero","Especialista de Selección y Desarrollo Organizacional","Talento Humano","sg-fintech","Quito"],
  ["1726243676","María Fernanda","Camacho Sánchez","Analista de Nómina y Relaciones Laborales","Talento Humano","sg-fintech","Quito"],
  ["1724870249","Marissa Jehiel","Sánchez Oña","Asistente de Selección","Talento Humano","sg-fintech","Quito"],
  ["1716759798","Diego Alberto","Rengifo Hidalgo","Jefe de Clima, Cultura y Comunicación","Talento Humano","sg-fintech","Quito"],
  ["1715465348","Ramiro Javier","Oliva Jácome","Coordinador de Nómina","Talento Humano","sg-fintech","Quito"],
  ["1718475013","Cristian Andrés","Rosero Escaleras","Especialista de Selección","Talento Humano","sg-fintech","Quito"],
  ["605381797","Gerson Omar","Chafla Cepeda","Auxiliar de Limpieza","Talento Humano","sg-fintech","Quito"],
  // Financiero
  ["1727640300","Jessica Paola","Sanchez Guanoluisa","Analista de Tesorería","Financiero","sg-fintech","Quito"],
  ["1720522588","Fernanda Carolina","Mazabanda Tutillo","Asistente de Operaciones","Financiero","sg-fintech","Quito"],
  ["1723783591","Wilson Santiago","Oña Martínez","Gerente Financiero","Financiero","sg-fintech","Quito"],
  ["1725423782","Alejandra Leticia","Toapanta Velasco","Coordinadora de Contabilidad y Tesorería","Financiero","sg-fintech","Quito"],
  ["1728969104","Dayana Patricia","Vacacela Iturralde","Asistente de Contabilidad","Financiero","sg-fintech","Quito"],
  ["1720983871","Laura Alejandra","Venegas Arellano","Coordinadora de Emisiones","Financiero","sg-fintech","Quito"],
  ["1724049935","Estefania Salome","Paredes Robayo","Asistente de Emisiones","Financiero","sg-fintech","Quito"],
  ["953350311","Jonathan Marcelo","Camacho Mite","Asistente Contable","Financiero","sg-fintech","Quito"],
  ["1725041113","Francisco Javier","Diaz Pillasagua","Asistente de Emisiones","Financiero","sg-fintech","Quito"],
  ["1725577835","Jessica Estefania","Guaman Valladarez","Pasante de Tesorería","Financiero","sg-fintech","Quito"],
  // Negocios
  ["1713145637","Juan David","Campuzano Estrella","Vicepresidente de Negocios y Desarrollo de Producto","Negocios","sg-fintech","Quito"],
  ["1717916157","Christian Edgar","Casa Aguilar","Especialista de Estrategia Comercial","Negocios","sg-fintech","Quito"],
  ["1721700928","Patricia Elizabeth","Lema Herrera","Gestor de Servicio al Cliente Senior","Negocios","sg-fintech","Quito"],
  ["1706780317","Juan Pablo","Coba Silva","Especialista de Estrategia Comercial","Negocios","sg-fintech","Quito"],
  ["1726195462","Jorge Luis","Paez Zambrano","Analista de Datos & BI","Negocios","sg-fintech","Quito"],
  // Procesos
  ["1714951132","Geovanna Alejandra","Collaguazo Bolaños","Vicepresidenta de Desarrollo Corporativo y Estrategia","Procesos","sg-fintech","Quito"],
  ["1751370402","Veronica De Los Angeles","Pillalaza Quilachamin","Analista Senior de Procesos","Procesos","sg-fintech","Quito"],
  ["1750275461","Dayana Lizbeth","Vizuete Guayasamin","Analista de Direccionamiento Estratégico","Procesos","sg-fintech","Quito"],
  ["705401552","Luis Andrés","Loaiza Jácome","Especialista de Procesos","Procesos","sg-fintech","Quito"],
  ["1727631911","José Alfonso","Yanez Jaramillo","Analista Senior de Procesos","Procesos","sg-fintech","Quito"],
  ["1713601464","Francisco Bladimir","Trujillo Vivar","Coordinador de Procesos","Procesos","sg-fintech","Quito"],
  ["1714869276","Juan Pablo","Bolaños Sigcha","Analista de Procesos","Procesos","sg-fintech","Quito"],
  // Tecnología
  ["1726027012","Ariel Emilio","Cabrera Naranjo","Desarrollador Jr","Tecnología","sg-fintech","Quito"],
  ["942058702","Priscilla Nicole","Uquillas Anguisaca","Administrador de Plataformas","Tecnología","sg-fintech","Quito"],
  ["1716965155","Sebastian Alejandro","Vasquez Calero","Especialista de QA y Servicios de TI","Tecnología","sg-fintech","Quito"],
  ["1717647620","Marlon Paul","Marquez Muñoz","Coordinador de Producción e Innovación","Tecnología","sg-fintech","Quito"],
  ["1712206398","Diego David","Marquez Quishpe","Gerente de Tecnología","Tecnología","sg-fintech","Quito"],
  ["1724589443","Willian Rafael","Pepinos Pozo","Analista de Soporte Funcional","Tecnología","sg-fintech","Quito"],
  ["1722386941","Edwin Alejandro","Pineda Pullas","Analista de Servicios","Tecnología","sg-fintech","Quito"],
  ["1716961469","Walter Paul","Quimbia Vera","Administrador de Base de Datos Sr","Tecnología","sg-fintech","Quito"],
  ["1004177455","Kevin Rodrigo","Rosero Insuasti","Especialista de CRM","Tecnología","sg-fintech","Quito"],
  ["1311751265","Kevin Paul","Santillan Delgado","Coordinador de Desarrollo","Tecnología","sg-fintech","Quito"],
  ["1722704374","William Alex","Marcillo Matute","Especialista de Infraestructura y Redes","Tecnología","sg-fintech","Quito"],
  ["1724409907","Santiago Martin","Ruiz Izquierdo","Desarrollador Semi Senior Front End","Tecnología","sg-fintech","Quito"],
  ["1720208154","Dario Jose","Salgado Fernandez","Oficial de Seguridad de la Información","Tecnología","sg-fintech","Quito"],
  ["1752390243","David Alejandro","Molineros Tayupanta","Analista de Ciberseguridad Jr","Tecnología","sg-fintech","Quito"],
  ["1709995318","Pablo Santiago","Juca Jara","Especialista de Infraestructura en Nube","Tecnología","sg-fintech","Quito"],
  ["1750991422","Julián Marcelo","Gordón Rodríguez","Pasante TI","Tecnología","sg-fintech","Quito"],
  ["1727373688","Esteban Andrés","Enríquez Ramírez","Desarrollador Junior","Tecnología","sg-fintech","Quito"],
  ["1722631676","Danny Alexander","Guañuna Ajila","Especialista de Automatización de Procesos Digitales","Tecnología","sg-fintech","Quito"],
  ["1726694258","Alan Sebastián","Velasco Vela","Analista de Soporte Jr","Tecnología","sg-fintech","Quito"],
  // Marketing
  ["1720439908","Stéfano Xavier","Mier Ochoa","Especialista de Marketing","Marketing","sg-fintech","Quito"],
  ["1721257150","Ivan Alexander","Morales Segovia","Asistente de Comunicación y PR","Marketing","sg-fintech","Quito"],
  ["1717348674","Juan Francisco","Romero Cárdenas","Especialista de Marketing","Marketing","sg-fintech","Quito"],
  ["1726904897","Daniela Alejandra","Romero Dávila","Especialista de Comunicación y Relaciones Públicas","Marketing","sg-fintech","Quito"],
  ["1726540857","Giuliana Valeska","Osorio Cobo","Creador de Contenido","Marketing","sg-fintech","Quito"],
  ["402048227","Daniel Alejandro","Tobar Erazo","Creador de Contenido","Marketing","sg-fintech","Quito"],
  ["1713379160","Johanna Elizabeth","Artieda Lozada","Especialista de Marketing","Marketing","sg-fintech","Quito"],
  // Legal
  ["1705911368","Pablo Esteban","Andrade Monge","Asesor Legal Corporativo","Legal","sg-fintech","Quito"],
  ["1726364654","Jimmer Stalyn","Salas Villarroel","Asistente Legal","Legal","sg-fintech","Quito"],
  ["1726882929","Fabiola Alexandra","Villarroel Cuenca","Asistente Legal","Legal","sg-fintech","Quito"],
  ["1723797765","Erik Andres","Muñoz Vega","Asistente Legal","Legal","sg-fintech","Quito"],
  ["1750908418","Renato Emilio","Castillo Gonzalez","Pasante Legal","Legal","sg-fintech","Quito"],
  // Proyectos
  ["1718360363","Mauro Xavier","Lopez Flores","Gerente de Innovación y Experiencia de Cliente","Proyectos","sg-fintech","Quito"],
  ["1316446663","Génesis Dayana","Rizo Vélez","Coordinador de Proyectos e Innovación","Proyectos","sg-fintech","Quito"],
  ["1717642274","Luis Byron","Guevara Toro","Coordinador Senior de Proyectos e Innovación","Proyectos","sg-fintech","Quito"],
  // Gerencia General
  ["1723449367","Angela Paola","Pastor Pazmiño","Asistente de Gerencia","Gerencia General","sg-fintech","Quito"],
  // Innovación y Experiencia del Cliente
  ["1716514789","Jaime Andres","Burbano de Lara","Coordinador de Innovación y Experiencia del Cliente","Innovación y Experiencia del Cliente","sg-fintech","Quito"],
  // Administrativo
  ["1723415814","Dayana Odalysis","Chuquihuanca Prado","Recepcionista","Administrativo","sg-fintech","Quito"],

  // ── INCOOP ────────────────────────────────────────────────────────────────
  // Operaciones
  ["1804665964","Margarita Josefina","Altamirano Vargas","Asistente de Agencia","Operaciones","incoop","Quisapincha"],
  ["1804295564","Veronica Maribel","Mayorga Guevara","Asistente de Agencia","Operaciones","incoop","Ambato"],
  ["1003948427","Carlos Alejandro","Calapaqui Oña","Analista de Balcón de Servicios","Operaciones","incoop","Quito"],
  ["1718894783","Lucía Fernanda","Gutiérrez Ambas","Coordinador de Operaciones","Operaciones","incoop","Quito"],
  ["1803632981","Viviana Carolina","Mantilla Tamayo","Jefe de Agencia","Operaciones","incoop","Ambato"],
  // Crédito
  ["1850110147","Luis Angel","Sanchez Ramos","Ejecutivo de Crédito","Crédito","incoop","Ambato"],
  ["1850220722","Andrés Alexander","Aldas Silva","Ejecutivo de Crédito","Crédito","incoop","Ficoa"],
  ["1719792440","Ximena Denisse","Aguirre Martínez","Analista de Crédito","Crédito","incoop","Quito"],
  ["401697115","Javier Alexander","Meneses Almeida","Ejecutivo de Crédito","Crédito","incoop","Quito"],
  ["401090477","Ana Cecilia","Villarreal Guijarro","Ejecutiva de Crédito","Crédito","incoop","Quito"],
  ["1723617245","Jairo Steveen","Timbila Muñoz","Ejecutivo de Crédito","Crédito","incoop","Quito"],
  ["502569064","Gabriela Del Carmen","Acosta Velastegui","Jefe de Crédito","Crédito","incoop","Quito"],
  // Captaciones
  ["1713235669","Pablo Daniel","Espinoza Quiroz","Jefe de Captaciones","Captaciones","incoop","Quito"],
  ["1724633910","Ronny Alex","Avalos Guerrero","Ejecutivo de Captaciones","Captaciones","incoop","Quito"],
  ["1723463129","Henry Homero","Martinez Esparza","Ejecutivo de Inversiones","Captaciones","incoop","Quito"],
  ["1719398289","Evelin Paola","Armijos Pacheco","Ejecutivo de Captaciones","Captaciones","incoop","Quito"],
  // Riesgos
  ["1720479565","Jorge Daniel","Ojeda Olmedo","Oficial de Riesgos","Riesgos","incoop","Quito"],
  ["1723929095","Juan Sebastian","Portero Lopez","Oficial de Seguridad de la Información","Riesgos","incoop","Quito"],
  // Administración
  ["1721027272","Galo Antonio","Palacios Arellano","Jefe de Agencia","Administración","incoop","Quito"],
  // Gerencia General
  ["1716910839","Jorge Armando","Sánchez Oña","Gerente Subrogante","Gerencia General","incoop","Quito"],
  // Cobranza
  ["1716046592","Lourdes Marcela","Pillalaza Corral","Jefe de Cobranza","Cobranza","incoop","Quito"],
  // Cumplimiento
  ["1716749161","Soraya Guisela","Tipan Salguero","Oficial de Cumplimiento","Cumplimiento","incoop","Quito"],
  ["1722667639","Juan Henry","Cevallos Villarruel","Analista de Cumplimiento","Cumplimiento","incoop","Quito"],
  // Auditoría Interna
  ["1721057857","Sandra Elizabeth","Sangucho Aldana","Auditor Interno","Auditoría Interna","incoop","Quito"],
  // Tesorería
  ["952086460","Guisella Stephania","Santos Larrea","Analista de Tesorería","Tesorería","incoop","Quito"],
  // Legal
  ["1723450845","Carla Sofia","Buenaño Carvajal","Asesora Legal","Legal","incoop","Quito"],
  // Negocios
  ["1717781858","Walter Fernando","Jácome Aillon","Jefe Nacional de Negocios","Negocios","incoop","Quito"],
  ["1716182959","Teresita Carolina","Cadena Villavicencio","Especialista de Estrategia de Negocios","Negocios","incoop","Quito"],

  // (antes: Servicios Profesionales SG → fusionado en SG Fintech)
  ["1704759040","Marco Diego","Acosta Vasquez","Contador Externo","Contabilidad","sg-fintech","Quito"],
  ["1718486960","Paola Maribel","Ponce Leon","Oficial de Seguridad","Administración","sg-fintech","Quito"],
  ["1722738190","Ana Gabriela","Suasti Oña","Gerente Financiera y Operativa","Financiero","sg-fintech","Quito"],
  ["1717317349","Wilson Ivan","Suasti Oña","Gerente General","Gerencia General","sg-fintech","Quito"],

  // ── HEUREKA ───────────────────────────────────────────────────────────────
  ["1711658953","Belgica Margarita","Maila Velastegui","Ejecutiva de Captaciones Master","Captaciones","heureka","Quito"],
  ["1716386204","Franklin Eduardo","Murillo Briones","Ejecutivo de Inversiones","Captaciones","heureka","Quito"],
  ["1709909541","Elsa Jeanneth","Martínez Vinueza","Subgerente","Gerencia General","heureka","Quito"],
  ["1721125779","Karla Catalina","Vega Montaluisa","Estratega Nacional de Negocios","Negocios","heureka","Quito"],
  ["1719707885","Diego Armando","Perugachi Macas","Coordinador Financiero y Presupuesto","Financiero","heureka","Quito"],
  ["1721821567","María Fernanda","Rodríguez Rocha","Especialista de Servicio al Cliente","Servicio al Cliente","heureka","Quito"],

  // ── ADWA CREATIVA ─────────────────────────────────────────────────────────
  ["1721775946","Nina Eliana","Zambrano Diaz","Diseñador UX/UI","Marketing","adwa","Quito"],
  ["1723901813","Julian Mateo","Cabrera Bedon","Pasante de Multimedia y Producción","Marketing","adwa","Quito"],
  ["1726134842","Maria Jose","Duran Cedeño","Pasante de Diseño Gráfico","Marketing","adwa","Quito"],
  ["1751654987","Lorena Marina","Espinoza Benitez","Coordinadora de Contenido","Marketing","adwa","Quito"],
  ["1726389008","Samantha Betsabé","Herrera Sandoval","Asistente Ejecutiva","Marketing","adwa","Quito"],
  ["1714041207","Julio César","Mantilla Moya","Diseñador Multimedia","Marketing","adwa","Quito"],
  ["1725547812","Michelle Anahi","Quilachamin Avila","Asistente de Producción y Vídeo","Marketing","adwa","Quito"],
  ["1716801525","Alex Francisco","Salvador Vega","Director de Marketing","Marketing","adwa","Quito"],
  ["1723952766","Danny Fernando","Sumba Hidalgo","Community Manager","Marketing","adwa","Quito"],
  ["1716002413","Elfer Santiago","Ugarte Muñoz","Editor","Marketing","adwa","Quito"],
  ["1716288293","Jaime Paul","Zambrano Cuenca","Productor Audiovisual","Marketing","adwa","Quito"],
  ["1726679846","Lisett Estefania","Cruz Gallegos","Diseñador Gráfico","Marketing","adwa","Quito"],
  ["503617292","John Francisco","Molina Velasteguí","Diseñador Multimedia","Marketing","adwa","Quito"],
  ["1716367253","Sara Alexandra","Leones Apunte","Content Creator","Marketing","adwa","Quito"],
  ["1719062661","Ana María","Baquero García","Ejecutiva de Cuenta","Marketing","adwa","Quito"],
  ["1721535837","Alexander Fabricio","Escudero Guerra","Community Manager","Marketing","adwa","Quito"],
  ["1753655578","Kimberly Abigail","Jimenez Calvopiña","Diseñador Gráfico","Marketing","adwa","Quito"],
  ["1751861749","Miguel Alexander","Correa Diaz","Editor de Video","Marketing","adwa","Quito"],
  ["1713736344","Eduardo Marcelo","Maldonado Karolys","Productor Audiovisual","Marketing","adwa","Quito"],
  ["1728928357","Camila Arely","Haro Narváez","Pasante Productora","Marketing","adwa","Quito"],
  ["1723526479","Ana Gabriela","Ruiz Segarra","Desarrollador Web Full Stack","Marketing","adwa","Quito"],
  ["1725001158","Maria Augusta","Landázuri Mera","Community Manager","Marketing","adwa","Quito"],
  ["1723201404","Viviana Maribel","Leon Japon","Asistente Administrativa","Administración","adwa","Quito"],

  // ── LIVIN ─────────────────────────────────────────────────────────────────
  ["1720926110","Santiago Martín","Andrade Sánchez","Director Comercial","Comercial","livin","Quito"],
  ["1716198864","Carolin Alexandra","Gallardo Filian","Director Comercial","Comercial","livin","Quito"],
  ["1105917577","Nicolás Ezequiel","Espinosa Loyola","Asesor Comercial","Comercial","livin","Quito"],
  ["803707603","Lucia Elvira","Ríos Ayoví","Asesor Comercial","Comercial","livin","Quito"],
  ["1716248529","María Fernanda","Rosero Clavijo","Asesor Comercial","Comercial","livin","Quito"],
  ["1719361501","Sandra Verónica","Calderón Garzón","Asesor Comercial","Comercial","livin","Quito"],
  ["1723589550","Gloria Stephanie","Armijos Vasquez","Especialista de Operaciones","Operaciones","livin","Quito"],
  ["1715431431","Carla Verónica","Garcés Carvali","Asesor Comercial","Comercial","livin","Quito"],
  ["1712245297","Juan Esteban","Dobronski Jácome","Asesor Comercial","Comercial","livin","Quito"],

  // ── CLUB DEPORTIVO SPARTANS ───────────────────────────────────────────────
  ["1719982736","Cynthia Maricruz","Mena Correa","Asesora Comercial","Administración","spartans","Quito"],
  ["1709981839","Manolo Enrique","Alban Gualotuña","Director Deportivo","Administración","spartans","Quito"],
  ["1715906762","Paola Soledad","Buitrón López","Asistente Operativa","Operaciones","spartans","Quito"],
];

// ── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Iniciando seed de OmarIA — datos reales SG Consulting Group\n");

  // ── 1. LIMPIAR DATOS EXISTENTES ───────────────────────────────────────────
  console.log("Limpiando base de datos...");
  await prisma.chatMessage.deleteMany();
  await prisma.chatSession.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.payrollRecord.deleteMany();
  await prisma.document.deleteMany();
  await prisma.employeeCompetency.deleteMany();
  await prisma.positionCompetency.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.position.deleteMany();
  await prisma.department.deleteMany();
  await prisma.company.deleteMany();
  console.log("   Base de datos limpia.\n");

  // ── 2. EMPRESAS ───────────────────────────────────────────────────────────
  console.log("Creando empresas del holding...");
  const companyIds: Record<string, string> = {};
  for (const c of COMPANIES) {
    const company = await prisma.company.create({ data: c });
    companyIds[c.slug] = company.id;
    console.log(`   ${company.name}`);
  }

  // ── 3. COLECTAR DEPARTAMENTOS Y POSICIONES ÚNICOS ────────────────────────
  console.log("\nInferiendo departamentos y cargos únicos...");

  // Map: "companySlug|deptName" -> deptId
  const deptMap: Record<string, string> = {};
  // Map: "deptId|cargoTitle" -> positionId
  const posMap: Record<string, string> = {};

  // Collect unique combos
  const deptCombos = new Set<string>();
  const posCombos = new Set<string>();

  for (const [, , , cargo, dept, company] of EMPLOYEES) {
    deptCombos.add(`${company}|${dept}`);
    posCombos.add(`${company}|${dept}|${cargo}`);
  }

  // ── 4. DEPARTAMENTOS ──────────────────────────────────────────────────────
  for (const key of Array.from(deptCombos).sort()) {
    const [companySlug, deptName] = key.split("|");
    const deptId = makeId(companySlug, deptName);
    await prisma.department.create({
      data: {
        id: deptId,
        name: deptName,
        companyId: companyIds[companySlug],
      },
    });
    deptMap[key] = deptId;
  }
  console.log(`   ${deptCombos.size} departamentos creados.`);

  // ── 5. POSICIONES ─────────────────────────────────────────────────────────
  for (const key of Array.from(posCombos).sort()) {
    const [companySlug, deptName, cargo] = key.split("|");
    const deptKey = `${companySlug}|${deptName}`;
    const deptId = deptMap[deptKey];
    const posId = makeId(companySlug, deptName, cargo);
    await prisma.position.create({
      data: {
        id: posId,
        title: cargo,
        departmentId: deptId,
        purpose: `Responsable de las funciones correspondientes al cargo de ${cargo} en el área de ${deptName}.`,
        responsibilities: [`Ejecutar las funciones propias del cargo de ${cargo}`, "Cumplir con los objetivos del área", "Reportar avances y resultados a la jefatura inmediata"],
        education: "Perfil profesional según requerimientos del cargo",
        experience: "Experiencia relevante en el área",
        skills: ["Trabajo en equipo", "Comunicación efectiva", "Orientación a resultados"],
      },
    });
    posMap[`${deptId}|${cargo}`] = posId;
  }
  console.log(`   ${posCombos.size} cargos creados.`);

  // ── 6. EMPLEADOS ──────────────────────────────────────────────────────────
  console.log("\nCreando empleados...");
  let count = 0;
  const seenCedulas = new Set<string>();

  for (const [cedula, firstName, lastName, cargo, dept, companySlug, city] of EMPLOYEES) {
    if (seenCedulas.has(cedula)) continue; // deduplicate
    seenCedulas.add(cedula);

    const deptKey = `${companySlug}|${dept}`;
    const deptId = deptMap[deptKey];
    const posId = posMap[`${deptId}|${cargo}`];

    if (!deptId || !posId) {
      console.warn(`   ADVERTENCIA: no se encontró dept/pos para ${cedula} - ${firstName} ${lastName}`);
      continue;
    }

    await prisma.employee.create({
      data: {
        id: makeId("emp", cedula),
        userId: `seed-${cedula}`,
        employeeCode: cedula,
        firstName,
        lastName,
        email: makeEmail(cedula),
        city,
        hireDate: new Date("2023-01-01"),
        status: "ACTIVE",
        contractType: "INDEFINITE",
        departmentId: deptId,
        positionId: posId,
      },
    });
    count++;
  }
  console.log(`   ${count} empleados creados.\n`);

  // ── RESUMEN ───────────────────────────────────────────────────────────────
  const [empTotal, deptTotal, posTotal, compTotal] = await Promise.all([
    prisma.employee.count(),
    prisma.department.count(),
    prisma.position.count(),
    prisma.company.count(),
  ]);
  console.log("=== SEED COMPLETADO ===");
  console.log(`  Empresas:     ${compTotal}`);
  console.log(`  Departamentos: ${deptTotal}`);
  console.log(`  Cargos:        ${posTotal}`);
  console.log(`  Colaboradores: ${empTotal}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
