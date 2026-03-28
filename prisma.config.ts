import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // DIRECT_URL uses port 5432 (session pooler) — supports advisory locks required by migrations
  // Only configure datasource if DIRECT_URL is available (prevents MongoDB URL fallback from DATABASE_URL)
  ...(process.env.DIRECT_URL && {
    datasource: {
      url: process.env.DIRECT_URL,
    },
  }),
});
