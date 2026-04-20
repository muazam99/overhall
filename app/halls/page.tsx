import { HallsPageClient } from "@/features/halls/components/halls-page-client";
import { getInitialHallsPayload } from "@/features/halls/server/search-halls";

type HallsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HallsPage({ searchParams }: HallsPageProps) {
  const params = await searchParams;
  const initialPayload = await getInitialHallsPayload(params);

  return <HallsPageClient initialPayload={initialPayload} />;
}
