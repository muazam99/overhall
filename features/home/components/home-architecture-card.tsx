"use client";

import { useQuery } from "@tanstack/react-query";
import { Boxes, Database, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { homeQueryOptions } from "@/features/home/queries/home.queries";
import { useHomeUiStore } from "@/features/home/store/home-ui-store-provider";

const architectureItems = [
  {
    title: "UI Foundation",
    description: "shadcn/ui + Tailwind configured with shared UI components and utility helpers.",
    icon: Boxes,
  },
  {
    title: "Data + Auth",
    description: "Drizzle/PostgreSQL and Better Auth scaffolded with validated environment boundaries.",
    icon: Database,
  },
  {
    title: "State + Validation",
    description: "TanStack Query handles server state while Zustand and Zod cover client state + contracts.",
    icon: ShieldCheck,
  },
];

export function HomeArchitectureCard() {
  const { data } = useQuery(homeQueryOptions);
  const detailsVisible = useHomeUiStore((state) => state.detailsVisible);
  const toggleDetails = useHomeUiStore((state) => state.toggleDetails);

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{data?.title ?? "Loading..."}</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {data?.description ?? "Loading architecture summary..."}
          </p>
        </div>
        <Button variant="outline" onClick={toggleDetails}>
          {detailsVisible ? "Hide details" : "Show details"}
        </Button>
      </div>

      {detailsVisible ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {architectureItems.map(({ icon: Icon, title, description }) => (
            <article key={title} className="rounded-lg border bg-background p-4">
              <Icon className="mb-2 h-5 w-5 text-primary" />
              <h2 className="text-sm font-medium">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
