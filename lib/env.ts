import { z } from "zod";

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET is required"),
  BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL must be a valid URL"),
});

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL must be a valid URL"),
});

const storageEnvSchema = z.object({
  R2_ACCOUNT_ID: z.string().min(1, "R2_ACCOUNT_ID is required"),
  R2_BUCKET_NAME: z.string().min(1, "R2_BUCKET_NAME is required"),
  R2_ACCESS_KEY_ID: z.string().min(1, "R2_ACCESS_KEY_ID is required"),
  R2_SECRET_ACCESS_KEY: z.string().min(1, "R2_SECRET_ACCESS_KEY is required"),
  R2_PUBLIC_BASE_URL: z
    .string()
    .url("R2_PUBLIC_BASE_URL must be a valid URL")
    .optional(),
});

let cachedServerEnv: z.infer<typeof serverEnvSchema> | null = null;
let cachedClientEnv: z.infer<typeof clientEnvSchema> | null = null;
let cachedStorageEnv: z.infer<typeof storageEnvSchema> | null = null;

function formatIssues(issues: z.ZodIssue[]) {
  return issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("\n");
}

export function getServerEnv() {
  if (cachedServerEnv) {
    return cachedServerEnv;
  }

  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Invalid server environment variables:\n${formatIssues(parsed.error.issues)}`,
    );
  }

  cachedServerEnv = parsed.data;
  return cachedServerEnv;
}

export function getClientEnv() {
  if (cachedClientEnv) {
    return cachedClientEnv;
  }

  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });

  if (!parsed.success) {
    throw new Error(
      `Invalid client environment variables:\n${formatIssues(parsed.error.issues)}`,
    );
  }

  cachedClientEnv = parsed.data;
  return cachedClientEnv;
}

export function getStorageEnv() {
  if (cachedStorageEnv) {
    return cachedStorageEnv;
  }

  const parsed = storageEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Invalid storage environment variables:\n${formatIssues(parsed.error.issues)}`,
    );
  }

  cachedStorageEnv = parsed.data;
  return cachedStorageEnv;
}
