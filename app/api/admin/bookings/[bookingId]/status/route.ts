import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { booking } from "@/db/schema";
import { getAuthzErrorResponse, requireRole } from "@/lib/rbac";

const paramsSchema = z.object({
  bookingId: z.string().min(1),
});

const payloadSchema = z.object({
  status: z.enum(["pending", "confirmed", "cancelled", "completed"]).optional(),
  paymentStatus: z.enum(["unpaid", "paid", "refunded"]).optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ bookingId: string }> },
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
    return NextResponse.json({ error: "Invalid booking id." }, { status: 400 });
  }

  const payload = payloadSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success || (!payload.data.status && !payload.data.paymentStatus)) {
    return NextResponse.json(
      { error: "Invalid payload", issues: payload.success ? undefined : payload.error.flatten() },
      { status: 400 },
    );
  }

  const [targetBooking] = await db
    .select({ id: booking.id })
    .from(booking)
    .where(eq(booking.id, params.data.bookingId))
    .limit(1);

  if (!targetBooking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  await db
    .update(booking)
    .set({
      ...(payload.data.status ? { status: payload.data.status } : {}),
      ...(payload.data.paymentStatus ? { paymentStatus: payload.data.paymentStatus } : {}),
      updatedAt: new Date(),
    })
    .where(eq(booking.id, targetBooking.id));

  return NextResponse.json({
    ok: true,
    bookingId: targetBooking.id,
    ...(payload.data.status ? { status: payload.data.status } : {}),
    ...(payload.data.paymentStatus ? { paymentStatus: payload.data.paymentStatus } : {}),
  });
}
