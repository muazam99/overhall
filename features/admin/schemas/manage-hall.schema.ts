import { z } from "zod";

export const hallStatusSchema = z.enum(["draft", "published", "archived"]);

const optionalTextSchema = z.string().trim().optional().nullable();

export const manageHallCoreSchema = z.object({
  id: z.string().min(1).optional(),
  hostUserId: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: optionalTextSchema,
  addressLine1: z.string().trim().min(1),
  addressLine2: optionalTextSchema,
  city: z.string().trim().min(1),
  state: z.string().trim().min(1),
  postalCode: optionalTextSchema,
  country: z.string().trim().min(1),
  latitude: z.number().finite().optional().nullable(),
  longitude: z.number().finite().optional().nullable(),
  maxCapacity: z.coerce.number().int().min(1),
  basePriceMyr: z.coerce.number().int().min(0),
  cleaningFeeMyr: z.coerce.number().int().min(0),
  serviceFeeMyr: z.coerce.number().int().min(0),
  coverPhotoUrl: optionalTextSchema,
  status: hallStatusSchema,
});

export const manageHallAmenitiesInputSchema = z.object({
  amenityIds: z.array(z.string().min(1)).default([]),
  customAmenities: z.array(z.string().trim().min(1)).default([]),
});

export const manageHallPhotoInputSchema = z.object({
  id: z.string().min(1).optional(),
  path: z.string().trim().min(1),
  altText: optionalTextSchema,
  sortOrder: z.coerce.number().int().min(0).default(0),
  isCover: z.boolean().default(false),
});

export const manageHallSavePayloadSchema = z
  .object({
    hall: manageHallCoreSchema,
    amenities: manageHallAmenitiesInputSchema,
    photos: z.array(manageHallPhotoInputSchema).default([]),
    removedPhotoIds: z.array(z.string().min(1)).default([]),
  })
  .superRefine((payload, context) => {
    const coverCount = payload.photos.filter((photo) => photo.isCover).length;
    if (coverCount > 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Only one photo can be marked as cover.",
        path: ["photos"],
      });
    }
  });

export const manageHallPhotoSchema = manageHallPhotoInputSchema.extend({
  id: z.string().min(1),
  url: z.string().nullable(),
});

export const amenityOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
});

export const manageHallHostSchema = z.object({
  id: z.string().min(1),
  name: z.string().nullable(),
  email: z.string().nullable(),
});

export const manageHallEditorPayloadSchema = z.object({
  hall: manageHallCoreSchema.extend({
    id: z.string().min(1),
  }),
  host: manageHallHostSchema,
  amenities: manageHallAmenitiesInputSchema,
  photos: z.array(manageHallPhotoSchema),
  amenityCatalog: z.array(amenityOptionSchema),
});

export type ManageHallCore = z.infer<typeof manageHallCoreSchema>;
export type ManageHallPhoto = z.infer<typeof manageHallPhotoSchema>;
export type ManageHallSavePayload = z.infer<typeof manageHallSavePayloadSchema>;
export type ManageHallEditorPayload = z.infer<typeof manageHallEditorPayloadSchema>;
export type AmenityOption = z.infer<typeof amenityOptionSchema>;
