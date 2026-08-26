"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

const extraLargeButtonVariants = cva(
  "inline-flex items-center justify-center gap-3 whitespace-nowrap rounded-2xl font-bold tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none shadow-md",
  {
    variants: {
      variant: {
        primary:
          "bg-ayush-green text-white hover:bg-ayush-emerald active:bg-green-900 border-2 border-emerald-700",
        secondary:
          "bg-white dark:bg-card text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 border-2 border-border shadow-sm",
        success:
          "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 border-2 border-emerald-500",
        danger:
          "bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 border-2 border-rose-500",
        calmSky:
          "bg-sky-100 dark:bg-sky-950/60 text-sky-900 dark:text-sky-100 hover:bg-sky-200 border-2 border-sky-300",
      },
      size: {
        default: "min-h-[56px] min-w-[56px] px-6 py-4 text-lg",
        large: "min-h-[64px] min-w-[64px] px-8 py-5 text-xl",
        giant: "min-h-[72px] min-w-[72px] px-10 py-6 text-2xl font-extrabold",
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
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className={cn(extraLargeButtonVariants({ variant, size, className }))}
      {...(props as any)}
    >
      {icon && <span className="text-2xl">{icon}</span>}
      <span>{children}</span>
    </motion.button>
  );
});

ExtraLargeButton.displayName = "ExtraLargeButton";
