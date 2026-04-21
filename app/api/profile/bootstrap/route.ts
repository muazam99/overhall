import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { profile } from "@/db/schema";
import { getAuthzErrorResponse, requireAuth } from "@/lib/rbac";

const payloadSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
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
  const parsed = payloadSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const firstName = parsed.data.firstName.trim();
  const lastName = parsed.data.lastName.trim();
  const displayName = `${firstName} ${lastName}`.trim();

  const [existingProfile] = await db
    .select({ id: profile.id })
    .from(profile)
    .where(eq(profile.userId, user.id))
    .limit(1);

  if (existingProfile) {
    await db
      .update(profile)
      .set({
        firstName,
        lastName,
        displayName,
        updatedAt: new Date(),
      })
      .where(eq(profile.id, existingProfile.id));
  } else {
    await db.insert(profile).values({
      id: crypto.randomUUID(),
      userId: user.id,
      firstName,
      lastName,
      displayName,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return NextResponse.json({ ok: true });
}
