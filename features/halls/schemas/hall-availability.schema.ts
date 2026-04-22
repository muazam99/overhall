import { z } from "zod";

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const hallAvailabilityParamsSchema = z.object({
  hallId: z.string().min(1),
});

export const hallAvailabilityQuerySchema = z.object({
  eventDate: z.string().regex(isoDateRegex, "Invalid event date. Use YYYY-MM-DD format."),
});

export type HallAvailabilityQuery = z.infer<typeof hallAvailabilityQuerySchema>;
