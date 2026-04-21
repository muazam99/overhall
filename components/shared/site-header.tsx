"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Browse Halls", href: "/halls" },
  { label: "How It Works", href: "/#how-it-works" },
];

type SiteHeaderProps = {
  className?: string;
  onLoginClick?: () => void;
  onRegisterClick?: () => void;
};

function resolveRole(role: string | null | undefined) {
  return role === "admin" ? "admin" : "user";
}

export function SiteHeader({ className, onLoginClick, onRegisterClick }: SiteHeaderProps) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const user = session?.user;
  const role = resolveRole((user as { role?: string | null } | null)?.role);
  const isAuthed = Boolean(user?.id);

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header
      className={cn(
        "w-full flex items-center justify-between rounded-2xl border border-zinc-200 bg-white/95 px-4 py-3 shadow-[0_8px_20px_rgba(0,0,0,0.10)] backdrop-blur-sm sm:px-6",
        className,
      )}
    >
      <Link href="/" aria-label="Go to home">
        <Image
          src="/logo.png"
          alt="Overhall"
          width={320}
          height={120}
          className="h-auto w-35 sm:w-50"
          priority
        />
      </Link>

      <nav className="flex items-center gap-1 sm:gap-2">
        {!isPending &&
          navItems.map((item) => (
            <Button
              key={item.label}
              variant="ghost"
              asChild
              className="h-8 rounded-md px-2 text-[10px] font-medium text-zinc-900 hover:bg-zinc-100 hover:text-zinc-900 sm:h-9 sm:px-4 sm:text-sm"
            >
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}

        {isAuthed ? (
          <>
            <Button
              variant="ghost"
              asChild
              className="h-8 rounded-md px-2 text-[10px] font-medium text-zinc-900 hover:bg-zinc-100 hover:text-zinc-900 sm:h-9 sm:px-4 sm:text-sm"
            >
              <Link href="/my-bookings">My Bookings</Link>
            </Button>
            {role === "admin" ? (
              <Button
                variant="ghost"
                asChild
                className="h-8 rounded-md px-2 text-[10px] font-medium text-zinc-900 hover:bg-zinc-100 hover:text-zinc-900 sm:h-9 sm:px-4 sm:text-sm"
              >
                <Link href="/admin">Admin</Link>
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              className="h-8 rounded-md border-zinc-300 px-3 text-[10px] sm:h-9 sm:px-4 sm:text-sm"
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="ghost"
              className="h-8 rounded-md px-2 text-[10px] font-medium text-zinc-900 hover:bg-zinc-100 hover:text-zinc-900 sm:h-9 sm:px-4 sm:text-sm"
              onClick={() => {
                if (onLoginClick) {
                  onLoginClick();
                  return;
                }

                router.push("/");
              }}
            >
              Log In
            </Button>

            <Button
              type="button"
              className="h-8 rounded-full bg-zinc-900 px-3 text-[10px] text-zinc-50 shadow-[0_1px_2px_rgba(0,0,0,0.25)] hover:bg-zinc-800 sm:h-10 sm:px-5 sm:text-sm"
              onClick={() => {
                if (onRegisterClick) {
                  onRegisterClick();
                  return;
                }

                router.push("/");
              }}
            >
              Get Started
            </Button>
          </>
        )}
      </nav>
    </header>
  );
}
