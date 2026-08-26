"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  active?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, icon, label, sublabel, active, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        type="button"
        className={cn(
          "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all text-center min-h-[96px] min-w-[96px] select-none",
          active
            ? "bg-ayush-mint border-ayush-green text-ayush-green shadow-md dark:bg-emerald-950/40 dark:border-emerald-500"
            : "bg-white dark:bg-card border-border hover:border-ayush-emerald text-foreground shadow-sm",
          className
        )}
        {...(props as any)}
      >
        <div className="text-3xl mb-1.5">{icon}</div>
        <span className="font-bold text-base leading-tight">{label}</span>
        {sublabel && (
          <span className="text-xs text-muted-foreground mt-0.5">{sublabel}</span>
        )}
      </motion.button>
    );
  }
);

IconButton.displayName = "IconButton";
