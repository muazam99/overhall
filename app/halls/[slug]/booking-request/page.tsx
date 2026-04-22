import { notFound, redirect } from "next/navigation";
import { BookingRequestPageClient } from "@/features/halls/components/booking-request-page-client";
import { bookingRequestQuerySchema } from "@/features/halls/schemas/booking-request.schema";
import { getHallDetailsBySlug } from "@/features/halls/server/get-hall-details";
import { getCurrentUser } from "@/lib/rbac";

type BookingRequestPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function normalizeQueryValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default async function BookingRequestPage({
  params,
  searchParams,
}: BookingRequestPageProps) {
  const [{ slug }, rawSearchParams] = await Promise.all([params, searchParams]);

  if (!slug || slug.trim().length === 0) {
    notFound();
  }

  const payload = await getHallDetailsBySlug(slug);
  if (!payload) {
    notFound();
  }

  const parsedQuery = bookingRequestQuerySchema.safeParse({
    eventDate: normalizeQueryValue(rawSearchParams.eventDate),
    startTime: normalizeQueryValue(rawSearchParams.startTime),
    guestCount: normalizeQueryValue(rawSearchParams.guestCount),
    endTime: normalizeQueryValue(rawSearchParams.endTime),
  });

  if (!parsedQuery.success) {
    redirect(`/halls/${payload.hall.slug}`);
  }

  const user = await getCurrentUser();

  return (
    <BookingRequestPageClient
      payload={payload}
      request={parsedQuery.data}
      defaults={{
        contactName: user?.name ?? "",
        contactEmail: user?.email ?? "",
      }}
    />
  );
}
