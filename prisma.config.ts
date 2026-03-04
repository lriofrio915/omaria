import "dotenv/config";
import { defineConfig } from "prisma/config";

const password = encodeURIComponent(process.env.DB_PASSWORD!);
const projectRef = "nqlvjyeuaxkeufndsfvt";

// Session pooler puerto 5432 — soporta advisory locks a diferencia del transaction pooler (6543)
const directUrl = `postgresql://postgres.${projectRef}:${password}@aws-0-us-west-2.pooler.supabase.com:5432/postgres`;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: directUrl,
  },
});
