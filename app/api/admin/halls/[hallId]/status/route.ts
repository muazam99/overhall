import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { hall } from "@/db/schema";
import { getAuthzErrorResponse, requireRole } from "@/lib/rbac";

const paramsSchema = z.object({
  hallId: z.string().min(1),
});

const payloadSchema = z.object({
  status: z.enum(["draft", "published", "archived"]),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ hallId: string }> },
) {
  try {
    await requireRole("admin");
  } catch (error) {
    const authError = getAuthzErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const params = paramsSchema.safeParse(await context.params);
  if (!params.success) {
    return NextResponse.json({ error: "Invalid hall id." }, { status: 400 });
  }

  const payload = payloadSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: payload.error.flatten() },
      { status: 400 },
    );
  }

  const [targetHall] = await db
    .select({ id: hall.id })
    .from(hall)
    .where(eq(hall.id, params.data.hallId))
    .limit(1);

  if (!targetHall) {
    return NextResponse.json({ error: "Hall not found." }, { status: 404 });
  }

  await db
    .update(hall)
    .set({
      status: payload.data.status,
      updatedAt: new Date(),
    })
    .where(eq(hall.id, targetHall.id));

  return NextResponse.json({
    ok: true,
    hallId: targetHall.id,
    status: payload.data.status,
  });
}
