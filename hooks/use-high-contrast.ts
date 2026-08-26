"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/stores/use-theme-store";

export function useHighContrast() {
  const { highContrast, toggleHighContrast, fontSize, setFontSize } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;
    if (highContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }

    root.classList.remove("text-size-normal", "text-size-large", "text-size-xl");
    root.classList.add(`text-size-${fontSize}`);
  }, [highContrast, fontSize]);

  return { highContrast, toggleHighContrast, fontSize, setFontSize };
}
