import { z } from "zod";

export const myBookingStatusSchema = z.enum(["pending", "confirmed", "cancelled", "completed"]);

export const myBookingPaymentStatusSchema = z.enum(["unpaid", "paid", "refunded"]);

export const myBookingHallSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  country: z.string().nullable(),
  maxCapacity: z.number().int().nonnegative().nullable(),
  coverPhotoUrl: z.string().nullable(),
  status: z.enum(["draft", "published", "archived"]).nullable(),
});

export const myBookingHallPhotoSchema = z.object({
  id: z.string().min(1),
  altText: z.string().nullable(),
  url: z.string().nullable(),
  isCover: z.boolean(),
  sortOrder: z.number().int(),
});

export const myBookingAmenitySchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
});

export const myBookingRequesterSchema = z.object({
  name: z.string().nullable(),
  email: z.string().nullable(),
  image: z.string().nullable(),
});

export const myBookingDetailsPayloadSchema = z.object({
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
    status: myBookingStatusSchema,
    paymentStatus: myBookingPaymentStatusSchema,
    contactName: z.string().nullable(),
    contactPhone: z.string().nullable(),
    contactEmail: z.string().nullable(),
    notes: z.string().nullable(),
    createdAtIso: z.string().min(1),
    updatedAtIso: z.string().min(1),
  }),
  requester: myBookingRequesterSchema,
  hall: myBookingHallSchema,
  hallPhotos: z.array(myBookingHallPhotoSchema),
  amenities: z.array(myBookingAmenitySchema),
});

export type MyBookingDetailsPayload = z.infer<typeof myBookingDetailsPayloadSchema>;
