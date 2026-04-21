import { getServerSession } from "@/lib/auth";

export const appRoles = ["user", "admin"] as const;
export type AppRole = (typeof appRoles)[number];

type SessionUserLike = {
  id?: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
};

export type AuthenticatedUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: AppRole;
};

export class AuthzError extends Error {
  status: 401 | 403;

  constructor(status: 401 | 403, message: string) {
    super(message);
    this.status = status;
    this.name = "AuthzError";
  }
}

function normalizeRole(role: string | null | undefined): AppRole {
  return role === "admin" ? "admin" : "user";
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const session = await getServerSession();
  const user = session?.user as SessionUserLike | undefined;

  if (!user?.id) {
    return null;
  }

  return {
    id: user.id,
    name: user.name ?? null,
    email: user.email ?? null,
    role: normalizeRole(user.role),
  };
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthzError(401, "Unauthorized");
  }

  return user;
}

export async function requireRole(role: AppRole) {
  const user = await requireAuth();
  if (user.role !== role) {
    throw new AuthzError(403, "Forbidden");
  }

  return user;
}

export function getAuthzErrorResponse(error: unknown) {
  if (error instanceof AuthzError) {
    return {
      status: error.status,
      body: {
        error: error.message,
      },
    };
  }

  return null;
}
