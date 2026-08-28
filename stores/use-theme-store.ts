import { create } from "zustand";

export type ContrastMode = "normal" | "high" | "low";

interface ThemeState {
  contrastMode: ContrastMode;
  fontSize: "normal" | "large" | "x-large";
  setContrastMode: (mode: ContrastMode) => void;
  cycleContrastMode: () => void;
  setFontSize: (size: "normal" | "large" | "x-large") => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  contrastMode: "normal",
  fontSize: "normal",
  setContrastMode: (mode) => set({ contrastMode: mode }),
  cycleContrastMode: () => {
    const current = get().contrastMode;
    const next: ContrastMode =
      current === "normal" ? "high" : current === "high" ? "low" : "normal";
    set({ contrastMode: next });
  },
  setFontSize: (fontSize) => set({ fontSize }),
}));

