"use client";

import { createContext, useContext, useState } from "react";
import { type StoreApi, useStore } from "zustand";
import {
  createHomeUiStore,
  type HomeUiState,
  type HomeUiStore,
  defaultHomeUiState,
} from "@/features/home/store/home-ui-store";

type HomeUiStoreApi = StoreApi<HomeUiStore>;

const HomeUiStoreContext = createContext<HomeUiStoreApi | null>(null);

type HomeUiStoreProviderProps = {
  children: React.ReactNode;
  initialState?: HomeUiState;
};

export function HomeUiStoreProvider({
  children,
  initialState = defaultHomeUiState,
}: HomeUiStoreProviderProps) {
  const [store] = useState(() => createHomeUiStore(initialState));

  return (
    <HomeUiStoreContext.Provider value={store}>{children}</HomeUiStoreContext.Provider>
  );
}

export function useHomeUiStore<T>(selector: (state: HomeUiStore) => T) {
  const store = useContext(HomeUiStoreContext);
  if (!store) {
    throw new Error("useHomeUiStore must be used within HomeUiStoreProvider.");
  }

  return useStore(store, selector);
}
