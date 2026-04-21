import { createStore } from "zustand/vanilla";

export type HomeUiState = {
  activity: string;
  location: string;
  whenDate: string;
};

export type HomeUiActions = {
  setActivity: (value: string) => void;
  setLocation: (value: string) => void;
  setWhenDate: (value: string) => void;
};

export type HomeUiStore = HomeUiState & HomeUiActions;

export const defaultHomeUiState: HomeUiState = {
  activity: "",
  location: "",
  whenDate: "",
};

export function createHomeUiStore(initState: HomeUiState = defaultHomeUiState) {
  return createStore<HomeUiStore>()((set) => ({
    ...initState,
    setActivity: (value) => set(() => ({ activity: value })),
    setLocation: (value) => set(() => ({ location: value })),
    setWhenDate: (value) => set(() => ({ whenDate: value })),
  }));
}
