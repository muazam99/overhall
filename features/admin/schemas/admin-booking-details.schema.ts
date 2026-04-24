import { z } from "zod";

export const adminBookingStatusSchema = z.enum([
  "pending",
  "confirmed",
  "cancelled",
  "completed",
]);

export const adminPaymentStatusSchema = z.enum(["unpaid", "paid", "refunded"]);

export const adminBookingRequesterSchema = z.object({
  id: z.string().min(1),
  name: z.string().nullable(),
  email: z.string().nullable(),
  image: z.string().nullable(),
});

export const adminBookingHallSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  maxCapacity: z.number().int().nonnegative().nullable(),
  coverPhotoUrl: z.string().nullable(),
  status: z.enum(["draft", "published", "archived"]).nullable(),
});

export const adminBookingHallPhotoSchema = z.object({
  id: z.string().min(1),
  altText: z.string().nullable(),
  url: z.string().nullable(),
  isCover: z.boolean(),
  sortOrder: z.number().int(),
});

export const adminBookingAmenitySchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
});

export const adminBookingDetailsPayloadSchema = z.object({
  booking: z.object({
    id: z.string().min(1),
    displayCode: z.string().regex(/^BK-\d{4}$/),
    eventDate: z.string().min(1),
    startTime: z.string().min(1),
    endTime: z.string().min(1),
    guestCount: z.number().int().nonnegative(),
    hallRentalFeeMyr: z.number().int().nonnegative(),
    cleaningFeeMyr: z.number().int().nonnegative(),
    serviceFeeMyr: z.number().int().nonnegative(),
    totalFeeMyr: z.number().int().nonnegative(),
    status: adminBookingStatusSchema,
    paymentStatus: adminPaymentStatusSchema,
    contactName: z.string().nullable(),
    contactPhone: z.string().nullable(),
    contactEmail: z.string().nullable(),
    notes: z.string().nullable(),
    createdAtIso: z.string().min(1),
    updatedAtIso: z.string().min(1),
  }),
  requester: adminBookingRequesterSchema,
  hall: adminBookingHallSchema,
  hallPhotos: z.array(adminBookingHallPhotoSchema),
  amenities: z.array(adminBookingAmenitySchema),
});

export type AdminBookingDetailsPayload = z.infer<typeof adminBookingDetailsPayloadSchema>;
