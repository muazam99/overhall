import { createStore } from "zustand/vanilla";

export type HomeUiState = {
  detailsVisible: boolean;
};

export type HomeUiActions = {
  toggleDetails: () => void;
};

export type HomeUiStore = HomeUiState & HomeUiActions;

export const defaultHomeUiState: HomeUiState = {
  detailsVisible: true,
};

export function createHomeUiStore(initState: HomeUiState = defaultHomeUiState) {
  return createStore<HomeUiStore>()((set) => ({
    ...initState,
    toggleDetails: () => set((state) => ({ detailsVisible: !state.detailsVisible })),
  }));
}
