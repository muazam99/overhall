"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { HomeUiStoreProvider } from "@/features/home/store/home-ui-store-provider";
import { getQueryClient } from "@/lib/query/query-client";

type AppProvidersProps = {
  children: React.ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <HomeUiStoreProvider>{children}</HomeUiStoreProvider>
    </QueryClientProvider>
  );
}
