"use client";

import { HomeHeader } from "@/features/home/components/home-header";
import { HomeSearchBar } from "@/features/home/components/home-search-bar";

const HERO_IMAGE_URL =
  "https://images.unsplash.com/photo-1765568408601-481b13b02e71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDM0ODN8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NzYyNDQwNDZ8&ixlib=rb-4.1.0&q=80&w=1920";

export function HomeArchitectureCard() {
  return (
    <section className="relative isolate min-h-svh overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url("${HERO_IMAGE_URL}")` }}
      />
      <div className="absolute inset-0 bg-black/10" />

      <div className="relative mx-auto flex min-h-svh w-full max-w-420 flex-col px-4 pb-10 pt-6 sm:px-8 lg:px-12">
        <HomeHeader />

        <div className="flex flex-1 items-start justify-center pt-20 sm:pt-24 lg:pt-52">
          <HomeSearchBar />
        </div>
      </div>
    </section>
  );
}
