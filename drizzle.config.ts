import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is required for Drizzle. Run commands with environment loaded (for example: node --env-file=.env ...).",
  );
}

export default defineConfig({
  out: "./drizzle",
  schema: "./db/schema/index.ts",
  dialect: "postgresql",
  strict: true,
  verbose: true,
  dbCredentials: {
    url: databaseUrl,
  },
});
