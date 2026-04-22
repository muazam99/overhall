import { z } from "zod";

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const bookingRequestQuerySchema = z.object({
  eventDate: z.string().regex(isoDateRegex, "Invalid event date."),
  startTime: z.string().regex(timeRegex, "Invalid start time."),
  guestCount: z.coerce.number().int().positive(),
  endTime: z.string().regex(timeRegex, "Invalid end time."),
});

export type BookingRequestQuery = z.infer<typeof bookingRequestQuerySchema>;
