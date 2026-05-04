import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Direct connection used for both runtime and migrations
    // (Supabase pgBouncer pooler does not support Prisma migrations)
    url: process.env["DIRECT_URL"]!,
  },
});
