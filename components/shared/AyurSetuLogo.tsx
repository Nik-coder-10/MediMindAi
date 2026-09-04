"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface AyurSetuLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  subtitle?: string;
  className?: string;
  priority?: boolean;
}

export function AyurSetuLogo({
  size = "sm",
  showText = false,
  subtitle,
  className,
  priority = false,
}: AyurSetuLogoProps) {
  const sizeMap = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-20 h-20",
    xl: "w-28 h-28",
  };

  const pixelMap = {
    sm: 36,
    md: 56,
    lg: 88,
    xl: 120,
  };

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "relative rounded-xl overflow-hidden shadow-xs bg-white border border-botanical-200/80 dark:border-botanical-700/50 shrink-0",
          sizeMap[size]
        )}
      >
        <Image
          src="/images/ayursetu-logo.jpg"
          alt="AyurSetu Logo — A MediMindAI Project"
          width={pixelMap[size]}
          height={pixelMap[size]}
          priority={priority}
          className="w-full h-full object-cover"
        />
      </div>

      {showText && (
        <div className="flex flex-col leading-tight">
          <span className="text-[15px] font-black tracking-tight text-foreground">
            AyurSetu
          </span>
          <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-[0.12em]">
            {subtitle || "A MediMindAI Project"}
          </span>
        </div>
      )}
    </div>
  );
}
