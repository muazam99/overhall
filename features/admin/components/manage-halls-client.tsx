"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type HallStatus = "draft" | "published" | "archived";

type HallItem = {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  maxCapacity: number;
  status: HallStatus;
};

type ManageHallsClientProps = {
  initialItems: HallItem[];
};

function statusPillClass(status: HallStatus) {
  if (status === "published") {
    return "bg-zinc-900 text-zinc-50";
  }

  if (status === "draft") {
    return "bg-zinc-100 text-zinc-700";
  }

  return "bg-rose-100 text-rose-700";
}

export function ManageHallsClient({ initialItems }: ManageHallsClientProps) {
  const [items, setItems] = useState(initialItems);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(hallId: string, status: HallStatus) {
    setLoadingId(hallId);
    setError(null);

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

      setItems((current) =>
        current.map((item) => (item.id === hallId ? { ...item, status } : item)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update hall status.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4">
        {items.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <p className="truncate text-sm font-semibold text-zinc-900">{item.name}</p>
                <p className="text-xs text-zinc-600">
                  {item.city}, {item.state} · {item.maxCapacity} pax
                </p>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${statusPillClass(item.status)}`}
                >
                  {item.status.charAt(0).toUpperCase()}
                  {item.status.slice(1)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={item.status}
                  className="h-9 rounded-md border border-zinc-300 bg-white px-2 text-sm"
                  disabled={loadingId === item.id}
                  onChange={(event) =>
                    void updateStatus(item.id, event.target.value as HallStatus)
                  }
                >
                  <option value="draft">draft</option>
                  <option value="published">published</option>
                  <option value="archived">archived</option>
                </select>
                <Button asChild variant="outline" className="border-zinc-300 bg-white">
                  <Link href={`/halls/${item.slug}`}>Open Hall</Link>
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
