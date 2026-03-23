import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // DIRECT_URL uses port 5432 (session pooler) — supports advisory locks required by migrations
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
  },
});
