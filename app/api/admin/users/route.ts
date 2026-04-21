import { asc, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { getAuthzErrorResponse, requireRole } from "@/lib/rbac";

export async function GET() {
  try {
    await requireRole("admin");
  } catch (error) {
    const authError = getAuthzErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(desc(user.createdAt), asc(user.id));

  return NextResponse.json({
    items: rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
    })),
  });
}
