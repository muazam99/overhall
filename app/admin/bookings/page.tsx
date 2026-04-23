import Link from "next/link";
import { asc, desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/shared/site-header";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { booking, hall, user } from "@/db/schema";
import { requireRole } from "@/lib/rbac";

function formatDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusPillClass(status: "pending" | "confirmed" | "cancelled" | "completed") {
  if (status === "pending") {
    return "bg-zinc-900 text-zinc-50";
  }

  if (status === "confirmed") {
    return "bg-zinc-100 text-zinc-700";
  }

  if (status === "completed") {
    return "bg-zinc-100 text-zinc-700";
  }

  return "bg-rose-100 text-rose-700";
}

export default async function AdminManageBookingsPage() {
  try {
    await requireRole("admin");
  } catch {
    redirect("/");
  }

  const bookings = await db
    .select({
      id: booking.id,
      eventDate: booking.eventDate,
      guestCount: booking.guestCount,
      status: booking.status,
      hallName: hall.name,
      hallSlug: hall.slug,
      hallCity: hall.city,
      hallCoverPhoto: hall.coverPhotoUrl,
      bookerName: user.name,
    })
    .from(booking)
    .leftJoin(hall, eq(booking.hallId, hall.id))
    .leftJoin(user, eq(booking.bookerUserId, user.id))
    .orderBy(desc(booking.updatedAt), asc(booking.id))
    .limit(12);

  return (
    <section className="min-h-screen bg-zinc-100 text-zinc-900">
      <header className="sticky top-0 z-30">
        <SiteHeader mode="admin" className="rounded-none border-x-0 border-t-0 shadow-none" />
      </header>

      <main className="mx-auto w-full max-w-[1360px] space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <section className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
            Manage Bookings
          </h1>
          <p className="max-w-3xl text-sm text-zinc-600 sm:text-base">
            Review booking requests with user and hall context before approving.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-zinc-900">Booking Queue</h2>
          <div className="grid gap-4">
            {bookings.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
              >
                <div
                  className="h-32 w-full bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-500 bg-cover bg-center sm:h-36"
                  style={item.hallCoverPhoto ? { backgroundImage: `url(${item.hallCoverPhoto})` } : undefined}
                />

                <div className="flex flex-wrap items-start justify-between gap-3 p-4">
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm font-semibold text-zinc-900">
                      {item.id} · {item.bookerName ?? "Guest User"}
                    </p>
                    <p className="text-xs text-zinc-600">
                      {item.hallName ?? "Unknown Hall"} · {formatDate(item.eventDate)} ·{" "}
                      {item.guestCount} pax
                    </p>
                    {item.hallCity ? (
                      <p className="text-xs text-zinc-500">{item.hallCity}</p>
                    ) : null}
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${statusPillClass(item.status)}`}
                    >
                      {item.status.charAt(0).toUpperCase()}
                      {item.status.slice(1)}
                    </span>
                  </div>

                  <Button asChild variant="outline" className="border-zinc-300 bg-white">
                    <Link href={item.hallSlug ? `/halls/${item.hallSlug}` : `/admin?bookingId=${item.id}`}>
                      View Booking
                    </Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </section>
  );
}
