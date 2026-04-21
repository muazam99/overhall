"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { HomeUiStoreProvider } from "@/features/home/store/home-ui-store-provider";
import { getQueryClient } from "@/lib/query/query-client";

type AppProvidersProps = {
  children: React.ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <HomeUiStoreProvider>
        {children}
        <Toaster position="bottom-right" />
      </HomeUiStoreProvider>
    </QueryClientProvider>
  );
}
