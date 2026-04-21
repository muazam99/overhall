import { asc, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { hall } from "@/db/schema";
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
      id: hall.id,
      name: hall.name,
      slug: hall.slug,
      hostUserId: hall.hostUserId,
      city: hall.city,
      state: hall.state,
      status: hall.status,
      createdAt: hall.createdAt,
      updatedAt: hall.updatedAt,
    })
    .from(hall)
    .orderBy(desc(hall.updatedAt), asc(hall.id));

  return NextResponse.json({
    items: rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
  });
}
