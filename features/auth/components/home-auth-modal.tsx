"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

type AuthMode = "login" | "register";

const AUTH_VISUAL_IMAGES = [
  "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1478145046317-39f10e56b5e9?auto=format&fit=crop&w=1600&q=80",
];

type HomeAuthModalProps = {
  open: boolean;
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onClose: () => void;
  onAuthSuccess?: () => void;
  bannerMessage?: string | null;
};

export function HomeAuthModal({
  open,
  mode,
  onModeChange,
  onClose,
  onAuthSuccess,
  bannerMessage,
}: HomeAuthModalProps) {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [visualImageUrl] = useState(
    () => AUTH_VISUAL_IMAGES[Math.floor(Math.random() * AUTH_VISUAL_IMAGES.length)],
  );

  const title = useMemo(
    () => (mode === "login" ? "Sign in to Overhall" : "Join Overhall"),
    [mode],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await authClient.signIn.email({
        email: email.trim(),
        password,
      });

      if (result.error) {
        setErrorMessage(result.error.message ?? "Unable to sign in. Please try again.");
        return;
      }

      toast.success("Signed in successfully.");
      onAuthSuccess?.();
      onClose();
      router.refresh();
    } catch {
      setErrorMessage("Unable to sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRegisterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const safeFirstName = firstName.trim();
    const safeLastName = lastName.trim();
    const fullName = `${safeFirstName} ${safeLastName}`.trim();

    if (!safeFirstName || !safeLastName) {
      setErrorMessage("First and last name are required.");
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await authClient.signUp.email({
        email: email.trim(),
        password,
        name: fullName,
      });

      if (result.error) {
        setErrorMessage(result.error.message ?? "Unable to create your account.");
        return;
      }

      await fetch("/api/profile/bootstrap", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          firstName: safeFirstName,
          lastName: safeLastName,
        }),
      }).catch(() => null);

      onAuthSuccess?.();
      onClose();
      router.refresh();
    } catch {
      setErrorMessage("Unable to create your account.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 py-6">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div
          className="relative hidden overflow-hidden bg-zinc-950 p-6 text-white md:flex md:flex-col md:justify-between"
          style={{
            backgroundImage: `url("${visualImageUrl}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-black/45" />
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="Overhall"
              width={320}
              height={120}
              className="h-auto w-44 opacity-95 drop-shadow-[0_8px_18px_rgba(0,0,0,0.45)]"
              priority
            />
          </div>
          <div>
            <p className="relative text-sm font-medium text-zinc-200">
              {mode === "login" ? "Welcome back" : "Create account"}
            </p>
            <h2 className="relative mt-2 text-3xl font-bold tracking-tight text-white">
              {mode === "login" ? "Sign in to keep booking faster" : "Start booking smarter"}
            </h2>
          </div>
          <p className="relative text-sm text-zinc-200">
            Curated halls, clear pricing, and fast booking workflows.
          </p>
        </div>

        <div className="relative p-6 sm:p-10">
          <button
            type="button"
            className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100"
            onClick={onClose}
            aria-label="Close auth modal"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="space-y-1 pr-8">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Overhall
            </p>
            <h3 className="text-3xl font-bold tracking-tight text-zinc-900">{title}</h3>
            <p className="text-sm text-zinc-600">
              {mode === "login"
                ? "Use your email and password to continue."
                : "Fill in your details to create an account."}
            </p>
          </div>

          {bannerMessage ? (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {bannerMessage}
            </div>
          ) : null}

          {errorMessage ? (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
              {errorMessage}
            </div>
          ) : null}

          {mode === "login" ? (
            <form className="mt-6 space-y-4" onSubmit={handleLoginSubmit}>
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-zinc-600">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  placeholder="you@company.com"
                  className="h-11 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-500"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-semibold text-zinc-600">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  placeholder="Enter password"
                  className="h-11 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-500"
                />
              </label>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 w-full rounded-md bg-zinc-900 text-zinc-50 hover:bg-zinc-800"
              >
                {isSubmitting ? "Signing in..." : "Continue with Email"}
              </Button>

              <Button
                type="button"
                disabled
                variant="outline"
                className="h-11 w-full rounded-md border-zinc-300 bg-white text-zinc-500"
              >
                Continue with Google (coming soon)
              </Button>
            </form>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={handleRegisterSubmit}>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-zinc-600">First Name</span>
                  <input
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    required
                    placeholder="Aina"
                    className="h-11 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-500"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-zinc-600">Last Name</span>
                  <input
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    required
                    placeholder="Rahman"
                    className="h-11 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-500"
                  />
                </label>
              </div>

              <label className="block space-y-1">
                <span className="text-xs font-semibold text-zinc-600">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  placeholder="aina@brand.com"
                  className="h-11 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-500"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-semibold text-zinc-600">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={8}
                  placeholder="Create password"
                  className="h-11 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-500"
                />
              </label>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 w-full rounded-md bg-zinc-900 text-zinc-50 hover:bg-zinc-800"
              >
                {isSubmitting ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          )}

          <div className="mt-5 flex items-center justify-center gap-2 text-sm text-zinc-600">
            <span>
              {mode === "login" ? "Don't have an account?" : "Already have an account?"}
            </span>
            <button
              type="button"
              className="font-semibold text-zinc-900 underline-offset-4 hover:underline"
              onClick={() => {
                setErrorMessage(null);
                onModeChange(mode === "login" ? "register" : "login");
              }}
            >
              {mode === "login" ? "Register" : "Log in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
