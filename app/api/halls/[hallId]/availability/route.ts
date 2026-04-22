import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { booking, hall } from "@/db/schema";
import {
  hallAvailabilityParamsSchema,
  hallAvailabilityQuerySchema,
} from "@/features/halls/schemas/hall-availability.schema";
import { getAuthzErrorResponse, requireAuth } from "@/lib/rbac";

export async function GET(
  request: Request,
  context: { params: Promise<{ hallId: string }> },
) {
  try {
    await requireAuth();
  } catch (error) {
    const authError = getAuthzErrorResponse(error);
    if (authError) {
      return NextResponse.json(authError.body, { status: authError.status });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = hallAvailabilityParamsSchema.safeParse(await context.params);
  if (!params.success) {
    return NextResponse.json({ error: "Invalid hall id." }, { status: 400 });
  }

  const query = hallAvailabilityQuerySchema.safeParse({
    eventDate: new URL(request.url).searchParams.get("eventDate") ?? "",
  });
  if (!query.success) {
    return NextResponse.json(
      { error: "Invalid event date.", issues: query.error.flatten() },
      { status: 400 },
    );
  }

  const [targetHall] = await db
    .select({ id: hall.id })
    .from(hall)
    .where(and(eq(hall.id, params.data.hallId), eq(hall.status, "published")))
    .limit(1);

  if (!targetHall) {
    return NextResponse.json({ error: "Hall not found." }, { status: 404 });
  }

  const [blockingBooking] = await db
    .select({
      id: booking.id,
      status: booking.status,
    })
    .from(booking)
    .where(
      and(
        eq(booking.hallId, targetHall.id),
        eq(booking.eventDate, query.data.eventDate),
        inArray(booking.status, ["pending", "confirmed"]),
      ),
    )
    .limit(1);

  if (blockingBooking) {
    return NextResponse.json({
      available: false,
      reason: "This hall is not available for the selected date.",
    });
  }

  return NextResponse.json({
    available: true,
  });
}
