"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/shared/site-header";
import { Button } from "@/components/ui/button";
import type { BookingRequestSubmittedPayload } from "@/features/halls/schemas/booking-request-submitted.schema";

type BookingRequestSubmittedPageClientProps = {
  payload: BookingRequestSubmittedPayload;
};

function formatPriceMyr(amount: number) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatEventDate(value: string, includeYear = true) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-MY", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    ...(includeYear ? { year: "numeric" } : {}),
  }).format(date);
}

function formatTimeLabel(value: string) {
  const [hoursPart, minutesPart] = value.split(":");
  const hours = Number.parseInt(hoursPart ?? "", 10);
  const minutes = Number.parseInt(minutesPart ?? "", 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return value;
  }

  const date = new Date(Date.UTC(2000, 0, 1, hours, minutes));
  return new Intl.DateTimeFormat("en-MY", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).format(date);
}

function formatSubmittedAt(value: string, withWeekday = false) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-MY", {
    ...(withWeekday ? { weekday: "short" } : {}),
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withWeekday ? {} : { hour: "numeric", minute: "2-digit", hour12: true }),
  }).format(date);
}

function getStatusLabel(status: BookingRequestSubmittedPayload["status"]) {
  if (status === "confirmed") {
    return "Confirmed by host";
  }

  if (status === "cancelled") {
    return "Cancelled";
  }

  if (status === "completed") {
    return "Completed";
  }

  return "Pending host confirmation";
}

function getStatusDescription(status: BookingRequestSubmittedPayload["status"]) {
  if (status === "confirmed") {
    return "Your booking request has been confirmed. We will send payment and finalization steps next.";
  }

  if (status === "cancelled") {
    return "This booking request is currently cancelled. You can browse other halls and submit a new request.";
  }

  if (status === "completed") {
    return "This booking has been marked as completed. Thank you for booking with Overhall.";
  }

  return "Your booking request has been submitted successfully. The host usually confirms within 24 hours.";
}

export function BookingRequestSubmittedPageClient({
  payload,
}: BookingRequestSubmittedPageClientProps) {
  const statusLabel = getStatusLabel(payload.status);
  const statusDescription = getStatusDescription(payload.status);
  const hallMetaLabel = `${payload.hall.name} | ${payload.hall.city}, ${payload.hall.state}`;
  const requestSentLabel = `Request sent on ${formatSubmittedAt(payload.submittedAtIso, true)}`;
  const formattedEventDateLong = formatEventDate(payload.request.eventDate, true);
  const formattedEventDateShort = formatEventDate(payload.request.eventDate, false);
  const formattedStartTime = formatTimeLabel(payload.request.startTime);
  const formattedEndTime = formatTimeLabel(payload.request.endTime);

  return (
    <section className="min-h-screen bg-zinc-100 text-zinc-900">
      <header className="sticky top-0 z-30">
        <SiteHeader className="rounded-none border-x-0 border-t-0 shadow-none" />
      </header>

      <main className="mx-auto w-full max-w-360 px-4 pb-12 pt-5 sm:px-6">
        <nav className="mb-2 text-xs font-medium text-zinc-500">
          <Link href={`/halls/${payload.hall.slug}`} className="hover:text-zinc-700">
            Hall details
          </Link>
          <span className="mx-2">/</span>
          <span>Booking request</span>
          <span className="mx-2">/</span>
          <span className="text-zinc-800">Submitted</span>
        </nav>

        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Booking request submitted
          </h1>
          <p className="text-sm text-zinc-700">{hallMetaLabel}</p>
          <p className="text-sm text-zinc-500">{requestSentLabel}</p>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-4">
            <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <h2 className="text-xl font-semibold text-zinc-900">Request sent to host</h2>
              <p className="mt-2 text-sm text-zinc-600">{statusDescription}</p>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Request ID</span>
                  <span className="font-semibold text-zinc-900">{payload.bookingId}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Submitted at</span>
                  <span className="font-medium text-zinc-900">
                    {formatSubmittedAt(payload.submittedAtIso)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Current status</span>
                  <span className="font-semibold text-zinc-900">{statusLabel}</span>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <h2 className="text-xl font-semibold text-zinc-900">What happens next</h2>
              <ul className="mt-2 space-y-1 text-sm text-zinc-600">
                <li>- Host reviews your request and confirms availability.</li>
                <li>- You receive an in-app notification and email update.</li>
                <li>- Payment and final confirmation are completed after host approval.</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <h2 className="text-xl font-semibold text-zinc-900">Booking snapshot</h2>
              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Event date</span>
                  <span className="font-medium text-zinc-900">{formattedEventDateLong}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Time</span>
                  <span className="font-medium text-zinc-900">
                    {formattedStartTime} - {formattedEndTime}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Guests</span>
                  <span className="font-medium text-zinc-900">{payload.request.guestCount} guests</span>
                </div>
              </div>
            </section>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-semibold text-zinc-900">Booking summary</h2>

              <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-800">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>{statusLabel}</span>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <p className="text-xl font-semibold text-zinc-900">
                  {formatPriceMyr(payload.fees.hallRentalMyr)} / full day
                </p>
                <p className="text-sm text-zinc-500">
                  {payload.status.charAt(0).toUpperCase()}
                  {payload.status.slice(1)}
                </p>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-2">
                <div className="rounded-md border border-zinc-200 px-3 py-2">
                  <p className="text-xs font-medium text-zinc-500">Event date</p>
                  <p className="mt-1 text-sm text-zinc-900">{formattedEventDateShort}</p>
                </div>
                <div className="rounded-md border border-zinc-200 px-3 py-2">
                  <p className="text-xs font-medium text-zinc-500">Start time</p>
                  <p className="mt-1 text-sm text-zinc-900">{formattedStartTime}</p>
                </div>
              </div>
              <div className="mt-2 rounded-md border border-zinc-200 px-3 py-2">
                <p className="text-xs font-medium text-zinc-500">Guests</p>
                <p className="mt-1 text-sm text-zinc-900">{payload.request.guestCount} guests</p>
              </div>

              <Button
                asChild
                type="button"
                variant="outline"
                className="mt-3 h-10 w-full rounded-md border-zinc-300 bg-white"
              >
                <Link href="/my-bookings">View booking</Link>
              </Button>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between text-zinc-600">
                  <span>Hall rental (1 day)</span>
                  <span className="font-medium text-zinc-900">
                    {formatPriceMyr(payload.fees.hallRentalMyr)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-zinc-600">
                  <span>Cleaning &amp; reset</span>
                  <span className="font-medium text-zinc-900">
                    {formatPriceMyr(payload.fees.cleaningFeeMyr)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-zinc-600">
                  <span>Service fee</span>
                  <span className="font-medium text-zinc-900">
                    {formatPriceMyr(payload.fees.serviceFeeMyr)}
                  </span>
                </div>
                <div className="h-px bg-zinc-200" />
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-zinc-900">Estimated total</span>
                  <span className="text-base font-semibold text-zinc-900">
                    {formatPriceMyr(payload.fees.totalFeeMyr)}
                  </span>
                </div>
              </div>

              <p className="mt-3 text-xs leading-5 text-zinc-500">
                Host confirmation is pending. We will notify you as soon as the host responds.
              </p>
            </section>
          </aside>
        </div>
      </main>
    </section>
  );
}
