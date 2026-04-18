"use client";

import { createAuthClient } from "better-auth/react";
import { getClientEnv } from "@/lib/env";

const env = getClientEnv();

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_APP_URL,
});
