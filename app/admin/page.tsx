import Link from "next/link";
import { asc, count, desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/shared/site-header";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { booking, hall, user } from "@/db/schema";
import { requireRole } from "@/lib/rbac";

type RecentBookingItem = {
  id: string;
  hallName: string | null;
  eventDate: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
};

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

function formatTime(value: string) {
  const [hour = "00", minute = "00"] = value.split(":");
  return `${hour}:${minute}`;
}

function statusPillClass(status: RecentBookingItem["status"]) {
  if (status === "pending") {
    return "bg-zinc-900 text-zinc-50";
  }

  return "bg-zinc-100 text-zinc-700";
}

function actionLabel(status: RecentBookingItem["status"]) {
  if (status === "pending") {
    return "Review";
  }

  if (status === "completed") {
    return "Details";
  }

  return "View";
}

export default async function AdminPage() {
  try {
    await requireRole("admin");
  } catch {
    redirect("/");
  }

  const [totalUsers, totalHalls, pendingBookingsCount, recentBookings] = await Promise.all([
    db.select({ value: count(user.id) }).from(user),
    db.select({ value: count(hall.id) }).from(hall),
    db.select({ value: count(booking.id) }).from(booking).where(eq(booking.status, "pending")),
    db
      .select({
        id: booking.id,
        hallName: hall.name,
        eventDate: booking.eventDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        guestCount: booking.guestCount,
        status: booking.status,
      })
      .from(booking)
      .leftJoin(hall, eq(booking.hallId, hall.id))
      .orderBy(desc(booking.updatedAt), asc(booking.id))
      .limit(5),
  ]);

  const stats = {
    pendingBookings: Number(pendingBookingsCount[0]?.value ?? 0),
    halls: Number(totalHalls[0]?.value ?? 0),
    users: Number(totalUsers[0]?.value ?? 0),
  };

  return (
    <section className="min-h-screen bg-zinc-100 text-zinc-900">
      <header className="sticky top-0 z-30">
        <SiteHeader mode="admin" className="rounded-none border-x-0 border-t-0 shadow-none" />
      </header>

      <main className="mx-auto w-full max-w-[1360px] space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <section className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
            Admin Dashboard
          </h1>
          <p className="max-w-3xl text-sm text-zinc-600 sm:text-base">
            Overview of bookings, halls, and users with quick access to core admin tasks.
          </p>
        </section>

        <section className="grid gap-3 md:grid-cols-3 md:gap-4">
          <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-zinc-500">Pending Bookings</p>
            <p className="mt-3 text-2xl font-semibold text-zinc-900">{stats.pendingBookings}</p>
            <p className="text-xs text-zinc-500">Pending</p>
          </article>
          <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-zinc-500">Halls</p>
            <p className="mt-3 text-2xl font-semibold text-zinc-900">{stats.halls}</p>
            <p className="text-xs text-zinc-500">Listed</p>
          </article>
          <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-zinc-500">Users</p>
            <p className="mt-3 text-2xl font-semibold text-zinc-900">{stats.users}</p>
            <p className="text-xs text-zinc-500">Active</p>
          </article>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">Quick Actions</h2>
          <div className="grid gap-3 md:grid-cols-2 md:gap-4">
            <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-zinc-900">Manage Bookings</h3>
              <p className="mt-2 text-sm text-zinc-600">
                Review pending booking requests and update approval status quickly.
              </p>
              <Button asChild variant="outline" className="mt-4 border-zinc-300 bg-white">
                <Link href="/admin/bookings">Open Bookings</Link>
              </Button>
            </article>
            <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-zinc-900">Manage Halls</h3>
              <p className="mt-2 text-sm text-zinc-600">
                Update hall status, details, and listing readiness for publishing.
              </p>
              <Button asChild variant="outline" className="mt-4 border-zinc-300 bg-white">
                <Link href="/admin/halls">Open Halls</Link>
              </Button>
            </article>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">Recent Bookings</h2>
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            {recentBookings.map((item) => (
              <article
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 px-4 py-3 first:border-t-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900">
                    {item.id} | {item.hallName ?? "Unknown hall"}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {formatDate(item.eventDate)} | {formatTime(item.startTime)} -{" "}
                    {formatTime(item.endTime)} | {item.guestCount} pax
                  </p>
                  <span
                    className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${statusPillClass(item.status)}`}
                  >
                    {item.status.charAt(0).toUpperCase()}
                    {item.status.slice(1)}
                  </span>
                </div>
                <Button asChild variant="outline" size="sm" className="border-zinc-300 bg-white">
                  <Link href={`/admin/bookings/${item.id}`}>{actionLabel(item.status)}</Link>
                </Button>
              </article>
            ))}
          </div>
        </section>
      </main>
    </section>
  );
}
