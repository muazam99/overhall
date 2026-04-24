import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { amenity, booking, hall, hallAmenities, hallPhoto, user } from "@/db/schema";
import { deriveBookingDisplayCode } from "@/features/bookings/lib/booking-display";
import {
  myBookingDetailsPayloadSchema,
  type MyBookingDetailsPayload,
} from "@/features/bookings/schemas/my-booking-details.schema";
import { resolveHallPhotoUrl } from "@/lib/hall-photo";

type GetMyBookingDetailsArgs = {
  bookingId: string;
  userId: string;
};

function normalizeOptionalText(value: string | null | undefined) {
  const normalizedValue = value?.trim() ?? "";
  return normalizedValue.length > 0 ? normalizedValue : null;
}

export async function getMyBookingDetails({
  bookingId,
  userId,
}: GetMyBookingDetailsArgs): Promise<MyBookingDetailsPayload | null> {
  const normalizedBookingId = bookingId.trim();
  const normalizedUserId = userId.trim();

  if (normalizedBookingId.length === 0 || normalizedUserId.length === 0) {
    return null;
  }

  const bookingRow = await db
    .select({
      id: booking.id,
      eventDate: booking.eventDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
      guestCount: booking.guestCount,
      hallRentalFeeMyr: booking.hallRentalFeeMyr,
      cleaningFeeMyr: booking.cleaningFeeMyr,
      serviceFeeMyr: booking.serviceFeeMyr,
      totalFeeMyr: booking.totalFeeMyr,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      contactName: booking.contactName,
      contactPhone: booking.contactPhone,
      contactEmail: booking.contactEmail,
      notes: booking.notes,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      hallId: hall.id,
      hallSlug: hall.slug,
      hallName: hall.name,
      hallCity: hall.city,
      hallState: hall.state,
      hallCountry: hall.country,
      hallMaxCapacity: hall.maxCapacity,
      hallCoverPhotoUrl: hall.coverPhotoUrl,
      hallStatus: hall.status,
      requesterName: user.name,
      requesterEmail: user.email,
      requesterImage: user.image,
    })
    .from(booking)
    .leftJoin(hall, eq(booking.hallId, hall.id))
    .leftJoin(user, eq(booking.bookerUserId, user.id))
    .where(and(eq(booking.id, normalizedBookingId), eq(booking.bookerUserId, normalizedUserId)))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!bookingRow || !bookingRow.hallId || !bookingRow.hallSlug) {
    return null;
  }

  const [hallPhotoRows, hallAmenityRows] = await Promise.all([
    db
      .select({
        id: hallPhoto.id,
        altText: hallPhoto.altText,
        path: hallPhoto.path,
        isCover: hallPhoto.isCover,
        sortOrder: hallPhoto.sortOrder,
      })
      .from(hallPhoto)
      .where(eq(hallPhoto.hallId, bookingRow.hallId))
      .orderBy(asc(hallPhoto.sortOrder), asc(hallPhoto.id)),
    db
      .select({
        id: hallAmenities.id,
        amenityLabel: amenity.label,
        customAmenity: hallAmenities.customAmenity,
      })
      .from(hallAmenities)
      .leftJoin(
        amenity,
        and(eq(hallAmenities.amenityId, amenity.id), eq(amenity.isActive, true)),
      )
      .where(eq(hallAmenities.hallId, bookingRow.hallId))
      .orderBy(asc(hallAmenities.sortOrder), asc(hallAmenities.id)),
  ]);

  return myBookingDetailsPayloadSchema.parse({
    booking: {
      id: bookingRow.id,
      displayCode: deriveBookingDisplayCode(bookingRow.id),
      eventDate: bookingRow.eventDate,
      startTime: bookingRow.startTime,
      endTime: bookingRow.endTime,
      guestCount: bookingRow.guestCount,
      hallRentalFeeMyr: bookingRow.hallRentalFeeMyr,
      cleaningFeeMyr: bookingRow.cleaningFeeMyr,
      serviceFeeMyr: bookingRow.serviceFeeMyr,
      totalFeeMyr: bookingRow.totalFeeMyr,
      status: bookingRow.status,
      paymentStatus: bookingRow.paymentStatus,
      contactName: normalizeOptionalText(bookingRow.contactName),
      contactPhone: normalizeOptionalText(bookingRow.contactPhone),
      contactEmail: normalizeOptionalText(bookingRow.contactEmail),
      notes: normalizeOptionalText(bookingRow.notes),
      createdAtIso: bookingRow.createdAt.toISOString(),
      updatedAtIso: bookingRow.updatedAt.toISOString(),
    },
    requester: {
      name: bookingRow.requesterName ?? null,
      email: bookingRow.requesterEmail ?? null,
      image: normalizeOptionalText(bookingRow.requesterImage),
    },
    hall: {
      id: bookingRow.hallId,
      slug: bookingRow.hallSlug,
      name: bookingRow.hallName,
      city: bookingRow.hallCity,
      state: bookingRow.hallState,
      country: bookingRow.hallCountry,
      maxCapacity: bookingRow.hallMaxCapacity,
      coverPhotoUrl: resolveHallPhotoUrl(bookingRow.hallCoverPhotoUrl),
      status: bookingRow.hallStatus,
    },
    hallPhotos: hallPhotoRows.map((photo) => ({
      id: photo.id,
      altText: normalizeOptionalText(photo.altText),
      url: resolveHallPhotoUrl(photo.path),
      isCover: photo.isCover,
      sortOrder: photo.sortOrder,
    })),
    amenities: hallAmenityRows
      .map((item) => ({
        id: item.id,
        label: item.amenityLabel?.trim() || item.customAmenity?.trim() || "",
      }))
      .filter((item) => item.label.length > 0),
  });
}
