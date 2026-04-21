"use client";

import { createAuthClient } from "better-auth/react";
import { getClientEnv } from "@/lib/env";
import type { AppRole } from "@/lib/rbac";

const env = getClientEnv();

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_APP_URL,
});

export type AuthSession = typeof authClient.$Infer.Session;
export type AuthSessionUser = AuthSession["user"] & {
  role?: AppRole;
};
