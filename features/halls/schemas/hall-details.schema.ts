import { z } from "zod";

export const hallDetailsHallSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable(),
  city: z.string().min(1),
  state: z.string().min(1),
  country: z.string().min(1),
  maxCapacity: z.number().int().nonnegative(),
  basePriceMyr: z.number().int().nonnegative(),
  cleaningFeeMyr: z.number().int().nonnegative(),
  serviceFeeMyr: z.number().int().nonnegative(),
  coverPhotoUrl: z.string().nullable(),
});

export const hallDetailsPhotoSchema = z.object({
  id: z.string().min(1),
  path: z.string().min(1),
  altText: z.string().nullable(),
  sortOrder: z.number().int(),
  isCover: z.boolean(),
  url: z.string().nullable(),
});

export const hallDetailsAmenitySchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
});

export const hallDetailsBookingSummarySchema = z.object({
  hallRentalMyr: z.number().int().nonnegative(),
  cleaningFeeMyr: z.number().int().nonnegative(),
  serviceFeeMyr: z.number().int().nonnegative(),
  estimatedTotalMyr: z.number().int().nonnegative(),
});

export const hallDetailsPayloadSchema = z.object({
  hall: hallDetailsHallSchema,
  photos: z.array(hallDetailsPhotoSchema),
  amenities: z.array(hallDetailsAmenitySchema),
  bookingSummary: hallDetailsBookingSummarySchema,
});

export type HallDetailsPayload = z.infer<typeof hallDetailsPayloadSchema>;
