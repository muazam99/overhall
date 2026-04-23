"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useOptionalAuthPrompt } from "@/features/auth/components/auth-prompt-provider";
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
  mode?: "default" | "admin";
};

function resolveRole(role: string | null | undefined) {
  return role === "admin" ? "admin" : "user";
}

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader({
  className,
  onLoginClick,
  onRegisterClick,
  mode = "default",
}: SiteHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const authPrompt = useOptionalAuthPrompt();
  const { data: session, isPending } = authClient.useSession();

  const user = session?.user;
  const role = resolveRole((user as { role?: string | null } | null)?.role);
  const isAuthed = Boolean(user?.id);

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  if (mode === "admin") {
    const bookingsActive = isActivePath(pathname, "/admin/bookings");
    const hallsActive = isActivePath(pathname, "/admin/halls");

    return (
      <header
        className={cn(
          "w-full flex items-center justify-between rounded-2xl border border-zinc-200 bg-white/95 px-4 py-3 shadow-[0_8px_20px_rgba(0,0,0,0.10)] backdrop-blur-sm sm:px-6",
          className,
        )}
      >
        <Link
          href="/admin"
          className="text-sm font-semibold tracking-[0.06em] text-zinc-900 sm:text-lg"
          aria-label="Go to admin dashboard"
        >
          OVERHALL ADMIN
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Button
            variant={bookingsActive ? "secondary" : "ghost"}
            asChild
            className={cn(
              "h-8 rounded-md px-2 text-[10px] font-medium sm:h-9 sm:px-4 sm:text-sm",
              bookingsActive
                ? "bg-zinc-100 text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
            )}
          >
            <Link href="/admin/bookings">Manage Bookings</Link>
          </Button>
          <Button
            variant={hallsActive ? "secondary" : "ghost"}
            asChild
            className={cn(
              "h-8 rounded-md px-2 text-[10px] font-medium sm:h-9 sm:px-4 sm:text-sm",
              hallsActive
                ? "bg-zinc-100 text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
            )}
          >
            <Link href="/admin/halls">Manage Halls</Link>
          </Button>
          <Button
            variant="outline"
            asChild
            className="h-8 rounded-md border-zinc-300 px-3 text-[10px] text-zinc-900 sm:h-9 sm:px-4 sm:text-sm"
          >
            <Link href="/admin">Admin</Link>
          </Button>
        </nav>
      </header>
    );
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
              variant={isActivePath(pathname, item.href) ? "secondary" : "ghost"}
              asChild
              className={cn(
                "h-8 rounded-md px-2 text-[10px] font-medium sm:h-9 sm:px-4 sm:text-sm",
                isActivePath(pathname, item.href)
                  ? "bg-zinc-100 text-zinc-900"
                  : "text-zinc-900 hover:bg-zinc-100 hover:text-zinc-900",
              )}
            >
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}

        {isAuthed ? (
          <>
            <Button
              variant={isActivePath(pathname, "/my-bookings") ? "secondary" : "ghost"}
              asChild
              className={cn(
                "h-8 rounded-md px-2 text-[10px] font-medium sm:h-9 sm:px-4 sm:text-sm",
                isActivePath(pathname, "/my-bookings")
                  ? "bg-zinc-100 text-zinc-900"
                  : "text-zinc-900 hover:bg-zinc-100 hover:text-zinc-900",
              )}
            >
              <Link href="/my-bookings">My Bookings</Link>
            </Button>
            {role === "admin" ? (
              <Button
                variant={isActivePath(pathname, "/admin") ? "secondary" : "ghost"}
                asChild
                className={cn(
                  "h-8 rounded-md px-2 text-[10px] font-medium sm:h-9 sm:px-4 sm:text-sm",
                  isActivePath(pathname, "/admin")
                    ? "bg-zinc-100 text-zinc-900"
                    : "text-zinc-900 hover:bg-zinc-100 hover:text-zinc-900",
                )}
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

                if (authPrompt) {
                  authPrompt.openLogin();
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

                if (authPrompt) {
                  authPrompt.openRegister();
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
