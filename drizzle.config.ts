import { defineConfig } from "drizzle-kit";

const fallbackDatabaseUrl = "postgresql://postgres:postgres@localhost:5432/overhall";

export default defineConfig({
  out: "./drizzle",
  schema: "./db/schema/index.ts",
  dialect: "postgresql",
  strict: true,
  verbose: true,
  dbCredentials: {
    url: process.env.DATABASE_URL ?? fallbackDatabaseUrl,
  },
});
