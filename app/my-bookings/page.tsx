import { and, desc, eq, ilike, or } from "drizzle-orm";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/shared/site-header";
import { db } from "@/db";
import { booking, hall } from "@/db/schema";
import { MyBookingsListClient } from "@/features/bookings/components/my-bookings-list-client";
import { resolveHallPhotoUrl } from "@/lib/hall-photo";
import { getCurrentUser } from "@/lib/rbac";

type MyBookingsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchQuery(rawValue: string | string[] | undefined) {
  if (typeof rawValue !== "string") {
    return "";
  }

  return rawValue.trim().slice(0, 100);
}

export default async function MyBookingsPage({ searchParams }: MyBookingsPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }

  const params = await searchParams;
  const query = getSearchQuery(params.q);
  const queryPattern = `%${query}%`;

  const rows = await db
    .select({
      id: booking.id,
      eventDate: booking.eventDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
      guestCount: booking.guestCount,
      totalFeeMyr: booking.totalFeeMyr,
      status: booking.status,
      hallName: hall.name,
      hallSlug: hall.slug,
      hallCity: hall.city,
      hallState: hall.state,
      hallCoverPhoto: hall.coverPhotoUrl,
    })
    .from(booking)
    .innerJoin(hall, eq(booking.hallId, hall.id))
    .where(
      query.length > 0
        ? and(
            eq(booking.bookerUserId, user.id),
            or(
              ilike(hall.name, queryPattern),
              ilike(hall.city, queryPattern),
              ilike(hall.state, queryPattern),
              ilike(booking.status, queryPattern),
            ),
          )
        : eq(booking.bookerUserId, user.id),
    )
    .orderBy(desc(booking.createdAt));

  return (
    <section className="min-h-screen bg-[#fafafa] text-zinc-900">
      <header className="sticky top-0 z-30">
        <SiteHeader className="rounded-none border-x-0 border-t-0 shadow-none" />
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 pb-10 pt-7 sm:px-6 lg:px-8">
        <section className="space-y-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl">
              My Bookings
            </h1>
            <p className="text-sm text-zinc-500 sm:text-base">
              Track your hall reservations and upcoming event dates.
            </p>
          </div>
        </section>

        <div className="mt-6">
          <MyBookingsListClient
            initialItems={rows.map((row) => ({
              ...row,
              hallCoverPhotoUrl: resolveHallPhotoUrl(row.hallCoverPhoto),
            }))}
            searchQuery={query}
          />
        </div>
      </main>
    </section>
  );
}
