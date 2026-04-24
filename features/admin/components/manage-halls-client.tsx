"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type HallStatus = "draft" | "published" | "archived";

type HallItem = {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  maxCapacity: number;
  coverPhotoUrl: string | null;
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

const fallbackHallImages = [
  "https://images.unsplash.com/photo-1526568929-7cdd510e77fd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDM0ODN8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NzY5NTIwOTJ8&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1654869293304-636deb88354c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDM0ODN8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NzY5NTIwOTN8&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1764643588195-e18878c0a39c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDM0ODN8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NzY5NTIwOTN8&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1511286148006-ec48824e3282?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDM0ODN8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NzY5NTIwOTR8&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1723518120379-0a41cc403155?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDM0ODN8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NzY5NTIwOTR8&ixlib=rb-4.1.0&q=80&w=1080",
];

export function ManageHallsClient({ initialItems }: ManageHallsClientProps) {
  const items = initialItems;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-zinc-500">Showing {items.length} halls</p>
        <div className="flex items-center gap-2">
          <Button asChild type="button" size="sm" className="h-8 gap-1 px-3 text-xs">
            <Link href="/admin/halls/new">
              <Plus className="size-4" />
              Add Hall
            </Link>
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white px-4 py-6 text-sm text-zinc-500">
          No halls found.
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item, index) => (
          <article
            key={item.id}
            className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
          >
            <div
              className="h-40 w-full border-b border-zinc-200 bg-zinc-200 bg-cover bg-center"
              style={{
                backgroundImage: `url(${item.coverPhotoUrl ?? fallbackHallImages[index % fallbackHallImages.length]})`,
              }}
            />

            <div className="space-y-1 border-b border-zinc-200 px-6 py-5">
              <p className="truncate text-base font-medium text-zinc-900">{item.name}</p>
              <p className="text-xs text-zinc-500">
                Capacity {item.maxCapacity} - {item.city}, {item.state}
              </p>
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${statusPillClass(item.status)}`}
              >
                {item.status}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 px-6 py-4">

              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-8 border-zinc-300 bg-white px-4 text-[10px]"
              >
                <Link href={`/admin/halls/${item.id}`}>Manage Hall</Link>
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
