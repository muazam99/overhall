"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { SiteHeader } from "@/components/shared/site-header";
import { Button } from "@/components/ui/button";
import type { BookingRequestQuery } from "@/features/halls/schemas/booking-request.schema";
import type { HallDetailsPayload } from "@/features/halls/schemas/hall-details.schema";

type BookingRequestPageClientProps = {
  payload: HallDetailsPayload;
  request: BookingRequestQuery;
  defaults?: {
    contactName?: string;
    contactEmail?: string;
  };
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

export function BookingRequestPageClient({
  payload,
  request,
  defaults,
}: BookingRequestPageClientProps) {
  const [contactName, setContactName] = useState(defaults?.contactName ?? "");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState(defaults?.contactEmail ?? "");
  const [notes, setNotes] = useState("");
  const [agreedPolicy, setAgreedPolicy] = useState(false);

  const formattedDateLong = useMemo(() => formatEventDate(request.eventDate, true), [request.eventDate]);
  const formattedDateShort = useMemo(() => formatEventDate(request.eventDate, false), [request.eventDate]);
  const formattedStartTime = useMemo(() => formatTimeLabel(request.startTime), [request.startTime]);

  const locationLabel = `${payload.hall.city}, ${payload.hall.state}`;
  const metaLabel = `${formattedDateShort} | ${formattedStartTime} | ${request.guestCount} guests`;

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
          <span className="text-zinc-800">Booking request</span>
        </nav>

        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Booking request</h1>
          <p className="text-sm text-zinc-700">
            {payload.hall.name} | {locationLabel}
          </p>
          <p className="text-sm text-zinc-500">{metaLabel}</p>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-4">
            <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <h2 className="text-xl font-semibold text-zinc-900">Event details</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-md border border-zinc-200 px-3 py-2">
                  <p className="text-xs font-medium text-zinc-500">Event date</p>
                  <p className="mt-1 text-sm text-zinc-900">{formattedDateLong}</p>
                </div>
                <div className="rounded-md border border-zinc-200 px-3 py-2">
                  <p className="text-xs font-medium text-zinc-500">Start time</p>
                  <p className="mt-1 text-sm text-zinc-900">{formattedStartTime}</p>
                </div>
                <div className="rounded-md border border-zinc-200 px-3 py-2">
                  <p className="text-xs font-medium text-zinc-500">Duration</p>
                  <p className="mt-1 text-sm text-zinc-900">Full day</p>
                </div>
                <div className="rounded-md border border-zinc-200 px-3 py-2">
                  <p className="text-xs font-medium text-zinc-500">Guests</p>
                  <p className="mt-1 text-sm text-zinc-900">{request.guestCount} guests</p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <h2 className="text-xl font-semibold text-zinc-900">Contact details</h2>
              <div className="mt-3 space-y-2">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-zinc-600">Full name</span>
                  <input
                    value={contactName}
                    onChange={(event) => setContactName(event.target.value)}
                    className="h-10 w-full rounded-md border border-zinc-200 px-3 text-sm text-zinc-900 outline-none focus:border-zinc-500"
                    placeholder="Your name"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-zinc-600">Phone number</span>
                  <input
                    value={contactPhone}
                    onChange={(event) => setContactPhone(event.target.value)}
                    className="h-10 w-full rounded-md border border-zinc-200 px-3 text-sm text-zinc-900 outline-none focus:border-zinc-500"
                    placeholder="+60 12-345 6789"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-zinc-600">Email</span>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(event) => setContactEmail(event.target.value)}
                    className="h-10 w-full rounded-md border border-zinc-200 px-3 text-sm text-zinc-900 outline-none focus:border-zinc-500"
                    placeholder="you@email.com"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <h2 className="text-xl font-semibold text-zinc-900">Special requests</h2>
              <label className="mt-3 block space-y-1">
                <span className="text-xs font-medium text-zinc-600">Notes for host</span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="min-h-28 w-full rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500"
                  placeholder="Need AV setup, early access, catering timing, or any special requirements..."
                />
              </label>
              <p className="mt-2 text-xs text-zinc-500">
                You can include AV, decor setup, catering timing, and access requirements.
              </p>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <h2 className="text-xl font-semibold text-zinc-900">Policy snapshot</h2>
              <ul className="mt-3 space-y-1 text-sm text-zinc-600">
                <li>- Free cancellation up to 14 days before event date.</li>
                <li>- Overtime is charged at {formatPriceMyr(680)} per additional hour.</li>
                <li>- Host confirms within 24 hours for most requests.</li>
              </ul>
              <label className="mt-3 flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={agreedPolicy}
                  onChange={(event) => setAgreedPolicy(event.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                <span>I agree to the venue terms and cancellation policy.</span>
              </label>
            </section>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-semibold text-zinc-900">Booking summary</h2>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xl font-semibold text-zinc-900">
                  {formatPriceMyr(payload.hall.basePriceMyr)} / full day
                </p>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-2">
                <div className="rounded-md border border-zinc-200 px-3 py-2">
                  <p className="text-xs font-medium text-zinc-500">Event date</p>
                  <p className="mt-1 text-sm text-zinc-900">{formattedDateShort}</p>
                </div>
                <div className="rounded-md border border-zinc-200 px-3 py-2">
                  <p className="text-xs font-medium text-zinc-500">Start time</p>
                  <p className="mt-1 text-sm text-zinc-900">{formattedStartTime}</p>
                </div>
              </div>
              <div className="mt-2 rounded-md border border-zinc-200 px-3 py-2">
                <p className="text-xs font-medium text-zinc-500">Guests</p>
                <p className="mt-1 text-sm text-zinc-900">{request.guestCount} guests</p>
              </div>

              <div className="mt-3 grid gap-2">
                <Button
                  type="button"
                  className="h-10 rounded-md bg-zinc-900 text-zinc-50 hover:bg-zinc-800"
                  onClick={() => {
                    toast.info("Booking request submission will be enabled soon.");
                  }}
                >
                  Request to book
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-md border-zinc-300 bg-white"
                  onClick={() => {
                    toast.success("Saved to shortlist.");
                  }}
                >
                  Save to shortlist
                </Button>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between text-zinc-600">
                  <span>Hall rental (1 day)</span>
                  <span className="font-medium text-zinc-900">
                    {formatPriceMyr(payload.bookingSummary.hallRentalMyr)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-zinc-600">
                  <span>Cleaning &amp; reset</span>
                  <span className="font-medium text-zinc-900">
                    {formatPriceMyr(payload.bookingSummary.cleaningFeeMyr)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-zinc-600">
                  <span>Service fee</span>
                  <span className="font-medium text-zinc-900">
                    {formatPriceMyr(payload.bookingSummary.serviceFeeMyr)}
                  </span>
                </div>
                <div className="h-px bg-zinc-200" />
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-zinc-900">Estimated total</span>
                  <span className="text-base font-semibold text-zinc-900">
                    {formatPriceMyr(payload.bookingSummary.estimatedTotalMyr)}
                  </span>
                </div>
              </div>

              <p className="mt-3 text-xs leading-5 text-zinc-500">
                No payment will be charged yet. Host confirms within 24 hours, then you can proceed
                to payment.
              </p>
            </section>
          </aside>
        </div>
      </main>
    </section>
  );
}
