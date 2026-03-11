import * as dotenv from "dotenv";
dotenv.config();

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma";

const pool = new Pool({
  host: process.env.DB_HOST_POOLER!,
  port: 6543,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: "postgres",
  ssl: { rejectUnauthorized: false },
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const companies = [
  {
    name: "Emporium",
    slug: "emporium",
    description: "Empresa del holding SG Consulting Group",
    logoUrl: "https://res.cloudinary.com/deusntwkn/image/upload/v1773262182/emporium_logo_jthk74.png",
    primaryColor: "#1B52B5",
    secondaryColor: "#9EA8B3",
  },
  {
    name: "Adwa Creativa",
    slug: "adwa",
    description: "Agencia creativa y publicidad",
    logoUrl: "https://res.cloudinary.com/deusntwkn/image/upload/v1773262182/adwa_logo_kaigng.png",
    primaryColor: "#9B00FF",
    secondaryColor: "#6A00B0",
  },
  {
    name: "Livin",
    slug: "livin",
    description: "Empresa del holding SG Consulting Group",
    logoUrl: "https://res.cloudinary.com/deusntwkn/image/upload/v1773262181/livin_logo_zhkqkw.png",
    primaryColor: "#8B6B9E",
    secondaryColor: "#F3EEF8",
  },
  {
    name: "Spartans",
    slug: "spartans",
    description: "Empresa del holding SG Consulting Group",
    logoUrl: "https://res.cloudinary.com/deusntwkn/image/upload/v1773262182/spartans_logo_xk8t8c.png",
    primaryColor: "#54C238",
    secondaryColor: "#F37320",
  },
];

async function main() {
  console.log("🌱 Iniciando seed de empresas...");

  for (const company of companies) {
    const result = await prisma.company.upsert({
      where: { slug: company.slug },
      update: company,
      create: company,
    });
    console.log(`✅ ${result.name} (${result.slug})`);
  }

  console.log("✨ Seed completado.");
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
