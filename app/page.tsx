import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { PageShell } from "@/components/shared/page-shell";
import { HomeArchitectureCard } from "@/features/home/components/home-architecture-card";
import { homeQueryOptions } from "@/features/home/queries/home.queries";
import { getHomeSummary } from "@/features/home/server/get-home-summary";
import { getQueryClient } from "@/lib/query/query-client";

export default async function Home() {
  const queryClient = getQueryClient();
  const summary = await getHomeSummary();
  queryClient.setQueryData(homeQueryOptions.queryKey, summary);

  return (
    <PageShell className="justify-center">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <HomeArchitectureCard />
      </HydrationBoundary>
    </PageShell>
  );
}
