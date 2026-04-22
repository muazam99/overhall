"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronDown, Clock3 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/shared/site-header";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuthPrompt } from "@/features/auth/components/auth-prompt-provider";
import type { HallDetailsPayload } from "@/features/halls/schemas/hall-details.schema";
import { cn } from "@/lib/utils";

type HallDetailsPageClientProps = {
  payload: HallDetailsPayload;
};

type SectionId = "highlights" | "about" | "amenities";
type AvailabilityFieldErrors = {
  eventDate?: string;
  startTime?: string;
  guestCount?: string;
};

function formatPriceMyr(amount: number) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function sectionIdForPanel(section: SectionId) {
  return `hall-details-section-${section}`;
}

function parseIsoDate(value: string) {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed;
}

function formatIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateLabel(value: string) {
  const parsed = parseIsoDate(value);
  if (!parsed) {
    return "Select date";
  }

  return new Intl.DateTimeFormat("en-MY", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function formatTimeLabel(value: string) {
  if (!value) {
    return "Select time";
  }

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

const timeOptions = Array.from({ length: 48 }, (_, index) => {
  const hours = Math.floor(index / 2);
  const minutes = index % 2 === 0 ? "00" : "30";
  const value = `${String(hours).padStart(2, "0")}:${minutes}`;
  return { value, label: formatTimeLabel(value) };
});

export function HallDetailsPageClient({ payload }: HallDetailsPageClientProps) {
  const router = useRouter();
  const { openLogin } = useAuthPrompt();
  const [openSections, setOpenSections] = useState<SectionId[]>([]);
  const [isDatePickerOpen, setDatePickerOpen] = useState(false);
  const [isTimePickerOpen, setTimePickerOpen] = useState(false);
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [fieldErrors, setFieldErrors] = useState<AvailabilityFieldErrors>({});
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  const locationLabel = `${payload.hall.city}, ${payload.hall.state}, ${payload.hall.country}`;
  const hallPriceLabel = `${formatPriceMyr(payload.hall.basePriceMyr)} / full day`;

  const fallbackDescription =
    "This hall listing is newly published. A full venue description will be available soon.";

  const galleryPhotos = useMemo(() => {
    const withResolvedUrls = payload.photos
      .map((photo) => ({
        url: photo.url,
        alt: photo.altText?.trim() || `${payload.hall.name} photo`,
      }))
      .filter((photo) => typeof photo.url === "string" && photo.url.length > 0);

    if (
      withResolvedUrls.length === 0 &&
      payload.hall.coverPhotoUrl &&
      payload.hall.coverPhotoUrl.length > 0
    ) {
      withResolvedUrls.push({
        url: payload.hall.coverPhotoUrl,
        alt: `${payload.hall.name} cover photo`,
      });
    }

    while (withResolvedUrls.length < 3) {
      withResolvedUrls.push(withResolvedUrls[0] ?? { url: null, alt: `${payload.hall.name} photo` });
    }

    return withResolvedUrls.slice(0, 3);
  }, [payload.hall.coverPhotoUrl, payload.hall.name, payload.photos]);

  function toggleSection(section: SectionId) {
    setOpenSections((current) => {
      if (current.includes(section)) {
        return current.filter((item) => item !== section);
      }

      return [...current, section];
    });
  }

  function renderPhotoCard(index: number, className: string) {
    const photo = galleryPhotos[index];
    if (!photo || !photo.url) {
      return (
        <div
          className={cn(
            "flex items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 text-sm text-zinc-500",
            className,
          )}
        >
          No photo
        </div>
      );
    }

    return (
      <div className={cn("overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100", className)}>
        <img src={photo.url} alt={photo.alt} className="h-full w-full object-cover" />
      </div>
    );
  }

  function renderSectionHeader(section: SectionId, title: string) {
    const isOpen = openSections.includes(section);
    const panelId = sectionIdForPanel(section);
    return (
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-4 text-left"
        onClick={() => toggleSection(section)}
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <span className="text-base font-semibold text-zinc-900">{title}</span>
        <ChevronDown
          className={cn("h-4 w-4 text-zinc-600 transition-transform duration-200", isOpen && "rotate-180")}
        />
      </button>
    );
  }

  async function handleCheckAvailability() {
    const errors: AvailabilityFieldErrors = {};
    const parsedGuestCount = Number.parseInt(guestCount, 10);

    if (!eventDate) {
      errors.eventDate = "Event date is required.";
    }

    if (!startTime) {
      errors.startTime = "Start time is required.";
    }

    if (!guestCount || Number.isNaN(parsedGuestCount) || parsedGuestCount <= 0) {
      errors.guestCount = "Guest count is required.";
    } else if (parsedGuestCount > payload.hall.maxCapacity) {
      errors.guestCount = `Guest count exceeds hall capacity (${payload.hall.maxCapacity}).`;
    }

    setFieldErrors(errors);
    setAvailabilityError(null);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsCheckingAvailability(true);
    try {
      const response = await fetch(
        `/api/halls/${payload.hall.id}/availability?eventDate=${encodeURIComponent(eventDate)}`,
        {
          method: "GET",
        },
      );

      const data = (await response.json().catch(() => null)) as
        | {
            available?: boolean;
            reason?: string;
            error?: string;
          }
        | null;

      if (response.status === 401) {
        setAvailabilityError(null);
        openLogin("Please sign in to check availability.");
        return;
      }

      if (!response.ok) {
        setAvailabilityError(data?.error ?? "Unable to check availability right now.");
        return;
      }

      if (!data?.available) {
        setAvailabilityError(data?.reason ?? "This hall is not available for the selected date.");
        return;
      }

      const params = new URLSearchParams({
        eventDate,
        startTime,
        guestCount: String(parsedGuestCount),
        endTime: "23:59",
      });

      router.push(`/halls/${payload.hall.slug}/booking-request?${params.toString()}`);
    } catch {
      setAvailabilityError("Unable to check availability right now.");
    } finally {
      setIsCheckingAvailability(false);
    }
  }

  return (
    <section className="min-h-screen bg-zinc-100 text-zinc-900">
      <header className="sticky top-0 z-30">
        <SiteHeader className="rounded-none border-x-0 border-t-0 shadow-none" />
      </header>

      <main className="mx-auto w-full max-w-360 p-4 pb-10 sm:p-6">
        <nav className="mb-3 text-xs font-medium text-zinc-500">
          <Link href="/halls" className="hover:text-zinc-700">
            Halls
          </Link>
          <span className="mx-2">/</span>
          <span className="text-zinc-800">{payload.hall.name}</span>
        </nav>

        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">{payload.hall.name}</h1>
          <p className="text-sm text-zinc-600">
            Capacity {payload.hall.maxCapacity} pax - From {formatPriceMyr(payload.hall.basePriceMyr)}/day
          </p>
          <p className="text-sm text-zinc-500">{locationLabel}</p>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
          {renderPhotoCard(0, "h-74 md:h-88")}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {renderPhotoCard(1, "h-35 md:h-42")}
            {renderPhotoCard(2, "h-35 md:h-42")}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px] xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-3">
            <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
              {renderSectionHeader("highlights", "Highlights")}
              {openSections.includes("highlights") ? (
                <div id={sectionIdForPanel("highlights")} className="border-t border-zinc-200 p-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                      <p className="text-xl font-semibold text-zinc-900">Up to {payload.hall.maxCapacity} pax</p>
                      <p className="mt-1 text-xs font-medium text-zinc-500">Maximum capacity</p>
                    </div>
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                      <p className="text-xl font-semibold text-zinc-900">
                        From {formatPriceMyr(payload.hall.basePriceMyr)}/day
                      </p>
                      <p className="mt-1 text-xs font-medium text-zinc-500">Starting price</p>
                    </div>
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                      <p className="text-xl font-semibold text-zinc-900">{payload.hall.city}</p>
                      <p className="mt-1 text-xs font-medium text-zinc-500">City</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </section>

            <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
              {renderSectionHeader("about", "About this hall")}
              {openSections.includes("about") ? (
                <div id={sectionIdForPanel("about")} className="border-t border-zinc-200 p-4">
                  <p className="text-sm leading-7 text-zinc-700">
                    {payload.hall.description?.trim() || fallbackDescription}
                  </p>
                </div>
              ) : null}
            </section>

            <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
              {renderSectionHeader("amenities", "Amenities")}
              {openSections.includes("amenities") ? (
                <div id={sectionIdForPanel("amenities")} className="border-t border-zinc-200 p-4">
                  {payload.amenities.length > 0 ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {payload.amenities.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-800"
                        >
                          {item.label}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-600">No amenities listed yet for this hall.</p>
                  )}
                </div>
              ) : null}
            </section>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xl font-semibold text-zinc-900">{hallPriceLabel}</p>
                <span className="rounded-full border border-zinc-200 px-2 py-1 text-[11px] font-medium text-zinc-600">
                  Instant check
                </span>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <label className="space-y-1">
                    <span className="block text-xs font-medium text-zinc-600">Event date</span>
                    <Popover open={isDatePickerOpen} onOpenChange={setDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "h-10 w-full justify-start border text-xs font-normal text-zinc-700 hover:bg-zinc-50",
                            fieldErrors.eventDate ? "border-rose-300 bg-rose-50" : "border-zinc-200 bg-white",
                          )}
                        >
                          <CalendarDays className="mr-2 h-3.5 w-3.5 text-zinc-500" />
                          {formatDateLabel(eventDate)}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={parseIsoDate(eventDate)}
                          disabled={{ before: new Date() }}
                          onSelect={(date) => {
                            if (!date) {
                              return;
                            }

                            setEventDate(formatIsoDate(date));
                            setDatePickerOpen(false);
                            if (fieldErrors.eventDate) {
                              setFieldErrors((current) => ({ ...current, eventDate: undefined }));
                            }
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    {fieldErrors.eventDate ? (
                      <p className="text-[11px] text-rose-700">{fieldErrors.eventDate}</p>
                    ) : null}
                  </label>
                  <label className="space-y-1">
                    <span className="block text-xs font-medium text-zinc-600">Start time</span>
                    <Popover open={isTimePickerOpen} onOpenChange={setTimePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "h-10 w-full justify-start border text-xs font-normal text-zinc-700 hover:bg-zinc-50",
                            fieldErrors.startTime ? "border-rose-300 bg-rose-50" : "border-zinc-200 bg-white",
                          )}
                        >
                          <Clock3 className="mr-2 h-3.5 w-3.5 text-zinc-500" />
                          {formatTimeLabel(startTime)}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-1" align="start">
                        <div className="max-h-56 overflow-auto">
                          {timeOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              className={cn(
                                "flex h-8 w-full items-center rounded-md px-2 text-left text-xs text-zinc-700 hover:bg-zinc-100",
                                startTime === option.value && "bg-zinc-100 text-zinc-900",
                              )}
                              onClick={() => {
                                setStartTime(option.value);
                                setTimePickerOpen(false);
                                if (fieldErrors.startTime) {
                                  setFieldErrors((current) => ({ ...current, startTime: undefined }));
                                }
                              }}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                    {fieldErrors.startTime ? (
                      <p className="text-[11px] text-rose-700">{fieldErrors.startTime}</p>
                    ) : null}
                  </label>
                </div>
                <label className="space-y-1">
                  <span className="block text-xs font-medium text-zinc-600">Guests</span>
                  <input
                    type="number"
                    min={1}
                    max={payload.hall.maxCapacity}
                    inputMode="numeric"
                    value={guestCount}
                    onChange={(event) => {
                      setGuestCount(event.target.value);
                      if (fieldErrors.guestCount) {
                        setFieldErrors((current) => ({ ...current, guestCount: undefined }));
                      }
                    }}
                    placeholder={`Up to ${payload.hall.maxCapacity}`}
                    className={cn(
                      "h-10 w-full rounded-md border px-3 text-xs text-zinc-700 outline-none focus:border-zinc-500",
                      fieldErrors.guestCount ? "border-rose-300 bg-rose-50" : "border-zinc-200",
                    )}
                  />
                  {fieldErrors.guestCount ? (
                    <p className="text-[11px] text-rose-700">{fieldErrors.guestCount}</p>
                  ) : null}
                </label>
              </div>

              <div className="mt-3 grid gap-2">
                <button
                  type="button"
                  disabled={isCheckingAvailability}
                  className="h-10 rounded-md bg-zinc-900 text-sm font-medium text-zinc-50 hover:bg-zinc-800 disabled:opacity-60"
                  onClick={() => {
                    void handleCheckAvailability();
                  }}
                >
                  {isCheckingAvailability ? "Checking..." : "Check availability"}
                </button>
              </div>

              {availabilityError ? (
                <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900">
                  {availabilityError}
                </div>
              ) : null}

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between text-zinc-600">
                  <span>Hall rental</span>
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
                If your date is available, you will continue to the booking request form.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </section>
  );
}

