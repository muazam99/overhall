"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { HallCoverImage } from "@/components/shared/hall-cover-image";
import { Button } from "@/components/ui/button";
import type { AdminBookingDetailsPayload } from "@/features/admin/schemas/admin-booking-details.schema";

type BookingStatus = AdminBookingDetailsPayload["booking"]["status"];

type AdminViewBookingClientProps = {
  payload: AdminBookingDetailsPayload;
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

function getStatusBadgeClass(status: BookingStatus) {
  if (status === "pending") {
    return "bg-zinc-900 text-zinc-50";
  }

  if (status === "cancelled") {
    return "bg-rose-100 text-rose-700";
  }

  return "bg-zinc-100 text-zinc-700";
}

function getActionStatusBadgeClass(status: BookingStatus) {
  if (status === "pending") {
    return "bg-amber-400/15 text-amber-200 ring-1 ring-amber-300/20";
  }

  if (status === "cancelled") {
    return "bg-rose-400/15 text-rose-200 ring-1 ring-rose-300/20";
  }

  return "bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-300/20";
}

function getPaymentBadgeClass(
  paymentStatus: AdminBookingDetailsPayload["booking"]["paymentStatus"],
) {
  if (paymentStatus === "paid") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (paymentStatus === "refunded") {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-zinc-100 text-zinc-700";
}

function getStatusSummary(status: BookingStatus) {
  if (status === "confirmed") {
    return "Approved";
  }

  if (status === "cancelled") {
    return "Rejected";
  }

  if (status === "completed") {
    return "Completed";
  }

  return "Pending";
}

function getDecisionMessage(status: BookingStatus) {
  if (status === "confirmed") {
    return "This booking is already approved. Status controls stay locked after the first decision.";
  }

  if (status === "cancelled") {
    return "This booking has been rejected. Decision actions stay disabled after rejection.";
  }

  if (status === "completed") {
    return "This booking is completed, so decision actions are no longer available from this screen.";
  }

  return "Approve or reject this request once you've reviewed the hall, guest, and booking details.";
}

function getRequesterInitials(name: string | null) {
  const normalizedName = name?.trim() ?? "";
  if (normalizedName.length === 0) {
    return "GU";
  }

  const parts = normalizedName.split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function getLocationLabel(city: string | null, state: string | null) {
  const parts = [city, state].map((value) => value?.trim()).filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Location unavailable";
}

function getHeroImageUrl(payload: AdminBookingDetailsPayload) {
  const coverPhoto = payload.hallPhotos.find((photo) => photo.isCover && photo.url);
  return (
    coverPhoto?.url ??
    payload.hall.coverPhotoUrl ??
    payload.hallPhotos.find((photo) => photo.url)?.url ??
    null
  );
}

export function AdminViewBookingClient({ payload }: AdminViewBookingClientProps) {
  const [bookingStatus, setBookingStatus] = useState(payload.booking.status);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const heroImageUrl = getHeroImageUrl(payload);
  const galleryPhotos = payload.hallPhotos.filter((photo) => photo.url).slice(0, 2);
  const requesterName = payload.booking.contactName ?? payload.requester.name ?? "Guest User";
  const requesterEmail =
    payload.booking.contactEmail ?? payload.requester.email ?? "No email provided";
  const requesterPhone = payload.booking.contactPhone ?? "Not provided";
  const locationLabel = getLocationLabel(payload.hall.city, payload.hall.state);
  const isActionable = bookingStatus === "pending";

  async function updateBookingStatus(nextStatus: Extract<BookingStatus, "confirmed" | "cancelled">) {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/bookings/${payload.booking.id}/status`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        const responsePayload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(responsePayload?.error ?? "Failed to update booking status.");
      }

      setBookingStatus(nextStatus);
      toast.success(
        nextStatus === "confirmed"
          ? "Booking approved successfully."
          : "Booking rejected successfully.",
      );
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Failed to update booking status.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Button asChild variant="outline" className="border-zinc-300 bg-white">
          <Link href="/admin/bookings">Back to Booking List</Link>
        </Button>

        <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">
          Manage Bookings / View Booking
        </p>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
            Booking {payload.booking.displayCode}
          </h1>
          <p className="max-w-3xl text-sm text-zinc-600 sm:text-base">
            Decision-ready booking view with event, user, and hall context in one place.
          </p>
        </div>
      </div>

      <section className="grid gap-3 md:grid-cols-3 md:gap-4">
        <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">Event Date</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-900">
            {formatEventDate(payload.booking.eventDate)}
          </p>
          <p className="text-xs text-zinc-500">
            {formatEventDate(payload.booking.eventDate, {
              includeWeekday: true,
              includeYear: false,
            })}
          </p>
        </article>

        <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">Guest Count</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-900">{payload.booking.guestCount} Pax</p>
          <p className="text-xs text-zinc-500">
            {payload.hall.maxCapacity
              ? `${payload.hall.maxCapacity} pax hall capacity`
              : "Capacity not available"}
          </p>
        </article>

        <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">Total Fee</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-900">
            {formatCurrency(payload.booking.totalFeeMyr)}
          </p>
          <span
            className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${getPaymentBadgeClass(payload.booking.paymentStatus)}`}
          >
            {startCase(payload.booking.paymentStatus)}
          </span>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="h-64 w-full bg-zinc-200 sm:h-72">
              <HallCoverImage
                src={heroImageUrl}
                alt={(payload.hall.name ?? "Unknown Hall") + " cover photo"}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="space-y-3 p-5">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
                  {(payload.hall.name ?? "Unknown Hall")} - Booking {payload.booking.displayCode}
                </h2>
                <p className="text-sm text-zinc-600">
                  {formatEventDate(payload.booking.eventDate)} |{" "}
                  {formatTimeLabel(payload.booking.startTime)} -{" "}
                  {formatTimeLabel(payload.booking.endTime)} | {payload.booking.guestCount} pax
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(bookingStatus)}`}
                >
                  {startCase(bookingStatus)}
                </span>
                <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                  {locationLabel}
                </span>
              </div>
            </div>
          </article>

          <div className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-zinc-900">Booking Summary</h3>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-zinc-500">Booking ID</dt>
                  <dd className="font-medium text-zinc-900">{payload.booking.displayCode}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-zinc-500">Event Date</dt>
                  <dd className="font-medium text-zinc-900">
                    {formatEventDate(payload.booking.eventDate, { includeWeekday: true })}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-zinc-500">Time Slot</dt>
                  <dd className="font-medium text-zinc-900">
                    {formatTimeLabel(payload.booking.startTime)} -{" "}
                    {formatTimeLabel(payload.booking.endTime)}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-zinc-500">Guest Count</dt>
                  <dd className="font-medium text-zinc-900">{payload.booking.guestCount} pax</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-zinc-500">Payment</dt>
                  <dd className="font-medium text-zinc-900">
                    {startCase(payload.booking.paymentStatus)}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-zinc-500">Updated</dt>
                  <dd className="font-medium text-zinc-900">
                    {formatTimestamp(payload.booking.updatedAtIso)}
                  </dd>
                </div>
                <div className="border-t border-zinc-200 pt-3">
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-zinc-500">Total</dt>
                    <dd className="text-base font-semibold text-zinc-900">
                      {formatCurrency(payload.booking.totalFeeMyr)}
                    </dd>
                  </div>
                </div>
              </dl>
            </article>

            <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-zinc-900">Requester</h3>
              <div className="mt-4 flex items-center gap-3">
                {payload.requester.image ? (
                  <div
                    className="h-[52px] w-[52px] rounded-full bg-zinc-200 bg-cover bg-center"
                    style={{ backgroundImage: `url(${payload.requester.image})` }}
                  />
                ) : (
                  <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-zinc-50">
                    {getRequesterInitials(requesterName)}
                  </div>
                )}

                <div className="min-w-0 space-y-1">
                  <p className="truncate text-sm font-semibold text-zinc-900">{requesterName}</p>
                  <p className="truncate text-sm text-zinc-600">{requesterEmail}</p>
                </div>
              </div>

              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-zinc-500">Phone</dt>
                  <dd className="font-medium text-zinc-900">{requesterPhone}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-zinc-500">Submitted</dt>
                  <dd className="text-right font-medium text-zinc-900">
                    {formatTimestamp(payload.booking.createdAtIso)}
                  </dd>
                </div>
              </dl>
            </article>
          </div>

          <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-zinc-900">Hall Information</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <dt className="text-zinc-500">Name</dt>
                <dd className="font-medium text-zinc-900">{payload.hall.name ?? "Unknown Hall"}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-zinc-500">Location</dt>
                <dd className="text-right font-medium text-zinc-900">{locationLabel}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-zinc-500">Capacity</dt>
                <dd className="font-medium text-zinc-900">
                  {payload.hall.maxCapacity ? `${payload.hall.maxCapacity} pax` : "Not available"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-zinc-500">Status</dt>
                <dd className="font-medium text-zinc-900">
                  {payload.hall.status ? startCase(payload.hall.status) : "Unknown"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-zinc-500">Amenities</dt>
                <dd className="max-w-[70%] text-right font-medium text-zinc-900">
                  {payload.amenities.length > 0
                    ? payload.amenities.map((item) => item.label).join(", ")
                    : "No amenities listed"}
                </dd>
              </div>
            </dl>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 2 }).map((_, index) => {
                const photo = galleryPhotos[index];
                return (
                  <div
                    key={photo?.id ?? `placeholder-${index}`}
                    className="h-28 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100"
                  >
                    <HallCoverImage
                      src={photo?.url}
                      alt={photo?.altText ?? `${payload.hall.name ?? "Hall"} photo ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                );
              })}
            </div>
          </article>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <article className="rounded-2xl bg-zinc-950 p-5 text-zinc-50 shadow-sm">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl font-bold">Take Action</h3>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${getActionStatusBadgeClass(bookingStatus)}`}
                >
                  {getStatusSummary(bookingStatus)}
                </span>
              </div>
              <p className="text-sm leading-6 text-zinc-300">{getDecisionMessage(bookingStatus)}</p>
            </div>

            {error ? (
              <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {error}
              </div>
            ) : null}

            <div className="mt-5 space-y-3">
              <Button
                type="button"
                variant="outline"
                disabled={!isActionable || isSaving}
                className="w-full border-zinc-700 bg-white text-zinc-950 hover:bg-zinc-100"
                onClick={() => void updateBookingStatus("confirmed")}
              >
                {isSaving ? "Updating..." : "Approve Booking"}
              </Button>
              <Button
                type="button"
                disabled={!isActionable || isSaving}
                className="w-full bg-red-600 text-white hover:bg-red-500"
                onClick={() => void updateBookingStatus("cancelled")}
              >
                {isSaving ? "Updating..." : "Reject Booking"}
              </Button>
            </div>

            <div className="mt-5 rounded-xl bg-zinc-900 px-4 py-3">
              <p className="text-sm font-semibold text-zinc-100">
                Booking Value: {formatCurrency(payload.booking.totalFeeMyr)}
              </p>
            </div>
          </article>

          <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-zinc-900">Review Notes</h3>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              {payload.booking.notes ??
                "No reviewer notes yet. Add remarks when approving or rejecting to keep audit history clear."}
            </p>
          </article>
        </aside>
      </section>
    </div>
  );
}
