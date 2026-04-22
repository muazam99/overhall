import { z } from "zod";

const bookingStatusSchema = z.enum(["pending", "confirmed", "cancelled", "completed"]);

export const bookingRequestSubmittedParamsSchema = z.object({
  slug: z.string().trim().min(1),
});

export const bookingRequestSubmittedQuerySchema = z.object({
  bookingId: z.string().uuid(),
});

export const bookingRequestSubmittedPayloadSchema = z.object({
  bookingId: z.string().uuid(),
  status: bookingStatusSchema,
  submittedAtIso: z.string().datetime({ offset: true }),
  hall: z.object({
    slug: z.string().min(1),
    name: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
  }),
  request: z.object({
    eventDate: z.string().min(1),
    startTime: z.string().min(1),
    endTime: z.string().min(1),
    guestCount: z.number().int().positive(),
  }),
  fees: z.object({
    hallRentalMyr: z.number().int().nonnegative(),
    cleaningFeeMyr: z.number().int().nonnegative(),
    serviceFeeMyr: z.number().int().nonnegative(),
    totalFeeMyr: z.number().int().nonnegative(),
  }),
});

export type BookingRequestSubmittedPayload = z.infer<typeof bookingRequestSubmittedPayloadSchema>;
