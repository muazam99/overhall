"use client";

import { useState } from "react";
import Link from "next/link";
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
};

type MyBookingsListClientProps = {
  initialItems: BookingListItem[];
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function MyBookingsListClient({ initialItems }: MyBookingsListClientProps) {
  const [items, setItems] = useState(initialItems);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-zinc-600">No bookings yet.</p>
        <Button asChild className="mt-3 bg-zinc-900 text-zinc-50 hover:bg-zinc-800">
          <Link href="/halls">Browse halls</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {error}
        </div>
      ) : null}
      {items.map((item) => (
        <article key={item.id} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-zinc-900">{item.hallName}</h2>
              <p className="text-sm text-zinc-600">
                {item.hallCity}, {item.hallState}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-zinc-900">{formatCurrency(item.totalFeeMyr)}</p>
              <p className="text-xs uppercase tracking-[0.08em] text-zinc-500">{item.status}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-zinc-600">
            <span>{item.eventDate}</span>
            <span>
              {item.startTime} - {item.endTime}
            </span>
            <span>{item.guestCount} guests</span>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Button asChild size="sm" variant="outline" className="border-zinc-300 bg-white">
              <Link href={`/halls/${item.hallSlug}`}>View hall</Link>
            </Button>
            {item.status !== "cancelled" ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={loadingId === item.id}
                className="border-rose-300 text-rose-700 hover:bg-rose-50"
                onClick={() => void cancelBooking(item.id)}
              >
                {loadingId === item.id ? "Cancelling..." : "Cancel booking"}
              </Button>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
