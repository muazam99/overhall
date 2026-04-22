"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { HomeAuthModal } from "@/features/auth/components/home-auth-modal";
import { authClient } from "@/lib/auth-client";

type AuthPromptMode = "login" | "register";

type AuthPromptContextValue = {
  openLogin: (message?: string) => void;
  openRegister: (message?: string) => void;
  closePrompt: () => void;
};

const AuthPromptContext = createContext<AuthPromptContextValue | null>(null);

type AuthPromptProviderProps = {
  children: React.ReactNode;
};

export function AuthPromptProvider({ children }: AuthPromptProviderProps) {
  const { data: session } = authClient.useSession();
  const [isOpen, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthPromptMode>("login");
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  const contextValue = useMemo<AuthPromptContextValue>(
    () => ({
      openLogin: (message?: string) => {
        setMode("login");
        setBannerMessage(message ?? null);
        setOpen(true);
      },
      openRegister: (message?: string) => {
        setMode("register");
        setBannerMessage(message ?? null);
        setOpen(true);
      },
      closePrompt: () => {
        setOpen(false);
      },
    }),
    [],
  );

  return (
    <AuthPromptContext.Provider value={contextValue}>
      {children}
      <HomeAuthModal
        open={isOpen && !session?.user?.id}
        mode={mode}
        onModeChange={setMode}
        onClose={() => setOpen(false)}
        bannerMessage={bannerMessage}
        onAuthSuccess={() => setBannerMessage(null)}
      />
    </AuthPromptContext.Provider>
  );
}

export function useAuthPrompt() {
  const context = useContext(AuthPromptContext);
  if (!context) {
    throw new Error("useAuthPrompt must be used within AuthPromptProvider.");
  }

  return context;
}

export function useOptionalAuthPrompt() {
  return useContext(AuthPromptContext);
}
