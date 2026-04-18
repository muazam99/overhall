import { homeSummarySchema } from "@/features/home/schemas/home-summary.schema";

export async function getHomeSummary() {
  const payload = {
    title: "Architecture Baseline Is Ready",
    description:
      "This page now consumes a feature module with Zod schema, TanStack Query prefetching, and Zustand UI state.",
    updatedAt: new Date().toISOString(),
  };

  return homeSummarySchema.parse(payload);
}
