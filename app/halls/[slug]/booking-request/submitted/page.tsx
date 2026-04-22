import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { booking, hall } from "@/db/schema";
import { BookingRequestSubmittedPageClient } from "@/features/halls/components/booking-request-submitted-page-client";
import {
  bookingRequestSubmittedParamsSchema,
  bookingRequestSubmittedPayloadSchema,
  bookingRequestSubmittedQuerySchema,
} from "@/features/halls/schemas/booking-request-submitted.schema";
import { getCurrentUser } from "@/lib/rbac";

type BookingRequestSubmittedPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function normalizeQueryValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default async function BookingRequestSubmittedPage({
  params,
  searchParams,
}: BookingRequestSubmittedPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }

  const [rawParams, rawSearchParams] = await Promise.all([params, searchParams]);
  const parsedParams = bookingRequestSubmittedParamsSchema.safeParse(rawParams);
  if (!parsedParams.success) {
    redirect("/my-bookings");
  }

  const parsedQuery = bookingRequestSubmittedQuerySchema.safeParse({
    bookingId: normalizeQueryValue(rawSearchParams.bookingId),
  });
  if (!parsedQuery.success) {
    redirect("/my-bookings");
  }

  const [row] = await db
    .select({
      bookingId: booking.id,
      status: booking.status,
      submittedAt: booking.createdAt,
      eventDate: booking.eventDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
      guestCount: booking.guestCount,
      hallRentalFeeMyr: booking.hallRentalFeeMyr,
      cleaningFeeMyr: booking.cleaningFeeMyr,
      serviceFeeMyr: booking.serviceFeeMyr,
      totalFeeMyr: booking.totalFeeMyr,
      hallSlug: hall.slug,
      hallName: hall.name,
      hallCity: hall.city,
      hallState: hall.state,
    })
    .from(booking)
    .innerJoin(hall, eq(booking.hallId, hall.id))
    .where(
      and(
        eq(booking.id, parsedQuery.data.bookingId),
        eq(booking.bookerUserId, user.id),
        eq(hall.slug, parsedParams.data.slug),
      ),
    )
    .limit(1);

  if (!row) {
    redirect("/my-bookings");
  }

  const payload = bookingRequestSubmittedPayloadSchema.parse({
    bookingId: row.bookingId,
    status: row.status,
    submittedAtIso: row.submittedAt.toISOString(),
    hall: {
      slug: row.hallSlug,
      name: row.hallName,
      city: row.hallCity,
      state: row.hallState,
    },
    request: {
      eventDate: row.eventDate,
      startTime: row.startTime,
      endTime: row.endTime,
      guestCount: row.guestCount,
    },
    fees: {
      hallRentalMyr: row.hallRentalFeeMyr,
      cleaningFeeMyr: row.cleaningFeeMyr,
      serviceFeeMyr: row.serviceFeeMyr,
      totalFeeMyr: row.totalFeeMyr,
    },
  });

  return <BookingRequestSubmittedPageClient payload={payload} />;
}
