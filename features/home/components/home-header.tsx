"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Browse Halls", href: "/halls" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Log In", href: "#log-in" },
];

export function HomeHeader() {
  return (
    <header className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white/95 px-4 py-3 shadow-[0_8px_20px_rgba(0,0,0,0.10)] backdrop-blur-sm sm:px-6">
      <p className="text-sm font-semibold tracking-[0.04em] text-zinc-900 sm:text-3xl sm:tracking-normal">
        OVERHALL
      </p>

      <nav className="flex items-center gap-1 sm:gap-2">
        {navItems.map((item) => (
          <Button
            key={item.label}
            variant="ghost"
            asChild
            className="h-8 rounded-md px-2 text-[10px] font-medium text-zinc-900 hover:bg-zinc-100 hover:text-zinc-900 sm:h-9 sm:px-4 sm:text-sm"
          >
            <Link href={item.href}>{item.label}</Link>
          </Button>
        ))}
        <Button
          asChild
          className="h-8 rounded-full bg-zinc-900 px-3 text-[10px] text-zinc-50 shadow-[0_1px_2px_rgba(0,0,0,0.25)] hover:bg-zinc-800 sm:h-10 sm:px-5 sm:text-sm"
        >
          <Link href="#search">Get Started</Link>
        </Button>
      </nav>
    </header>
  );
}
