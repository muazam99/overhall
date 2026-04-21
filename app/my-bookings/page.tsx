import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/shared/site-header";
import { db } from "@/db";
import { booking, hall } from "@/db/schema";
import { MyBookingsListClient } from "@/features/bookings/components/my-bookings-list-client";
import { getCurrentUser } from "@/lib/rbac";

export default async function MyBookingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }

  const rows = await db
    .select({
      id: booking.id,
      eventDate: booking.eventDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
      guestCount: booking.guestCount,
      totalFeeMyr: booking.totalFeeMyr,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      hallName: hall.name,
      hallSlug: hall.slug,
      hallCity: hall.city,
      hallState: hall.state,
      createdAt: booking.createdAt,
    })
    .from(booking)
    .innerJoin(hall, eq(booking.hallId, hall.id))
    .where(eq(booking.bookerUserId, user.id))
    .orderBy(desc(booking.createdAt));

  return (
    <section className="min-h-screen bg-zinc-100 text-zinc-900">
      <header className="sticky top-0 z-30">
        <SiteHeader className="rounded-none border-x-0 border-t-0 shadow-none" />
      </header>

      <main className="mx-auto w-full max-w-5xl space-y-4 p-4 sm:p-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">My Bookings</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Manage your upcoming hall reservations and track booking status.
          </p>
        </div>

        <MyBookingsListClient
          initialItems={rows.map((row) => ({
            ...row,
            status: row.status,
            paymentStatus: row.paymentStatus,
          }))}
        />
      </main>
    </section>
  );
}
