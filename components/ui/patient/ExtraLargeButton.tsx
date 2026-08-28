"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

const extraLargeButtonVariants = cva(
  "inline-flex items-center justify-center gap-3 whitespace-nowrap font-bold tracking-tight transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 select-none relative overflow-hidden",
  {
    variants: {
      variant: {
        // Deep indigo primary — authority action
        primary:
          "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white hover:from-indigo-500 hover:to-indigo-600 shadow-md hover:shadow-indigo-glow border border-indigo-500/30 rounded-2xl",
        // Teal success — Ayush identity
        success:
          "bg-gradient-to-br from-teal-600 to-teal-700 text-white hover:from-teal-500 hover:to-teal-600 shadow-md hover:shadow-teal-glow border border-teal-500/30 rounded-2xl",
        // Clay white secondary
        secondary:
          "clay-white text-foreground hover:shadow-premium rounded-2xl",
        // Danger
        danger:
          "bg-gradient-to-br from-red-600 to-red-700 text-white hover:from-red-500 hover:to-red-600 shadow-md border border-red-500/30 rounded-2xl",
        // Calm sky
        calmSky:
          "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 rounded-2xl",
      },
      size: {
        default: "min-h-[56px] min-w-[56px] px-6 py-3.5 text-[17px]",
        large: "min-h-[64px] min-w-[64px] px-8 py-4 text-[18px]",
        giant: "min-h-[72px] min-w-[72px] px-10 py-5 text-[20px] font-extrabold",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ExtraLargeButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof extraLargeButtonVariants> {
  icon?: React.ReactNode;
}

export const ExtraLargeButton = React.forwardRef<
  HTMLButtonElement,
  ExtraLargeButtonProps
>(({ className, variant, size, children, icon, ...props }, ref) => {
  return (
    <motion.button
      ref={ref as any}
      whileHover={{ scale: 1.015, y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className={cn(extraLargeButtonVariants({ variant, size, className }))}
      {...(props as any)}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </motion.button>
  );
});

ExtraLargeButton.displayName = "ExtraLargeButton";
