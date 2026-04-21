import { notFound } from "next/navigation";
import { HallDetailsPageClient } from "@/features/halls/components/hall-details-page-client";
import { getHallDetailsBySlug } from "@/features/halls/server/get-hall-details";

type HallDetailsPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function HallDetailsPage({ params }: HallDetailsPageProps) {
  const { slug } = await params;

  if (!slug || slug.trim().length === 0) {
    notFound();
  }

  const payload = await getHallDetailsBySlug(slug);
  if (!payload) {
    notFound();
  }

  return <HallDetailsPageClient payload={payload} />;
}
