import { asc, desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/shared/site-header";
import { db } from "@/db";
import { booking, hall, user } from "@/db/schema";
import { AdminConsoleClient } from "@/features/admin/components/admin-console-client";
import { requireRole } from "@/lib/rbac";

export default async function AdminPage() {
  try {
    await requireRole("admin");
  } catch {
    redirect("/");
  }

  const [users, halls, bookings] = await Promise.all([
    db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      })
      .from(user)
      .orderBy(desc(user.createdAt), asc(user.id))
      .limit(25),
    db
      .select({
        id: hall.id,
        name: hall.name,
        slug: hall.slug,
        city: hall.city,
        state: hall.state,
        status: hall.status,
      })
      .from(hall)
      .orderBy(desc(hall.updatedAt), asc(hall.id))
      .limit(25),
    db
      .select({
        id: booking.id,
        hallName: hall.name,
        eventDate: booking.eventDate,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        totalFeeMyr: booking.totalFeeMyr,
      })
      .from(booking)
      .leftJoin(hall, eq(booking.hallId, hall.id))
      .orderBy(desc(booking.updatedAt), asc(booking.id))
      .limit(25),
  ]);

  return (
    <section className="min-h-screen bg-zinc-100 text-zinc-900">
      <header className="sticky top-0 z-30">
        <SiteHeader className="rounded-none border-x-0 border-t-0 shadow-none" />
      </header>
      <main className="mx-auto w-full max-w-6xl space-y-4 p-4 sm:p-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Admin Console</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Manage users, halls, and bookings. All mutations are enforced by admin-only API checks.
          </p>
        </div>

        <AdminConsoleClient
          users={users}
          halls={halls}
          bookings={bookings.map((item) => ({
            ...item,
            hallName: item.hallName ?? null,
          }))}
        />
      </main>
    </section>
  );
}
