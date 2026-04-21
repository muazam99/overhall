import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { booking } from "@/db/schema";
import { getAuthzErrorResponse, requireAuth } from "@/lib/rbac";

const paramsSchema = z.object({
  bookingId: z.string().min(1),
});

const payloadSchema = z.object({
  status: z.literal("cancelled"),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ bookingId: string }> },
) {
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

  const params = paramsSchema.safeParse(await context.params);
  if (!params.success) {
    return NextResponse.json({ error: "Invalid booking id." }, { status: 400 });
  }

  const body = payloadSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: body.error.flatten() },
      { status: 400 },
    );
  }

  const [ownedBooking] = await db
    .select({
      id: booking.id,
      status: booking.status,
    })
    .from(booking)
    .where(and(eq(booking.id, params.data.bookingId), eq(booking.bookerUserId, user.id)))
    .limit(1);

  if (!ownedBooking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  if (ownedBooking.status === "cancelled") {
    return NextResponse.json({ ok: true, status: "cancelled" });
  }

  await db
    .update(booking)
    .set({
      status: "cancelled",
      updatedAt: new Date(),
    })
    .where(eq(booking.id, ownedBooking.id));

  return NextResponse.json({
    ok: true,
    status: "cancelled",
  });
}
