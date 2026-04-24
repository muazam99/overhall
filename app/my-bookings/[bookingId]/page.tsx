import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/shared/site-header";
import { MyBookingDetailsClient } from "@/features/bookings/components/my-booking-details-client";
import { getMyBookingDetails } from "@/features/bookings/server/get-my-booking-details";
import { getCurrentUser } from "@/lib/rbac";

type MyBookingDetailsPageProps = {
  params: Promise<{
    bookingId: string;
  }>;
};

export default async function MyBookingDetailsPage({ params }: MyBookingDetailsPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }

  const { bookingId } = await params;
  if (!bookingId || bookingId.trim().length === 0) {
    redirect("/my-bookings");
  }

  const payload = await getMyBookingDetails({ bookingId, userId: user.id });
  if (!payload) {
    redirect("/my-bookings");
  }

  return (
    <section className="min-h-screen bg-[#fafafa] text-zinc-900">
      <header className="sticky top-0 z-30">
        <SiteHeader className="rounded-none border-x-0 border-t-0 shadow-none" />
      </header>

      <main className="mx-auto w-full max-w-[1360px] px-4 pb-12 pt-8 sm:px-6 sm:pt-10">
        <MyBookingDetailsClient payload={payload} />
      </main>
    </section>
  );
}
