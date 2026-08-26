import { create } from "zustand";

interface ThemeState {
  highContrast: boolean;
  fontSize: "normal" | "large" | "x-large";
  toggleHighContrast: () => void;
  setFontSize: (size: "normal" | "large" | "x-large") => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  highContrast: false,
  fontSize: "normal",
  toggleHighContrast: () => set((state) => ({ highContrast: !state.highContrast })),
  setFontSize: (fontSize) => set({ fontSize }),
}));
