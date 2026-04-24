"use client";

import { createAuthClient } from "better-auth/react";
import type { AppRole } from "@/lib/rbac";

export const authClient = createAuthClient({
  // Let Better Auth resolve the current browser origin so production builds
  // do not bake in a stale NEXT_PUBLIC_APP_URL like http://localhost:3000.
});

export type AuthSession = typeof authClient.$Infer.Session;
export type AuthSessionUser = AuthSession["user"] & {
  role?: AppRole;
};
