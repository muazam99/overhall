import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { user } from "@/db/schema";
import { getAuthzErrorResponse, requireRole } from "@/lib/rbac";

const paramsSchema = z.object({
  userId: z.string().min(1),
});

const payloadSchema = z.object({
  role: z.enum(["user", "admin"]),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  let adminUser;

  try {
    adminUser = await requireRole("admin");
  } catch (error) {
    const authError = getAuthzErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const params = paramsSchema.safeParse(await context.params);
  if (!params.success) {
    return NextResponse.json({ error: "Invalid user id." }, { status: 400 });
  }

  const payload = payloadSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: payload.error.flatten() },
      { status: 400 },
    );
  }

  const [targetUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.id, params.data.userId))
    .limit(1);

  if (!targetUser) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (targetUser.id === adminUser.id && payload.data.role !== "admin") {
    return NextResponse.json(
      { error: "You cannot demote your own account." },
      { status: 400 },
    );
  }

  await db
    .update(user)
    .set({
      role: payload.data.role,
      updatedAt: new Date(),
    })
    .where(eq(user.id, targetUser.id));

  return NextResponse.json({
    ok: true,
    userId: targetUser.id,
    role: payload.data.role,
  });
}
