import { and, asc, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/db";
import { amenity, hall, hallAmenities, hallPhoto, user } from "@/db/schema";
import {
  manageHallEditorPayloadSchema,
  type AmenityOption,
  type ManageHallEditorPayload,
  type ManageHallPhoto,
  type ManageHallSavePayload,
} from "@/features/admin/schemas/manage-hall.schema";
import { deleteHallPhotoObject, getHallPhotoPublicUrl } from "@/lib/storage/r2";

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

const DEFAULT_COUNTRY = "Malaysia";

export class ManageHallApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ManageHallApiError";
    this.status = status;
  }
}

function normalizeOptionalText(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized : null;
}

function resolveHallPhotoUrl(path: string) {
  const normalizedPath = path.trim();
  if (normalizedPath.length === 0) {
    return null;
  }

  if (
    normalizedPath.startsWith("http://") ||
    normalizedPath.startsWith("https://") ||
    normalizedPath.startsWith("//")
  ) {
    return normalizedPath;
  }

  try {
    return getHallPhotoPublicUrl(normalizedPath);
  } catch {
    return null;
  }
}

function isR2ManagedPath(path: string) {
  const normalizedPath = path.trim();
  if (normalizedPath.length === 0) {
    return false;
  }

  return !(
    normalizedPath.startsWith("http://") ||
    normalizedPath.startsWith("https://") ||
    normalizedPath.startsWith("//")
  );
}

function normalizeSavePayload(payload: ManageHallSavePayload): ManageHallSavePayload {
  return {
    hall: {
      id: payload.hall.id?.trim(),
      hostUserId: payload.hall.hostUserId.trim(),
      slug: payload.hall.slug.trim(),
      name: payload.hall.name.trim(),
      description: normalizeOptionalText(payload.hall.description),
      addressLine1: payload.hall.addressLine1.trim(),
      addressLine2: normalizeOptionalText(payload.hall.addressLine2),
      city: payload.hall.city.trim(),
      state: payload.hall.state.trim(),
      postalCode: normalizeOptionalText(payload.hall.postalCode),
      country: payload.hall.country.trim() || DEFAULT_COUNTRY,
      latitude: payload.hall.latitude ?? null,
      longitude: payload.hall.longitude ?? null,
      maxCapacity: payload.hall.maxCapacity,
      basePriceMyr: payload.hall.basePriceMyr,
      cleaningFeeMyr: payload.hall.cleaningFeeMyr,
      serviceFeeMyr: payload.hall.serviceFeeMyr,
      coverPhotoUrl: normalizeOptionalText(payload.hall.coverPhotoUrl),
      status: payload.hall.status,
    },
    amenities: {
      amenityIds: Array.from(
        new Set(payload.amenities.amenityIds.map((amenityId) => amenityId.trim()).filter(Boolean)),
      ),
      customAmenities: Array.from(
        new Set(
          payload.amenities.customAmenities
            .map((customAmenity) => customAmenity.trim())
            .filter(Boolean),
        ),
      ),
    },
    photos: payload.photos.map((photo, index) => ({
      id: photo.id?.trim(),
      path: photo.path.trim(),
      altText: normalizeOptionalText(photo.altText),
      sortOrder: Number.isInteger(photo.sortOrder) ? photo.sortOrder : index,
      isCover: photo.isCover,
    })),
    removedPhotoIds: Array.from(
      new Set(payload.removedPhotoIds.map((photoId) => photoId.trim()).filter(Boolean)),
    ),
  };
}

function deriveCoverPhotoUrl(photos: ManageHallSavePayload["photos"], fallback: string | null | undefined) {
  const coverPhoto = photos.find((photo) => photo.isCover);
  if (coverPhoto) {
    return resolveHallPhotoUrl(coverPhoto.path);
  }

  return normalizeOptionalText(fallback);
}

async function getAmenityCatalogFromDb(txOrDb: typeof db | DbTransaction): Promise<AmenityOption[]> {
  return txOrDb
    .select({
      id: amenity.id,
      label: amenity.label,
    })
    .from(amenity)
    .where(eq(amenity.isActive, true))
    .orderBy(asc(amenity.label), asc(amenity.id));
}

async function ensureHostExists(tx: DbTransaction, hostUserId: string) {
  const [targetHost] = await tx
    .select({ id: user.id })
    .from(user)
    .where(eq(user.id, hostUserId))
    .limit(1);

  if (!targetHost) {
    throw new ManageHallApiError(400, "Host user does not exist.");
  }
}

async function ensureAmenityIdsExist(tx: DbTransaction, amenityIds: string[]) {
  if (amenityIds.length === 0) {
    return;
  }

  const rows = await tx
    .select({ id: amenity.id })
    .from(amenity)
    .where(and(inArray(amenity.id, amenityIds), eq(amenity.isActive, true)));

  if (rows.length !== amenityIds.length) {
    throw new ManageHallApiError(400, "Invalid amenity IDs supplied.");
  }
}

async function replaceHallAmenities(
  tx: DbTransaction,
  hallId: string,
  payload: ManageHallSavePayload["amenities"],
) {
  await tx.delete(hallAmenities).where(eq(hallAmenities.hallId, hallId));

  const rows = [
    ...payload.amenityIds.map((amenityId, index) => ({
      id: crypto.randomUUID(),
      hallId,
      amenityId,
      customAmenity: null,
      sortOrder: index,
    })),
    ...payload.customAmenities.map((customAmenity, index) => ({
      id: crypto.randomUUID(),
      hallId,
      amenityId: null,
      customAmenity,
      sortOrder: payload.amenityIds.length + index,
    })),
  ];

  if (rows.length > 0) {
    await tx.insert(hallAmenities).values(rows);
  }
}

async function upsertHallPhotos(
  tx: DbTransaction,
  hallId: string,
  photos: ManageHallSavePayload["photos"],
  existingPhotoIds: Set<string>,
) {
  for (const [index, photo] of photos.entries()) {
    const nextValues = {
      path: photo.path,
      altText: normalizeOptionalText(photo.altText),
      sortOrder: photo.sortOrder ?? index,
      isCover: photo.isCover,
      updatedAt: new Date(),
    };

    if (photo.id && existingPhotoIds.has(photo.id)) {
      await tx
        .update(hallPhoto)
        .set(nextValues)
        .where(and(eq(hallPhoto.id, photo.id), eq(hallPhoto.hallId, hallId)));
      continue;
    }

    await tx.insert(hallPhoto).values({
      id: photo.id ?? crypto.randomUUID(),
      hallId,
      path: photo.path,
      altText: normalizeOptionalText(photo.altText),
      sortOrder: photo.sortOrder ?? index,
      isCover: photo.isCover,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}

async function ensureSlugAvailable(tx: DbTransaction, slug: string, hallIdToExclude?: string) {
  const [existingHall] = await tx
    .select({ id: hall.id })
    .from(hall)
    .where(
      hallIdToExclude
        ? and(eq(hall.slug, slug), ne(hall.id, hallIdToExclude))
        : eq(hall.slug, slug),
    )
    .limit(1);

  if (existingHall) {
    throw new ManageHallApiError(409, "Hall slug already exists.");
  }
}

async function deleteRemovedPhotoObjects(paths: string[]) {
  const deleteTargets = paths.filter(isR2ManagedPath);
  if (deleteTargets.length === 0) {
    return;
  }

  await Promise.allSettled(deleteTargets.map((path) => deleteHallPhotoObject(path)));
}

export async function getAmenityCatalog() {
  return getAmenityCatalogFromDb(db);
}

export async function getManageHallEditorPayload(hallId: string): Promise<ManageHallEditorPayload | null> {
  const [hallRow] = await db
    .select({
      id: hall.id,
      hostUserId: hall.hostUserId,
      hostName: user.name,
      hostEmail: user.email,
      slug: hall.slug,
      name: hall.name,
      description: hall.description,
      addressLine1: hall.addressLine1,
      addressLine2: hall.addressLine2,
      city: hall.city,
      state: hall.state,
      postalCode: hall.postalCode,
      country: hall.country,
      latitude: hall.latitude,
      longitude: hall.longitude,
      maxCapacity: hall.maxCapacity,
      basePriceMyr: hall.basePriceMyr,
      cleaningFeeMyr: hall.cleaningFeeMyr,
      serviceFeeMyr: hall.serviceFeeMyr,
      coverPhotoUrl: hall.coverPhotoUrl,
      status: hall.status,
    })
    .from(hall)
    .leftJoin(user, eq(hall.hostUserId, user.id))
    .where(eq(hall.id, hallId))
    .limit(1);

  if (!hallRow) {
    return null;
  }

  const [photoRows, amenityRows, amenityCatalog] = await Promise.all([
    db
      .select({
        id: hallPhoto.id,
        path: hallPhoto.path,
        altText: hallPhoto.altText,
        sortOrder: hallPhoto.sortOrder,
        isCover: hallPhoto.isCover,
      })
      .from(hallPhoto)
      .where(eq(hallPhoto.hallId, hallId))
      .orderBy(asc(hallPhoto.sortOrder), asc(hallPhoto.id)),
    db
      .select({
        id: hallAmenities.id,
        amenityId: hallAmenities.amenityId,
        customAmenity: hallAmenities.customAmenity,
      })
      .from(hallAmenities)
      .where(eq(hallAmenities.hallId, hallId))
      .orderBy(asc(hallAmenities.sortOrder), asc(hallAmenities.id)),
    getAmenityCatalog(),
  ]);

  const photos: ManageHallPhoto[] = photoRows.map((photo) => ({
    id: photo.id,
    path: photo.path,
    altText: photo.altText,
    sortOrder: photo.sortOrder,
    isCover: photo.isCover,
    url: resolveHallPhotoUrl(photo.path),
  }));

  const amenityIds: string[] = [];
  const customAmenities: string[] = [];

  for (const amenityRow of amenityRows) {
    if (amenityRow.amenityId) {
      amenityIds.push(amenityRow.amenityId);
      continue;
    }

    const customAmenity = normalizeOptionalText(amenityRow.customAmenity);
    if (customAmenity) {
      customAmenities.push(customAmenity);
    }
  }

  return manageHallEditorPayloadSchema.parse({
    hall: {
      ...hallRow,
      description: normalizeOptionalText(hallRow.description),
      addressLine2: normalizeOptionalText(hallRow.addressLine2),
      postalCode: normalizeOptionalText(hallRow.postalCode),
      coverPhotoUrl: normalizeOptionalText(hallRow.coverPhotoUrl),
      latitude: hallRow.latitude ?? null,
      longitude: hallRow.longitude ?? null,
    },
    host: {
      id: hallRow.hostUserId,
      name: hallRow.hostName ?? null,
      email: hallRow.hostEmail ?? null,
    },
    photos,
    amenities: {
      amenityIds,
      customAmenities,
    },
    amenityCatalog,
  });
}

export async function createManageHall(payload: ManageHallSavePayload) {
  const normalizedPayload = normalizeSavePayload(payload);

  const result = await db.transaction(async (tx) => {
    await ensureHostExists(tx, normalizedPayload.hall.hostUserId);
    await ensureAmenityIdsExist(tx, normalizedPayload.amenities.amenityIds);
    await ensureSlugAvailable(tx, normalizedPayload.hall.slug);

    const hallId = crypto.randomUUID();
    const now = new Date();
    const coverPhotoUrl = deriveCoverPhotoUrl(
      normalizedPayload.photos,
      normalizedPayload.hall.coverPhotoUrl,
    );

    await tx.insert(hall).values({
      id: hallId,
      hostUserId: normalizedPayload.hall.hostUserId,
      slug: normalizedPayload.hall.slug,
      name: normalizedPayload.hall.name,
      description: normalizedPayload.hall.description,
      addressLine1: normalizedPayload.hall.addressLine1,
      addressLine2: normalizedPayload.hall.addressLine2,
      city: normalizedPayload.hall.city,
      state: normalizedPayload.hall.state,
      postalCode: normalizedPayload.hall.postalCode,
      country: normalizedPayload.hall.country || DEFAULT_COUNTRY,
      latitude: normalizedPayload.hall.latitude ?? null,
      longitude: normalizedPayload.hall.longitude ?? null,
      maxCapacity: normalizedPayload.hall.maxCapacity,
      basePriceMyr: normalizedPayload.hall.basePriceMyr,
      cleaningFeeMyr: normalizedPayload.hall.cleaningFeeMyr,
      serviceFeeMyr: normalizedPayload.hall.serviceFeeMyr,
      coverPhotoUrl,
      status: normalizedPayload.hall.status,
      createdAt: now,
      updatedAt: now,
    });

    await replaceHallAmenities(tx, hallId, normalizedPayload.amenities);
    await upsertHallPhotos(tx, hallId, normalizedPayload.photos, new Set<string>());

    return {
      hallId,
      slug: normalizedPayload.hall.slug,
    };
  });

  return result;
}

export async function updateManageHall(hallId: string, payload: ManageHallSavePayload) {
  const normalizedPayload = normalizeSavePayload(payload);

  const { slug, removedPhotoPaths } = await db.transaction(async (tx) => {
    const [existingHall] = await tx
      .select({ id: hall.id })
      .from(hall)
      .where(eq(hall.id, hallId))
      .limit(1);

    if (!existingHall) {
      throw new ManageHallApiError(404, "Hall not found.");
    }

    if (normalizedPayload.hall.id && normalizedPayload.hall.id !== hallId) {
      throw new ManageHallApiError(400, "Hall ID mismatch in payload.");
    }

    await ensureHostExists(tx, normalizedPayload.hall.hostUserId);
    await ensureAmenityIdsExist(tx, normalizedPayload.amenities.amenityIds);
    await ensureSlugAvailable(tx, normalizedPayload.hall.slug, hallId);

    const existingPhotos = await tx
      .select({
        id: hallPhoto.id,
        path: hallPhoto.path,
      })
      .from(hallPhoto)
      .where(eq(hallPhoto.hallId, hallId));

    const existingPhotoIdSet = new Set(existingPhotos.map((photo) => photo.id));
    const existingPhotoPathById = new Map(existingPhotos.map((photo) => [photo.id, photo.path]));

    const removedPhotoIds = normalizedPayload.removedPhotoIds.filter((photoId) =>
      existingPhotoIdSet.has(photoId),
    );
    const removedPhotoPaths = removedPhotoIds
      .map((photoId) => existingPhotoPathById.get(photoId))
      .filter((path): path is string => Boolean(path));

    if (removedPhotoIds.length > 0) {
      await tx
        .delete(hallPhoto)
        .where(and(eq(hallPhoto.hallId, hallId), inArray(hallPhoto.id, removedPhotoIds)));

      for (const removedPhotoId of removedPhotoIds) {
        existingPhotoIdSet.delete(removedPhotoId);
      }
    }

    await upsertHallPhotos(tx, hallId, normalizedPayload.photos, existingPhotoIdSet);
    await replaceHallAmenities(tx, hallId, normalizedPayload.amenities);

    const coverPhotoUrl = deriveCoverPhotoUrl(
      normalizedPayload.photos,
      normalizedPayload.hall.coverPhotoUrl,
    );

    await tx
      .update(hall)
      .set({
        hostUserId: normalizedPayload.hall.hostUserId,
        slug: normalizedPayload.hall.slug,
        name: normalizedPayload.hall.name,
        description: normalizedPayload.hall.description,
        addressLine1: normalizedPayload.hall.addressLine1,
        addressLine2: normalizedPayload.hall.addressLine2,
        city: normalizedPayload.hall.city,
        state: normalizedPayload.hall.state,
        postalCode: normalizedPayload.hall.postalCode,
        country: normalizedPayload.hall.country || DEFAULT_COUNTRY,
        latitude: normalizedPayload.hall.latitude ?? null,
        longitude: normalizedPayload.hall.longitude ?? null,
        maxCapacity: normalizedPayload.hall.maxCapacity,
        basePriceMyr: normalizedPayload.hall.basePriceMyr,
        cleaningFeeMyr: normalizedPayload.hall.cleaningFeeMyr,
        serviceFeeMyr: normalizedPayload.hall.serviceFeeMyr,
        coverPhotoUrl,
        status: normalizedPayload.hall.status,
        updatedAt: new Date(),
      })
      .where(eq(hall.id, hallId));

    return {
      slug: normalizedPayload.hall.slug,
      removedPhotoPaths,
    };
  });

  await deleteRemovedPhotoObjects(removedPhotoPaths);

  return {
    hallId,
    slug,
  };
}
