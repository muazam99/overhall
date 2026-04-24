import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/shared/site-header";
import { AdminViewBookingClient } from "@/features/admin/components/admin-view-booking-client";
import { getAdminBookingDetails } from "@/features/admin/server/get-admin-booking-details";
import { requireRole } from "@/lib/rbac";

type AdminViewBookingPageProps = {
  params: Promise<{
    bookingId: string;
  }>;
};

export default async function AdminViewBookingPage({ params }: AdminViewBookingPageProps) {
  try {
    await requireRole("admin");
  } catch {
    redirect("/");
  }

  const { bookingId } = await params;
  if (!bookingId || bookingId.trim().length === 0) {
    redirect("/admin/bookings");
  }

  const payload = await getAdminBookingDetails(bookingId);
  if (!payload) {
    redirect("/admin/bookings");
  }

  return (
    <section className="min-h-screen bg-zinc-100 text-zinc-900">
      <header className="sticky top-0 z-30">
        <SiteHeader mode="admin" className="rounded-none border-x-0 border-t-0 shadow-none" />
      </header>

      <main className="mx-auto w-full max-w-[1360px] px-4 pb-12 pt-8 sm:px-6 sm:pt-10">
        <AdminViewBookingClient payload={payload} />
      </main>
    </section>
  );
}
