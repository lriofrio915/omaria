import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma";

function createPrismaClient() {
  // Usamos Pool con credenciales separadas para evitar problemas de URL-encoding
  const pool = new Pool({
    host: process.env.DB_HOST_POOLER!,
    port: 6543, // Transaction pooler
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!, // contraseña en crudo, sin encoding
    database: "postgres",
    ssl: { rejectUnauthorized: false },
  });

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
