import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { amenity, hall, hallAmenities, hallPhoto } from "@/db/schema";
import {
  hallDetailsPayloadSchema,
  type HallDetailsPayload,
} from "@/features/halls/schemas/hall-details.schema";
import { resolveHallPhotoUrl } from "@/lib/hall-photo";

export async function getHallDetailsBySlug(slug: string): Promise<HallDetailsPayload | null> {
  const normalizedSlug = slug.trim();
  if (normalizedSlug.length === 0) {
    return null;
  }

  const hallRow = await db
    .select({
      id: hall.id,
      slug: hall.slug,
      name: hall.name,
      description: hall.description,
      city: hall.city,
      state: hall.state,
      country: hall.country,
      maxCapacity: hall.maxCapacity,
      basePriceMyr: hall.basePriceMyr,
      cleaningFeeMyr: hall.cleaningFeeMyr,
      serviceFeeMyr: hall.serviceFeeMyr,
      coverPhotoUrl: hall.coverPhotoUrl,
    })
    .from(hall)
    .where(and(eq(hall.slug, normalizedSlug), eq(hall.status, "published")))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!hallRow) {
    return null;
  }

  const [photoRows, amenityRows] = await Promise.all([
    db
      .select({
        id: hallPhoto.id,
        path: hallPhoto.path,
        altText: hallPhoto.altText,
        sortOrder: hallPhoto.sortOrder,
        isCover: hallPhoto.isCover,
      })
      .from(hallPhoto)
      .where(eq(hallPhoto.hallId, hallRow.id))
      .orderBy(asc(hallPhoto.sortOrder), asc(hallPhoto.id)),
    db
      .select({
        id: hallAmenities.id,
        amenityLabel: amenity.label,
        customAmenity: hallAmenities.customAmenity,
      })
      .from(hallAmenities)
      .leftJoin(amenity, eq(hallAmenities.amenityId, amenity.id))
      .where(eq(hallAmenities.hallId, hallRow.id))
      .orderBy(asc(hallAmenities.sortOrder), asc(hallAmenities.id)),
  ]);

  const photos = photoRows.map((photo) => ({
    id: photo.id,
    path: photo.path,
    altText: photo.altText,
    sortOrder: photo.sortOrder,
    isCover: photo.isCover,
    url: resolveHallPhotoUrl(photo.path),
  }));

  const amenities = amenityRows
    .map((item) => ({
      id: item.id,
      label: item.amenityLabel?.trim() || item.customAmenity?.trim() || "",
    }))
    .filter((item) => item.label.length > 0);

  const bookingSummary = {
    hallRentalMyr: hallRow.basePriceMyr,
    cleaningFeeMyr: hallRow.cleaningFeeMyr,
    serviceFeeMyr: hallRow.serviceFeeMyr,
    estimatedTotalMyr: hallRow.basePriceMyr + hallRow.cleaningFeeMyr + hallRow.serviceFeeMyr,
  };

  return hallDetailsPayloadSchema.parse({
    hall: {
      ...hallRow,
      coverPhotoUrl: resolveHallPhotoUrl(hallRow.coverPhotoUrl),
    },
    photos,
    amenities,
    bookingSummary,
  });
}
