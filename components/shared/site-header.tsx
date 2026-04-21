"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Browse Halls", href: "/halls" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Log In", href: "/#log-in" },
];

type SiteHeaderProps = {
  className?: string;
};

export function SiteHeader({ className }: SiteHeaderProps) {
  return (
    <header
      className={cn(
        "w-full flex items-center justify-between rounded-2xl border border-zinc-200 bg-white/95 px-4 py-3 shadow-[0_8px_20px_rgba(0,0,0,0.10)] backdrop-blur-sm sm:px-6",
        className,
      )}
    >
      <Link href="/" aria-label="Go to home">
        <Image src="/logo.png" alt="Overhall" width={220} height={52} className="h-8 w-auto sm:h-9" priority />
      </Link>

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
          <Link href="/#search">Get Started</Link>
        </Button>
      </nav>
    </header>
  );
}
