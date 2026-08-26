"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { locales } from "@/i18n";
import { motion } from "framer-motion";

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
    { code: "hi", name: "हिंदी", label: "Hindi", icon: "🇮🇳" },
    { code: "en", name: "English", label: "English", icon: "🌐" },
    { code: "mr", name: "मराठी", label: "Marathi", icon: "🚩" },
  ];

  return (
    <div className="flex items-center gap-2 p-1 bg-muted rounded-2xl border">
      {languages.map((lang) => {
        const isSelected = currentLocale === lang.code;
        return (
          <motion.button
            key={lang.code}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => handleSelectLanguage(lang.code)}
            aria-pressed={isSelected}
            className={`min-h-[48px] px-4 py-2 rounded-xl font-bold text-base flex items-center gap-2 transition-all ${
              isSelected
                ? "bg-ayush-green text-white shadow-md"
                : "text-foreground hover:bg-background/80"
            }`}
          >
            <span className="text-lg">{lang.icon}</span>
            <span>{lang.name}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
