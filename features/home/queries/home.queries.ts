import { queryOptions } from "@tanstack/react-query";
import { homeSummarySchema } from "@/features/home/schemas/home-summary.schema";
import { queryKeys } from "@/lib/query/query-keys";

export const homeQueryOptions = queryOptions({
  queryKey: queryKeys.home.summary(),
  queryFn: async () => {
    const response = await fetch("/api/home/summary", { method: "GET" });
    if (!response.ok) {
      throw new Error("Failed to fetch home summary.");
    }

    const payload = await response.json();
    return homeSummarySchema.parse(payload);
  },
});
