import { asc, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { hall } from "@/db/schema";
import { manageHallSavePayloadSchema } from "@/features/admin/schemas/manage-hall.schema";
import {
  createManageHall,
  ManageHallApiError,
} from "@/features/admin/server/manage-hall";
import { resolveHallPhotoUrl } from "@/lib/hall-photo";
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
      maxCapacity: hall.maxCapacity,
      coverPhotoUrl: hall.coverPhotoUrl,
      status: hall.status,
      createdAt: hall.createdAt,
      updatedAt: hall.updatedAt,
    })
    .from(hall)
    .orderBy(desc(hall.updatedAt), asc(hall.id));

  return NextResponse.json({
    items: rows.map((row) => ({
      ...row,
      coverPhotoUrl: resolveHallPhotoUrl(row.coverPhotoUrl),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  try {
    await requireRole("admin");
  } catch (error) {
    const authError = getAuthzErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = manageHallSavePayloadSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: payload.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await createManageHall(payload.data);
    return NextResponse.json(
      {
        ok: true,
        hallId: result.hallId,
        slug: result.slug,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ManageHallApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Failed to create hall." }, { status: 500 });
  }
}
