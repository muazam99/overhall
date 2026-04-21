import { asc, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { booking, hall } from "@/db/schema";
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
      id: booking.id,
      hallId: booking.hallId,
      hallName: hall.name,
      hallSlug: hall.slug,
      bookerUserId: booking.bookerUserId,
      eventDate: booking.eventDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
      guestCount: booking.guestCount,
      totalFeeMyr: booking.totalFeeMyr,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    })
    .from(booking)
    .leftJoin(hall, eq(booking.hallId, hall.id))
    .orderBy(desc(booking.updatedAt), asc(booking.id));

  return NextResponse.json({
    items: rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
  });
}
