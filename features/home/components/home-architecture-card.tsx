"use client";

import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/shared/site-header";
import { HomeAuthModal } from "@/features/auth/components/home-auth-modal";
import { HomeSearchBar } from "@/features/home/components/home-search-bar";
import { authClient } from "@/lib/auth-client";
import { AUTH_MESSAGE_COOKIE, AUTH_PROMPT_COOKIE, AUTH_PROMPT_LOGIN } from "@/lib/auth-ui";

const HERO_IMAGE_URL =
  "https://images.unsplash.com/photo-1765568408601-481b13b02e71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDM0ODN8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NzYyNDQwNDZ8&ixlib=rb-4.1.0&q=80&w=1920";

type HomeArchitectureCardProps = {
  initialAuthPrompt: string | null;
  initialAuthMessage: string | null;
};

type AuthMode = "login" | "register";

export function HomeArchitectureCard({
  initialAuthPrompt,
  initialAuthMessage,
}: HomeArchitectureCardProps) {
  const { data: session } = authClient.useSession();
  const [isAuthOpen, setAuthOpen] = useState(initialAuthPrompt === AUTH_PROMPT_LOGIN);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [bannerMessage, setBannerMessage] = useState<string | null>(initialAuthMessage);

  useEffect(() => {
    document.cookie = `${AUTH_PROMPT_COOKIE}=; Max-Age=0; path=/`;
    document.cookie = `${AUTH_MESSAGE_COOKIE}=; Max-Age=0; path=/`;
  }, []);

  useEffect(() => {
    if (!bannerMessage) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setBannerMessage(null);
    }, 6000);

    return () => window.clearTimeout(timeout);
  }, [bannerMessage]);

  function openLoginModal() {
    setAuthMode("login");
    setAuthOpen(true);
  }

  function openRegisterModal() {
    setAuthMode("register");
    setAuthOpen(true);
  }

  return (
    <section className="relative isolate min-h-svh overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url("${HERO_IMAGE_URL}")` }}
      />
      <div className="absolute inset-0 bg-black/10" />

      <div className="relative mx-auto flex min-h-svh w-full max-w-420 flex-col px-4 pb-10 pt-6 sm:px-8 lg:px-12">
        <SiteHeader onLoginClick={openLoginModal} onRegisterClick={openRegisterModal} />

        {bannerMessage ? (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
            {bannerMessage}
          </div>
        ) : null}

        <div className="flex flex-1 items-start justify-center pt-20 sm:pt-24 lg:pt-52">
          <HomeSearchBar />
        </div>
      </div>

      <HomeAuthModal
        open={isAuthOpen && !session?.user?.id}
        mode={authMode}
        onClose={() => setAuthOpen(false)}
        onModeChange={setAuthMode}
        bannerMessage={bannerMessage}
        onAuthSuccess={() => setBannerMessage(null)}
      />
    </section>
  );
}
