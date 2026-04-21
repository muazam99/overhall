"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, MapPinned, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/shared/site-header";
import { HallsMap } from "@/features/halls/components/halls-map";
import {
  hallsSearchResponseSchema,
  type HallsInitialPayload,
} from "@/features/halls/schemas/halls-search.schema";

type HallsPageClientProps = {
  initialPayload: HallsInitialPayload;
};

function formatPriceMyr(amount: number) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function HallsPageClient({ initialPayload }: HallsPageClientProps) {
  const { filters, mapPoints } = initialPayload;
  const [items, setItems] = useState(initialPayload.list.items);
  const [nextCursor, setNextCursor] = useState(initialPayload.list.nextCursor);
  const [hasMore, setHasMore] = useState(initialPayload.list.hasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hoveredHallId, setHoveredHallId] = useState<string | null>(null);
  const [selectedHallId, setSelectedHallId] = useState<string | null>(null);
  const [isMobileMapOpen, setMobileMapOpen] = useState(false);
  const [isFilterPanelOpen, setFilterPanelOpen] = useState(false);

  const itemsRef = useRef(items);
  const hasMoreRef = useRef(hasMore);
  const nextCursorRef = useRef(nextCursor);
  const isLoadingMoreRef = useRef(false);
  const cardRefs = useRef(new Map<string, HTMLElement>());

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    nextCursorRef.current = nextCursor;
  }, [nextCursor]);

  const filtersQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.activity) {
      params.set("activity", filters.activity);
    }
    if (filters.location) {
      params.set("location", filters.location);
    }
    if (filters.whenDate) {
      params.set("whenDate", filters.whenDate);
    }
    return params;
  }, [filters.activity, filters.location, filters.whenDate]);

  const registerCardRef = useCallback((hallId: string, node: HTMLElement | null) => {
    if (!node) {
      cardRefs.current.delete(hallId);
      return;
    }

    cardRefs.current.set(hallId, node);
  }, []);

  const scrollToHallCard = useCallback((hallId: string) => {
    const card = cardRefs.current.get(hallId);
    if (!card) {
      return;
    }

    card.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const fetchNextPage = useCallback(async () => {
    if (
      isLoadingMoreRef.current ||
      !hasMoreRef.current ||
      !nextCursorRef.current ||
      nextCursorRef.current.length === 0
    ) {
      return null;
    }

    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    try {
      const params = new URLSearchParams(filtersQuery);
      params.set("cursor", nextCursorRef.current);
      params.set("limit", "12");

      const response = await fetch(`/api/halls/search?${params.toString()}`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Failed to load more halls.");
      }

      const payload = hallsSearchResponseSchema.parse(await response.json());

      setItems((previous) => {
        const existingIds = new Set(previous.map((item) => item.id));
        const nextItems = payload.items.filter((item) => !existingIds.has(item.id));
        return [...previous, ...nextItems];
      });
      setHasMore(payload.hasMore);
      setNextCursor(payload.nextCursor);
      return payload;
    } finally {
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [filtersQuery]);

  const ensureHallLoaded = useCallback(
    async (hallId: string) => {
      if (itemsRef.current.some((item) => item.id === hallId)) {
        return true;
      }

      let attempts = 0;
      while (hasMoreRef.current && attempts < 200) {
        const payload = await fetchNextPage();
        attempts += 1;

        if (!payload) {
          break;
        }

        if (payload.items.some((item) => item.id === hallId)) {
          return true;
        }
      }

      return itemsRef.current.some((item) => item.id === hallId);
    },
    [fetchNextPage],
  );

  const handleMapSelectHall = useCallback(
    async (hallId: string) => {
      setSelectedHallId(hallId);
      setHoveredHallId(hallId);

      await ensureHallLoaded(hallId);
      requestAnimationFrame(() => {
        scrollToHallCard(hallId);
      });
    },
    [ensureHallLoaded, scrollToHallCard],
  );

  const handleMapSelectHallFromMap = useCallback((hallId: string) => {
    void handleMapSelectHall(hallId);
  }, [handleMapSelectHall]);

  const handleCardSelect = useCallback((hallId: string) => {
    setSelectedHallId(hallId);
    setHoveredHallId(hallId);
  }, []);

  const resultSummary = `${items.length} loaded${hasMore ? ` of ${mapPoints.length}+` : ""} halls`;

  const activeFilterChips = [
    filters.activity ? `Activity: ${filters.activity}` : null,
    filters.location ? `Location: ${filters.location}` : null,
    filters.whenDate ? `Date: ${filters.whenDate}` : null,
  ].filter(Boolean) as string[];

  return (
    <section className="min-h-screen bg-zinc-100 text-zinc-900">
      <header className="sticky top-0 z-30">
        <SiteHeader className="rounded-none border-x-0 border-t-0 shadow-none" />
      </header>

      <div className="mx-auto grid h-[calc(100vh-70px)] max-w-420 min-h-190 lg:grid-cols-[minmax(0,1.38fr)_minmax(0,1fr)]">
        <div className="flex min-h-0 flex-col gap-3 overflow-hidden bg-zinc-100 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Halls That Fit Your Event Energy</h1>
              <p className="text-sm text-zinc-600">
                {resultSummary}. Map markers always show full filtered results.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              className="h-9 gap-2 border-zinc-300 bg-white"
              onClick={() => setFilterPanelOpen((current) => !current)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </Button>
          </div>

          {activeFilterChips.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {activeFilterChips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-zinc-300 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-700"
                >
                  {chip}
                </span>
              ))}
            </div>
          ) : null}

          {isFilterPanelOpen ? (
            <form
              action="/halls"
              method="get"
              className="grid gap-2 rounded-xl border border-zinc-200 bg-white p-3 sm:grid-cols-4"
            >
              <input
                name="activity"
                placeholder="Activity"
                defaultValue={filters.activity}
                className="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none ring-0 focus:border-zinc-500"
              />
              <input
                name="location"
                placeholder="Location"
                defaultValue={filters.location}
                className="h-10 rounded-md border border-zinc-300 px-3 text-sm outline-none ring-0 focus:border-zinc-500"
              />
              <label className="flex h-10 items-center gap-2 rounded-md border border-zinc-300 px-3 text-sm text-zinc-700">
                <CalendarDays className="h-4 w-4 text-zinc-500" />
                <input
                  type="date"
                  name="whenDate"
                  defaultValue={filters.whenDate}
                  className="w-full bg-transparent outline-none"
                />
              </label>
              <Button type="submit" className="h-10 rounded-md bg-zinc-900 text-zinc-50 hover:bg-zinc-800">
                Apply
              </Button>
            </form>
          ) : null}

          <div className="min-h-0 flex-1 overflow-auto pr-1">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {items.map((item) => {
                const isHovered = hoveredHallId === item.id;
                const isSelected = selectedHallId === item.id;

                return (
                  <article
                    key={item.id}
                    ref={(node) => registerCardRef(item.id, node)}
                    onMouseEnter={() => setHoveredHallId(item.id)}
                    onMouseLeave={() => setHoveredHallId((current) => (current === item.id ? null : current))}
                    onClick={() => handleCardSelect(item.id)}
                    className={`cursor-pointer overflow-hidden rounded-xl border bg-white shadow-sm transition ${
                      isSelected
                        ? "border-violet-500 ring-2 ring-violet-200"
                        : isHovered
                          ? "border-sky-400"
                          : "border-zinc-200"
                    }`}
                  >
                    <div className="space-y-2 p-2.5">
                      <div className="overflow-hidden rounded-lg bg-zinc-100">
                        {item.coverPhotoUrl ? (
                          <img src={item.coverPhotoUrl} alt={item.name} className="h-28 w-full object-cover" />
                        ) : (
                          <div className="flex h-28 items-center justify-center text-sm text-zinc-500">
                            No photo
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-1 px-0.5 pb-0.5">
                        <h2 className="line-clamp-1 text-sm font-semibold text-zinc-900">{item.name}</h2>
                        <p className="line-clamp-1 text-xs text-zinc-600">
                          {item.city}, {item.state}
                        </p>
                        <div className="mt-1 flex items-center justify-between text-xs font-medium text-zinc-900">
                          <span>{formatPriceMyr(item.basePriceMyr)}</span>
                          <span>{item.maxCapacity} pax</span>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {hasMore ? (
              <div className="flex justify-center py-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-md border-zinc-300 bg-white"
                  onClick={() => {
                    void fetchNextPage();
                  }}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? "Loading..." : "Load more"}
                </Button>
              </div>
            ) : null}
          </div>
        </div>

        <aside className="hidden min-h-0 border-l border-zinc-200 bg-zinc-200 lg:flex lg:flex-col lg:p-3">
          <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-zinc-300 bg-zinc-50 shadow-sm">
            <HallsMap
              points={mapPoints}
              hoveredHallId={hoveredHallId}
              selectedHallId={selectedHallId}
              onSelectHall={handleMapSelectHallFromMap}
              className="h-full w-full"
            />
          </div>
        </aside>
      </div>

      <div className="fixed bottom-4 left-1/2 z-20 -translate-x-1/2 lg:hidden">
        <Button
          type="button"
          className="h-11 rounded-full bg-zinc-900 px-5 text-zinc-50 shadow-lg hover:bg-zinc-800"
          onClick={() => setMobileMapOpen(true)}
        >
          <MapPinned className="mr-2 h-4 w-4" />
          Show map
        </Button>
      </div>

      {isMobileMapOpen ? (
        <div className="fixed inset-0 z-40 bg-black/45 p-3 lg:hidden">
          <div className="flex h-full flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white">
            <div className="flex items-center justify-between border-b border-zinc-200 p-3">
              <p className="text-sm font-semibold text-zinc-900">Map view</p>
              <Button type="button" variant="ghost" className="h-8 px-2" onClick={() => setMobileMapOpen(false)}>
                Close
              </Button>
            </div>
            <HallsMap
              points={mapPoints}
              hoveredHallId={hoveredHallId}
              selectedHallId={selectedHallId}
              onSelectHall={handleMapSelectHallFromMap}
              className="h-full w-full"
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
