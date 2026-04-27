import { HallsPageClient } from "@/features/halls/components/halls-page-client";
import { getInitialHallsPayload } from "@/features/halls/server/search-halls";

type HallsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HallsPage({ searchParams }: HallsPageProps) {
  const params = await searchParams;
  const initialPayload = await getInitialHallsPayload(params);
  const searchKey = new URLSearchParams(
    Object.entries(params).flatMap(([key, value]) =>
      Array.isArray(value) ? value.map((entry) => [key, entry]) : value ? [[key, value]] : [],
    ),
  ).toString();

  return <HallsPageClient key={searchKey || "all-halls"} initialPayload={initialPayload} />;
}
