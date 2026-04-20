import { z } from "zod";

export const defaultHallsPageSize = 12;
export const hallsMapPointCap = 2000;

export const hallsFilterSchema = z.object({
  activity: z.string().trim().default(""),
  location: z.string().trim().default(""),
  whenDate: z.string().trim().default(""),
});

export const hallsSearchRequestSchema = hallsFilterSchema.extend({
  cursor: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(defaultHallsPageSize),
});

export const hallCardItemSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable(),
  city: z.string().min(1),
  state: z.string().min(1),
  maxCapacity: z.number().int().nonnegative(),
  basePriceMyr: z.number().int().nonnegative(),
  coverPhotoUrl: z.string().nullable(),
  updatedAt: z.string().min(1),
});

export const hallMapPointSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  basePriceMyr: z.number().int().nonnegative(),
  latitude: z.number(),
  longitude: z.number(),
});

export const hallsSearchResponseSchema = z.object({
  items: z.array(hallCardItemSchema),
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
});

export const hallsInitialPayloadSchema = z.object({
  filters: hallsFilterSchema,
  list: hallsSearchResponseSchema,
  mapPoints: z.array(hallMapPointSchema),
});

export type HallsFilter = z.infer<typeof hallsFilterSchema>;
export type HallCardItem = z.infer<typeof hallCardItemSchema>;
export type HallMapPoint = z.infer<typeof hallMapPointSchema>;
export type HallsSearchResponse = z.infer<typeof hallsSearchResponseSchema>;
export type HallsInitialPayload = z.infer<typeof hallsInitialPayloadSchema>;
