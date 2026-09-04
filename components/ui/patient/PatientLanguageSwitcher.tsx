"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { locales } from "@/i18n";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function PatientLanguageSwitcher({ currentLocale }: { currentLocale: string }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleSelectLanguage = (newLocale: string) => {
    const segments = pathname.split("/");
    if (locales.includes(segments[1] as any)) {
      segments[1] = newLocale;
    } else {
      segments.splice(1, 0, newLocale);
    }
    router.push(segments.join("/"));
  };

  const languages = [
    { code: "hi", name: "हिंदी", icon: "🇮🇳" },
    { code: "raj", name: "राजस्थानी", icon: "🐪" },
    { code: "en", name: "EN", icon: "🌐" },
  ];

  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/60 border border-border/60">
      {languages.map((lang) => {
        const isSelected = currentLocale === lang.code;
        return (
          <motion.button
            key={lang.code}
            whileTap={{ scale: 0.94 }}
            type="button"
            onClick={() => handleSelectLanguage(lang.code)}
            aria-pressed={isSelected}
            className={cn(
              "min-h-[32px] px-2.5 py-1 rounded-lg font-bold text-[12px] flex items-center gap-1.5 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
              isSelected
                ? "bg-white dark:bg-slate-800 text-foreground shadow-sm border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="text-sm">{lang.icon}</span>
            <span>{lang.name}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
