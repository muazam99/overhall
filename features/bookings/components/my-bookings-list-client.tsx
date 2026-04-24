"use client";

import { useState } from "react";
import Link from "next/link";
import { HallCoverImage } from "@/components/shared/hall-cover-image";
import { Button } from "@/components/ui/button";

type BookingListItem = {
  id: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  totalFeeMyr: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  hallName: string;
  hallSlug: string;
  hallCity: string;
  hallState: string;
  hallCoverPhotoUrl: string | null;
};

type MyBookingsListClientProps = {
  initialItems: BookingListItem[];
  searchQuery?: string;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatEventDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("en-MY", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function formatEventTime(time: string) {
  const parts = time.split(":");
  if (parts.length < 2) {
    return time;
  }

  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return time;
  }

  const parsed = new Date();
  parsed.setHours(hours, minutes, 0, 0);

  return new Intl.DateTimeFormat("en-MY", {
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function getTodayDateKey() {
  const today = new Date();
  const year = today.getFullYear();
  const month = `${today.getMonth() + 1}`.padStart(2, "0");
  const day = `${today.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isUpcomingBooking(item: BookingListItem) {
  if (item.status === "cancelled" || item.status === "completed") {
    return false;
  }

  return item.eventDate >= getTodayDateKey();
}

function getFilterBucket(item: BookingListItem) {
  return isUpcomingBooking(item) ? "upcoming" : "past";
}

function getTimelineBadge(item: BookingListItem) {
  if (item.status === "cancelled") {
    return {
      label: "Cancelled",
      className: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
    };
  }

  if (isUpcomingBooking(item)) {
    return {
      label: "Upcoming",
      className: "bg-zinc-900 text-zinc-50",
    };
  }

  return {
    label: "Past",
    className: "bg-white text-zinc-600 ring-1 ring-inset ring-zinc-200",
  };
}

function formatWorkflowStatus(status: BookingListItem["status"]) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function MyBookingsListClient({
  initialItems,
  searchQuery = "",
}: MyBookingsListClientProps) {
  const [items, setItems] = useState(initialItems);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "upcoming" | "past">("all");

  async function cancelBooking(bookingId: string) {
    setLoadingId(bookingId);
    setError(null);

    try {
      const response = await fetch(`/api/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ status: "cancelled" }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Failed to cancel booking.");
      }

      setItems((current) =>
        current.map((item) => (item.id === bookingId ? { ...item, status: "cancelled" } : item)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel booking.");
    } finally {
      setLoadingId(null);
    }
  }

  const visibleItems = items.filter((item) => {
    if (activeTab === "all") {
      return true;
    }

    return getFilterBucket(item) === activeTab;
  });

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <p className="text-base font-medium text-zinc-900">
          {searchQuery.length > 0 ? "No bookings matched your search." : "No bookings yet."}
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          {searchQuery.length > 0
            ? "Try another hall name, city, state, or booking status."
            : "Your upcoming reservations will appear here once you book a hall."}
        </p>
        <Button asChild className="mt-4 h-10 rounded-md bg-zinc-900 px-4 text-zinc-50 hover:bg-zinc-800">
          <Link href="/halls">Browse halls</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {[
          { value: "all", label: "All" },
          { value: "upcoming", label: "Upcoming" },
          { value: "past", label: "Past" },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={`inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? "bg-zinc-900 text-zinc-50 shadow-sm"
                : "bg-white text-zinc-700 ring-1 ring-inset ring-zinc-200 hover:bg-zinc-100"
            }`}
            onClick={() => setActiveTab(tab.value as "all" | "upcoming" | "past")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {error}
        </div>
      ) : null}

      {visibleItems.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-8 text-center shadow-sm">
          <p className="text-base font-medium text-zinc-900">
            No {activeTab === "all" ? "" : `${activeTab} `}bookings to show.
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            Switch tabs or browse more halls to add another reservation.
          </p>
        </div>
      ) : null}

      {visibleItems.map((item) => {
        const badge = getTimelineBadge(item);
        const isUpcoming = isUpcomingBooking(item);
        const canCancel = isUpcoming && item.status !== "cancelled";

        return (
          <article
            key={item.id}
            className="overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 lg:w-[184px]">
                <HallCoverImage
                  src={item.hallCoverPhotoUrl}
                  alt={item.hallName}
                  className="h-[118px] w-full object-cover"
                />
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <h2 className="text-xl font-semibold tracking-tight text-zinc-950">{item.hallName}</h2>
                  <span
                    className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-medium ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </div>

                <p className="text-sm text-zinc-700">
                  {formatEventDate(item.eventDate)} | {formatEventTime(item.startTime)} to{" "}
                  {formatEventTime(item.endTime)} | {item.guestCount} guests
                </p>
                <p className="text-sm text-zinc-500">
                  {item.hallCity}, {item.hallState}
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 lg:w-[180px] lg:items-end">
                <div className="space-y-1 text-left lg:text-right">
                  <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
                    {formatWorkflowStatus(item.status)}
                  </p>
                  <p className="text-2xl font-semibold tracking-tight text-zinc-950">
                    {formatCurrency(item.totalFeeMyr)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 lg:flex-col lg:items-end">
                  <Button
                    asChild
                    variant="outline"
                    className="h-9 rounded-md border-zinc-300 bg-white px-4 text-sm hover:bg-zinc-50"
                  >
                    <Link href={`/my-bookings/${item.id}`}>View Details</Link>
                  </Button>
                  {canCancel ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={loadingId === item.id}
                      className="h-8 rounded-md px-0 text-sm text-rose-700 hover:bg-transparent hover:text-rose-800"
                      onClick={() => void cancelBooking(item.id)}
                    >
                      {loadingId === item.id ? "Cancelling..." : "Cancel booking"}
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
