"use client";

import { useState } from "react";
import Link from "next/link";
import { HallCoverImage } from "@/components/shared/hall-cover-image";
import { Button } from "@/components/ui/button";
import type { MyBookingDetailsPayload } from "@/features/bookings/schemas/my-booking-details.schema";

type BookingStatus = MyBookingDetailsPayload["booking"]["status"];
type PaymentStatus = MyBookingDetailsPayload["booking"]["paymentStatus"];

type MyBookingDetailsClientProps = {
  payload: MyBookingDetailsPayload;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatEventDate(
  value: string,
  options?: { includeWeekday?: boolean; includeYear?: boolean },
) {
  const parsedDate = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-MY", {
    ...(options?.includeWeekday ? { weekday: "long" } : {}),
    day: "2-digit",
    month: "short",
    ...(options?.includeYear === false ? {} : { year: "numeric" }),
  }).format(parsedDate);
}

function formatTimeLabel(value: string) {
  const [hoursPart, minutesPart] = value.split(":");
  const hours = Number.parseInt(hoursPart ?? "", 10);
  const minutes = Number.parseInt(minutesPart ?? "", 10);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return value;
  }

  const parsedTime = new Date(Date.UTC(2000, 0, 1, hours, minutes));
  return new Intl.DateTimeFormat("en-MY", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).format(parsedTime);
}

function formatTimestamp(value: string) {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(parsedDate);
}

function startCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getTodayDateKey() {
  const today = new Date();
  const year = today.getFullYear();
  const month = `${today.getMonth() + 1}`.padStart(2, "0");
  const day = `${today.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isUpcomingBooking(eventDate: string, status: BookingStatus) {
  if (status === "cancelled" || status === "completed") {
    return false;
  }

  return eventDate >= getTodayDateKey();
}

function getStatusBadgeClass(status: BookingStatus) {
  if (status === "pending") {
    return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200";
  }

  if (status === "confirmed") {
    return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200";
  }

  if (status === "cancelled") {
    return "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200";
  }

  return "bg-zinc-100 text-zinc-700 ring-1 ring-inset ring-zinc-200";
}

function getPaymentBadgeClass(status: PaymentStatus) {
  if (status === "paid") {
    return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200";
  }

  if (status === "refunded") {
    return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200";
  }

  return "bg-zinc-100 text-zinc-700 ring-1 ring-inset ring-zinc-200";
}

function getStatusLabel(status: BookingStatus) {
  if (status === "pending") {
    return "Pending approval";
  }

  if (status === "confirmed") {
    return "Confirmed";
  }

  if (status === "cancelled") {
    return "Cancelled";
  }

  return "Completed";
}

function getLocationLabel(
  city: string | null,
  state: string | null,
  country: string | null,
) {
  const parts = [city, state, country].map((value) => value?.trim()).filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Location unavailable";
}

function getHeroImageUrl(payload: MyBookingDetailsPayload) {
  const coverPhoto = payload.hallPhotos.find((photo) => photo.isCover && photo.url);
  return (
    coverPhoto?.url ??
    payload.hall.coverPhotoUrl ??
    payload.hallPhotos.find((photo) => photo.url)?.url ??
    null
  );
}

function getGalleryPhotos(payload: MyBookingDetailsPayload) {
  const heroImageUrl = getHeroImageUrl(payload);
  const seenUrls = new Set<string>();

  return payload.hallPhotos
    .filter((photo) => {
      const photoUrl = photo.url?.trim();
      if (!photoUrl || photoUrl === heroImageUrl || seenUrls.has(photoUrl)) {
        return false;
      }

      seenUrls.add(photoUrl);
      return true;
    })
    .slice(0, 2);
}

function getManageHeading(status: BookingStatus) {
  if (status === "confirmed") {
    return "Booking confirmed";
  }

  if (status === "cancelled") {
    return "Booking cancelled";
  }

  if (status === "completed") {
    return "Booking completed";
  }

  return "Manage this booking";
}

function getManageMessage(status: BookingStatus, upcoming: boolean) {
  if (status === "confirmed") {
    return upcoming
      ? "Your booking is confirmed. You can review the hall details again or cancel if your plans change."
      : "This booking is confirmed. You can still review the hall and reservation details here.";
  }

  if (status === "cancelled") {
    return "This booking has already been cancelled. Browse more halls whenever you are ready to make a new reservation.";
  }

  if (status === "completed") {
    return "This event has already been completed. The details remain here for your reference.";
  }

  return "This request is still waiting for host confirmation. Review the venue again or cancel the booking if your plans have changed.";
}

function getNextStepsMessage(status: BookingStatus) {
  if (status === "confirmed") {
    return "The host has confirmed your booking. Any final coordination or payment updates will continue to appear here.";
  }

  if (status === "cancelled") {
    return "This booking is cancelled. If you still need a venue, you can return to browsing halls and submit a new request.";
  }

  if (status === "completed") {
    return "This booking is complete. You can keep this page as a historical record of the reservation details and fees.";
  }

  return "Once the host reviews your request, the workflow status and any updated payment details will be reflected here. We will also keep the last-updated timestamp current so you know when something changed.";
}

function getContactName(payload: MyBookingDetailsPayload) {
  return payload.booking.contactName ?? payload.requester.name ?? "Not provided";
}

function getContactEmail(payload: MyBookingDetailsPayload) {
  return payload.booking.contactEmail ?? payload.requester.email ?? "Not provided";
}

function DetailRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-sm text-zinc-500">{label}</dt>
      <dd className={`text-right text-sm font-medium text-zinc-900 ${valueClassName ?? ""}`}>
        {value}
      </dd>
    </div>
  );
}

export function MyBookingDetailsClient({ payload }: MyBookingDetailsClientProps) {
  const [bookingStatus, setBookingStatus] = useState(payload.booking.status);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const heroImageUrl = getHeroImageUrl(payload);
  const galleryPhotos = getGalleryPhotos(payload);
  const locationLabel = getLocationLabel(payload.hall.city, payload.hall.state, payload.hall.country);
  const contactName = getContactName(payload);
  const contactEmail = getContactEmail(payload);
  const contactPhone = payload.booking.contactPhone ?? "Not provided";
  const upcoming = isUpcomingBooking(payload.booking.eventDate, bookingStatus);
  const canCancel = upcoming && bookingStatus !== "cancelled" && bookingStatus !== "completed";
  const amenitiesLabel =
    payload.amenities.length > 0
      ? payload.amenities.map((item) => item.label).join(", ")
      : "No amenities listed";

  async function cancelBooking() {
    setIsCancelling(true);
    setError(null);

    try {
      const response = await fetch(`/api/bookings/${payload.booking.id}/status`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ status: "cancelled" }),
      });

      if (!response.ok) {
        const responsePayload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(responsePayload?.error ?? "Failed to cancel booking.");
      }

      setBookingStatus("cancelled");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Failed to cancel booking.",
      );
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
            My Bookings / Booking {payload.booking.displayCode}
          </p>
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl">
              My Booking Details
            </h1>
            <p className="max-w-3xl text-sm text-zinc-500 sm:text-base">
              Review your reservation, venue details, contact information, and fee breakdown in one
              place.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" className="border-zinc-300 bg-white">
            <Link href="/my-bookings">Back to Bookings</Link>
          </Button>
          <Button asChild className="bg-zinc-900 text-zinc-50 hover:bg-zinc-800">
            <Link href={`/halls/${payload.hall.slug}`}>View Hall</Link>
          </Button>
        </div>
      </div>

      <section className="rounded-[28px] border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
        <div
          className={`grid gap-3 ${
            galleryPhotos.length > 0 ? "lg:grid-cols-[minmax(0,720px)_220px] lg:justify-start" : ""
          }`}
        >
          <div className="aspect-[16/10] max-w-[720px] overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-100">
            <HallCoverImage
              src={heroImageUrl}
              alt={(payload.hall.name ?? "Hall") + " cover photo"}
              className="h-full w-full object-cover"
            />
          </div>

          {galleryPhotos.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {galleryPhotos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="aspect-[4/3] overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-100"
                >
                  <HallCoverImage
                    src={photo.url}
                    alt={photo.altText ?? `${payload.hall.name ?? "Hall"} photo ${index + 2}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeClass(bookingStatus)}`}
            >
              {getStatusLabel(bookingStatus)}
            </span>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getPaymentBadgeClass(payload.booking.paymentStatus)}`}
            >
              Payment: {startCase(payload.booking.paymentStatus)}
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-950">
              {payload.hall.name ?? "Unknown Hall"}
            </h2>
            <p className="text-sm text-zinc-500">{locationLabel}</p>
            <p className="text-sm font-medium text-zinc-700">
              {formatEventDate(payload.booking.eventDate, { includeWeekday: true })} •{" "}
              {formatTimeLabel(payload.booking.startTime)} -{" "}
              {formatTimeLabel(payload.booking.endTime)} • {payload.booking.guestCount} guests
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-zinc-50 p-4 ring-1 ring-inset ring-zinc-200">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                Booking Code
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-950">
                {payload.booking.displayCode}
              </p>
            </div>

            <div className="rounded-2xl bg-zinc-50 p-4 ring-1 ring-inset ring-zinc-200">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                Total
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-950">
                {formatCurrency(payload.booking.totalFeeMyr)}
              </p>
            </div>

            <div className="rounded-2xl bg-zinc-50 p-4 ring-1 ring-inset ring-zinc-200">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                Guest Count
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-950">
                {payload.booking.guestCount}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Capacity {payload.hall.maxCapacity ?? "--"} pax
              </p>
            </div>

            <div className="rounded-2xl bg-zinc-50 p-4 ring-1 ring-inset ring-zinc-200">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                Last Updated
              </p>
              <p className="mt-2 text-base font-semibold text-zinc-950">
                {formatTimestamp(payload.booking.updatedAtIso)}
              </p>
            </div>
          </div>

          <p className="text-sm leading-6 text-zinc-600">{getNextStepsMessage(bookingStatus)}</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-zinc-900">Booking Overview</h3>
            <dl className="mt-4 space-y-3">
              <DetailRow label="Booking ID" value={payload.booking.displayCode} />
              <DetailRow
                label="Event Date"
                value={formatEventDate(payload.booking.eventDate, { includeWeekday: true })}
              />
              <DetailRow
                label="Time Slot"
                value={`${formatTimeLabel(payload.booking.startTime)} - ${formatTimeLabel(payload.booking.endTime)}`}
              />
              <DetailRow label="Guest Count" value={`${payload.booking.guestCount} guests`} />
              <DetailRow label="Workflow" value={getStatusLabel(bookingStatus)} />
              <DetailRow label="Payment" value={startCase(payload.booking.paymentStatus)} />
              <DetailRow label="Submitted" value={formatTimestamp(payload.booking.createdAtIso)} />
              <DetailRow
                label="Last Updated"
                value={formatTimestamp(payload.booking.updatedAtIso)}
                valueClassName="font-semibold"
              />
            </dl>
          </article>

          <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-zinc-900">Venue Details</h3>
            <dl className="mt-4 space-y-3">
              <DetailRow label="Hall Name" value={payload.hall.name ?? "Unknown Hall"} />
              <DetailRow label="Location" value={locationLabel} />
              <DetailRow
                label="Max Capacity"
                value={
                  payload.hall.maxCapacity ? `${payload.hall.maxCapacity} pax` : "Not provided"
                }
              />
              <DetailRow
                label="Hall Status"
                value={payload.hall.status ? startCase(payload.hall.status) : "Unknown"}
              />
              <DetailRow label="Amenities" value={amenitiesLabel} valueClassName="max-w-[70%]" />
            </dl>
          </article>

          <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-zinc-900">Contact &amp; Notes</h3>
            <dl className="mt-4 space-y-3">
              <DetailRow label="Contact Name" value={contactName} />
              <DetailRow label="Email" value={contactEmail} />
              <DetailRow label="Phone" value={contactPhone} />
            </dl>

            <div className="mt-4 rounded-2xl bg-zinc-50 p-4 ring-1 ring-inset ring-zinc-200">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                Special Request
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-700">
                {payload.booking.notes ??
                  "No additional notes were added to this booking request."}
              </p>
            </div>
          </article>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <article className="rounded-3xl bg-zinc-950 p-5 text-zinc-50 shadow-sm">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl font-bold">{getManageHeading(bookingStatus)}</h3>
                <span className="inline-flex rounded-full bg-zinc-800 px-2.5 py-1 text-[11px] font-medium text-zinc-200">
                  {getStatusLabel(bookingStatus)}
                </span>
              </div>

              <p className="text-sm leading-6 text-zinc-300">
                {getManageMessage(bookingStatus, upcoming)}
              </p>
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            ) : null}

            <div className="mt-5 space-y-3">
              <Button
                asChild
                variant="outline"
                className="w-full border-zinc-700 bg-white text-zinc-950 hover:bg-zinc-100"
              >
                <Link href={`/halls/${payload.hall.slug}`}>View Hall Details</Link>
              </Button>

              <Button
                type="button"
                disabled={!canCancel || isCancelling}
                className="w-full bg-red-600 text-white hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-400"
                onClick={() => void cancelBooking()}
              >
                {bookingStatus === "cancelled"
                  ? "Booking Cancelled"
                  : isCancelling
                    ? "Cancelling..."
                    : "Cancel Booking"}
              </Button>
            </div>

            <div className="mt-5 rounded-2xl bg-zinc-900 px-4 py-3">
              <p className="text-sm font-semibold text-zinc-100">
                Booking Value: {formatCurrency(payload.booking.totalFeeMyr)}
              </p>
            </div>
          </article>

          <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-zinc-900">Price Breakdown</h3>
            <dl className="mt-4 space-y-3">
              <DetailRow
                label="Hall rental"
                value={formatCurrency(payload.booking.hallRentalFeeMyr)}
              />
              <DetailRow
                label="Cleaning fee"
                value={formatCurrency(payload.booking.cleaningFeeMyr)}
              />
              <DetailRow
                label="Service fee"
                value={formatCurrency(payload.booking.serviceFeeMyr)}
              />
              <DetailRow label="Payment status" value={startCase(payload.booking.paymentStatus)} />
            </dl>

            <div className="mt-4 flex items-center justify-between rounded-2xl bg-zinc-50 px-4 py-3 ring-1 ring-inset ring-zinc-200">
              <span className="text-sm font-semibold text-zinc-600">Total</span>
              <span className="text-2xl font-bold tracking-tight text-zinc-950">
                {formatCurrency(payload.booking.totalFeeMyr)}
              </span>
            </div>
          </article>

          <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-zinc-900">What happens next</h3>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              {getNextStepsMessage(bookingStatus)}
            </p>
          </article>
        </aside>
      </section>
    </div>
  );
}
