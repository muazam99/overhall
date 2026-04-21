"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type UserItem = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  emailVerified: boolean;
};

type HallItem = {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  status: "draft" | "published" | "archived";
};

type BookingItem = {
  id: string;
  hallName: string | null;
  eventDate: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  paymentStatus: "unpaid" | "paid" | "refunded";
  totalFeeMyr: number;
};

type AdminConsoleClientProps = {
  users: UserItem[];
  halls: HallItem[];
  bookings: BookingItem[];
};

type UpdateState = {
  target: string | null;
  pending: boolean;
  error: string | null;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function AdminConsoleClient({ users, halls, bookings }: AdminConsoleClientProps) {
  const [userState, setUserState] = useState(users);
  const [hallState, setHallState] = useState(halls);
  const [bookingState, setBookingState] = useState(bookings);
  const [updateState, setUpdateState] = useState<UpdateState>({
    target: null,
    pending: false,
    error: null,
  });

  const totalRevenue = useMemo(
    () => bookingState.reduce((sum, booking) => sum + booking.totalFeeMyr, 0),
    [bookingState],
  );

  async function updateUserRole(userId: string, role: "user" | "admin") {
    setUpdateState({ target: `user-${userId}`, pending: true, error: null });
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Failed to update user role.");
      }

      setUserState((current) =>
        current.map((item) => (item.id === userId ? { ...item, role } : item)),
      );
    } catch (error) {
      setUpdateState({
        target: null,
        pending: false,
        error: error instanceof Error ? error.message : "Failed to update user role.",
      });
      return;
    }

    setUpdateState({ target: null, pending: false, error: null });
  }

  async function updateHallStatus(hallId: string, status: "draft" | "published" | "archived") {
    setUpdateState({ target: `hall-${hallId}`, pending: true, error: null });
    try {
      const response = await fetch(`/api/admin/halls/${hallId}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Failed to update hall status.");
      }

      setHallState((current) =>
        current.map((item) => (item.id === hallId ? { ...item, status } : item)),
      );
    } catch (error) {
      setUpdateState({
        target: null,
        pending: false,
        error: error instanceof Error ? error.message : "Failed to update hall status.",
      });
      return;
    }

    setUpdateState({ target: null, pending: false, error: null });
  }

  async function updateBooking(
    bookingId: string,
    payload: Partial<Pick<BookingItem, "status" | "paymentStatus">>,
  ) {
    setUpdateState({ target: `booking-${bookingId}`, pending: true, error: null });
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Failed to update booking.");
      }

      setBookingState((current) =>
        current.map((item) =>
          item.id === bookingId
            ? {
                ...item,
                ...(payload.status ? { status: payload.status } : {}),
                ...(payload.paymentStatus ? { paymentStatus: payload.paymentStatus } : {}),
              }
            : item,
        ),
      );
    } catch (error) {
      setUpdateState({
        target: null,
        pending: false,
        error: error instanceof Error ? error.message : "Failed to update booking.",
      });
      return;
    }

    setUpdateState({ target: null, pending: false, error: null });
  }

  return (
    <div className="space-y-4">
      {updateState.error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {updateState.error}
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Users</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">{userState.length}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Halls</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">{hallState.length}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">Revenue in list</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">{formatCurrency(totalRevenue)}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Users</h2>
        <div className="mt-3 grid gap-2">
          {userState.map((item) => (
            <div
              key={item.id}
              className="grid gap-2 rounded-lg border border-zinc-200 p-3 sm:grid-cols-[minmax(0,1fr)_150px]"
            >
              <div>
                <p className="font-medium text-zinc-900">{item.name}</p>
                <p className="text-sm text-zinc-600">{item.email}</p>
              </div>
              <select
                value={item.role}
                className="h-9 rounded-md border border-zinc-300 px-2 text-sm"
                disabled={updateState.pending}
                onChange={(event) =>
                  void updateUserRole(item.id, event.target.value as "user" | "admin")
                }
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Halls</h2>
        <div className="mt-3 grid gap-2">
          {hallState.map((item) => (
            <div
              key={item.id}
              className="grid gap-2 rounded-lg border border-zinc-200 p-3 sm:grid-cols-[minmax(0,1fr)_170px]"
            >
              <div>
                <p className="font-medium text-zinc-900">{item.name}</p>
                <p className="text-sm text-zinc-600">
                  {item.city}, {item.state}
                </p>
              </div>
              <select
                value={item.status}
                className="h-9 rounded-md border border-zinc-300 px-2 text-sm"
                disabled={updateState.pending}
                onChange={(event) =>
                  void updateHallStatus(
                    item.id,
                    event.target.value as "draft" | "published" | "archived",
                  )
                }
              >
                <option value="draft">draft</option>
                <option value="published">published</option>
                <option value="archived">archived</option>
              </select>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Bookings</h2>
        <div className="mt-3 grid gap-2">
          {bookingState.map((item) => (
            <div
              key={item.id}
              className="grid gap-2 rounded-lg border border-zinc-200 p-3 sm:grid-cols-[minmax(0,1fr)_150px_150px]"
            >
              <div>
                <p className="font-medium text-zinc-900">{item.hallName ?? "Unknown hall"}</p>
                <p className="text-sm text-zinc-600">{item.eventDate}</p>
              </div>
              <select
                value={item.status}
                className="h-9 rounded-md border border-zinc-300 px-2 text-sm"
                disabled={updateState.pending}
                onChange={(event) =>
                  void updateBooking(item.id, {
                    status: event.target.value as BookingItem["status"],
                  })
                }
              >
                <option value="pending">pending</option>
                <option value="confirmed">confirmed</option>
                <option value="cancelled">cancelled</option>
                <option value="completed">completed</option>
              </select>
              <select
                value={item.paymentStatus}
                className="h-9 rounded-md border border-zinc-300 px-2 text-sm"
                disabled={updateState.pending}
                onChange={(event) =>
                  void updateBooking(item.id, {
                    paymentStatus: event.target.value as BookingItem["paymentStatus"],
                  })
                }
              >
                <option value="unpaid">unpaid</option>
                <option value="paid">paid</option>
                <option value="refunded">refunded</option>
              </select>
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => window.location.reload()}
          className="border-zinc-300 bg-white"
        >
          Refresh
        </Button>
      </div>
    </div>
  );
}
