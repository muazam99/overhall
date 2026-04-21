import { and, asc, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { booking, hall } from "@/db/schema";
import { getAuthzErrorResponse, requireAuth } from "@/lib/rbac";

const createBookingSchema = z.object({
  hallId: z.string().min(1),
  eventDate: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  guestCount: z.number().int().positive(),
  contactName: z.string().trim().min(1).optional(),
  contactPhone: z.string().trim().min(1).optional(),
  contactEmail: z.string().email().optional(),
  notes: z.string().trim().max(1000).optional(),
});

export async function GET() {
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

  const rows = await db
    .select({
      id: booking.id,
      hallId: booking.hallId,
      eventDate: booking.eventDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
      guestCount: booking.guestCount,
      totalFeeMyr: booking.totalFeeMyr,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      createdAt: booking.createdAt,
      hallName: hall.name,
      hallSlug: hall.slug,
      hallCity: hall.city,
      hallState: hall.state,
    })
    .from(booking)
    .innerJoin(hall, eq(booking.hallId, hall.id))
    .where(eq(booking.bookerUserId, user.id))
    .orderBy(desc(booking.createdAt), asc(booking.id));

  return NextResponse.json({
    items: rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
    })),
  });
}

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
  const parsed = createBookingSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const [targetHall] = await db
    .select({
      id: hall.id,
      basePriceMyr: hall.basePriceMyr,
      cleaningFeeMyr: hall.cleaningFeeMyr,
      serviceFeeMyr: hall.serviceFeeMyr,
      maxCapacity: hall.maxCapacity,
    })
    .from(hall)
    .where(and(eq(hall.id, parsed.data.hallId), eq(hall.status, "published")))
    .limit(1);

  if (!targetHall) {
    return NextResponse.json({ error: "Hall not found." }, { status: 404 });
  }

  if (parsed.data.guestCount > targetHall.maxCapacity) {
    return NextResponse.json(
      { error: `Guest count exceeds hall capacity (${targetHall.maxCapacity}).` },
      { status: 400 },
    );
  }

  const hallRentalFeeMyr = targetHall.basePriceMyr;
  const cleaningFeeMyr = targetHall.cleaningFeeMyr;
  const serviceFeeMyr = targetHall.serviceFeeMyr;
  const totalFeeMyr = hallRentalFeeMyr + cleaningFeeMyr + serviceFeeMyr;

  const bookingId = crypto.randomUUID();
  const now = new Date();

  await db.insert(booking).values({
    id: bookingId,
    hallId: targetHall.id,
    bookerUserId: user.id,
    eventDate: parsed.data.eventDate,
    startTime: parsed.data.startTime,
    endTime: parsed.data.endTime,
    guestCount: parsed.data.guestCount,
    currency: "MYR",
    hallRentalFeeMyr,
    cleaningFeeMyr,
    serviceFeeMyr,
    totalFeeMyr,
    status: "pending",
    paymentStatus: "unpaid",
    contactName: parsed.data.contactName ?? user.name ?? null,
    contactPhone: parsed.data.contactPhone ?? null,
    contactEmail: parsed.data.contactEmail ?? user.email ?? null,
    notes: parsed.data.notes ?? null,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json(
    {
      id: bookingId,
      totalFeeMyr,
      status: "pending",
      paymentStatus: "unpaid",
    },
    { status: 201 },
  );
}
