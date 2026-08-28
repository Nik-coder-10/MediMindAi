"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/stores/use-theme-store";

export function useHighContrast() {
  const { contrastMode, setContrastMode, cycleContrastMode, fontSize, setFontSize } = useThemeStore();

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;

    root.classList.remove("high-contrast", "low-contrast");

    if (contrastMode === "high") {
      root.classList.add("high-contrast");
    } else if (contrastMode === "low") {
      root.classList.add("low-contrast");
    }

    root.classList.remove("text-size-normal", "text-size-large", "text-size-xl");
    root.classList.add(`text-size-${fontSize}`);
  }, [contrastMode, fontSize]);

  return { contrastMode, setContrastMode, cycleContrastMode, fontSize, setFontSize };
}

