"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, CalendarDays } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useHomeUiStore } from "@/features/home/store/home-ui-store-provider";

const whenDateFormatter = new Intl.DateTimeFormat("en-MY", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function HomeSearchBar() {
  const [isWhenPanelOpen, setWhenPanelOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const activity = useHomeUiStore((state) => state.activity);
  const location = useHomeUiStore((state) => state.location);
  const whenDate = useHomeUiStore((state) => state.whenDate);
  const setActivity = useHomeUiStore((state) => state.setActivity);
  const setLocation = useHomeUiStore((state) => state.setLocation);
  const setWhenDate = useHomeUiStore((state) => state.setWhenDate);

  const selectedDate = whenDate ? new Date(`${whenDate}T00:00:00`) : undefined;
  const whenLabel = selectedDate ? whenDateFormatter.format(selectedDate) : "Anytime";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const params = new URLSearchParams();
    const activityValue = activity.trim();
    const locationValue = location.trim();

    if (activityValue.length > 0) {
      params.set("activity", activityValue);
    }
    if (locationValue.length > 0) {
      params.set("location", locationValue);
    }
    if (whenDate) {
      params.set("whenDate", whenDate);
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function handleClearWhen() {
    setWhenDate("");
  }

  return (
    <form
      id="search"
      onSubmit={handleSubmit}
      className="w-full max-w-315 rounded-xl border border-zinc-200 bg-white/95 p-2 shadow-[0_10px_24px_rgba(0,0,0,0.15)] backdrop-blur-sm"
    >
      <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto] lg:items-center">
        <div className="rounded-md px-3 py-2 sm:px-4">
          <label
            htmlFor="home-activity"
            className="block text-[11px] font-medium text-zinc-500 sm:text-xs"
          >
            What are you planning?
          </label>
          <input
            id="home-activity"
            name="activity"
            value={activity}
            onChange={(event) => setActivity(event.target.value)}
            placeholder="Enter your activity"
            className="mt-0.5 w-full border-none bg-transparent text-sm font-semibold text-zinc-900 outline-none placeholder:font-medium placeholder:text-zinc-400 sm:text-base"
          />
        </div>

        <div className="mx-1 hidden h-11 w-px bg-zinc-200 lg:block" />

        <div className="rounded-md px-3 py-2 sm:px-4">
          <label
            htmlFor="home-location"
            className="block text-[11px] font-medium text-zinc-500 sm:text-xs"
          >
            Where?
          </label>
          <input
            id="home-location"
            name="location"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Enter your location"
            className="mt-0.5 w-full border-none bg-transparent text-sm font-semibold text-zinc-900 outline-none placeholder:font-medium placeholder:text-zinc-400 sm:text-base"
          />
        </div>

        <div className="mx-1 hidden h-11 w-px bg-zinc-200 lg:block" />

        <div className="rounded-md px-3 py-2 sm:px-4">
          <p className="block text-[11px] font-medium text-zinc-500 sm:text-xs">When?</p>
          <button
            type="button"
            aria-expanded={isWhenPanelOpen}
            onClick={() => setWhenPanelOpen((previous) => !previous)}
            className="mt-0.5 flex w-full items-center justify-between gap-2 text-left text-sm font-semibold text-zinc-900 outline-none sm:text-base"
          >
            <span className="truncate">{whenLabel}</span>
            <CalendarDays className="h-4 w-4 shrink-0 text-zinc-500" />
          </button>
        </div>

        <Button
          type="submit"
          className="mt-1 h-10 w-full gap-2 rounded-md bg-zinc-900 px-6 text-sm text-zinc-50 hover:bg-zinc-800 lg:mt-0 lg:w-auto lg:px-7"
        >
          <ArrowRight className="h-4 w-4" />
          Search
        </Button>
      </div>

      {isWhenPanelOpen ? (
        <section className="mt-2 border-t border-zinc-200 px-2 pt-3 sm:px-4">
          <div className="mb-3 flex items-center justify-end">
            <button
              type="button"
              onClick={handleClearWhen}
              className="text-sm font-medium text-violet-600 hover:text-violet-500"
            >
              Clear
            </button>
          </div>

          <div className="pb-3">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => setWhenDate(date ? formatDateInputValue(date) : "")}
              className="p-0"
              classNames={{
                month: "space-y-5",
                month_caption: "relative flex items-center justify-start gap-3 px-2 pb-2",
                caption_label: "text-[42px] font-semibold leading-none text-zinc-900",
                nav: "flex items-center gap-1",
                button_previous:
                  "relative h-8 w-8 rounded-full border-none bg-transparent p-0 text-zinc-700 opacity-100 hover:bg-zinc-100",
                button_next:
                  "relative h-8 w-8 rounded-full border-none bg-transparent p-0 text-zinc-700 opacity-100 hover:bg-zinc-100",
                month_grid: "w-full border-collapse",
                weekdays: "mt-1 border-t border-zinc-200 pt-4",
                weekday: "w-12 text-sm font-semibold text-zinc-900",
                week: "mt-2",
                day: "h-12 w-12 text-center text-base p-0",
                day_button:
                  "h-12 w-12 rounded-full p-0 text-base font-medium text-zinc-800 hover:bg-zinc-100",
                outside: "text-zinc-300 opacity-100",
                today: "bg-transparent text-zinc-900",
                selected:
                  "[&>button]:bg-violet-600 [&>button]:text-white [&>button]:font-semibold [&>button:hover]:bg-violet-600",
              }}
            />
          </div>
        </section>
      ) : null}
    </form>
  );
}
