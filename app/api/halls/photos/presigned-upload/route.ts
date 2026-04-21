import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { hall } from "@/db/schema";
import { getAuthzErrorResponse, requireAuth } from "@/lib/rbac";
import { buildHallPhotoPath, createHallPhotoUploadUrl } from "@/lib/storage/r2";

export const runtime = "nodejs";

const requestSchema = z.object({
  hallId: z.string().min(1),
  fileName: z.string().min(1),
  contentType: z.string().min(1),
});

export async function POST(request: Request) {
  let user;
  try {
    user = await requireAuth();
  } catch (error) {
    const authError = getAuthzErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (!parsed.data.contentType.toLowerCase().startsWith("image/")) {
    return NextResponse.json(
      { error: "Only image uploads are allowed for hall photos." },
      { status: 400 },
    );
  }

  const [ownedHall] =
    user.role === "admin"
      ? await db
          .select({ id: hall.id })
          .from(hall)
          .where(eq(hall.id, parsed.data.hallId))
          .limit(1)
      : await db
          .select({ id: hall.id })
          .from(hall)
          .where(and(eq(hall.id, parsed.data.hallId), eq(hall.hostUserId, user.id)))
          .limit(1);

  if (!ownedHall) {
    return NextResponse.json({ error: "Hall not found or access denied." }, { status: 404 });
  }

  const path = buildHallPhotoPath(parsed.data.hallId, parsed.data.fileName);
  const { uploadUrl } = await createHallPhotoUploadUrl({
    path,
    contentType: parsed.data.contentType,
  });

  return NextResponse.json({ path, uploadUrl });
}
