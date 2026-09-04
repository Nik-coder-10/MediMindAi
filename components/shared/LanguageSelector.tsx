"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { locales } from "@/i18n";
import { Globe } from "lucide-react";

export function LanguageSelector({ currentLocale }: { currentLocale: string }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLanguageChange = (newLocale: string) => {
    // Replace locale in path
    const segments = pathname.split("/");
    if (locales.includes(segments[1] as any)) {
      segments[1] = newLocale;
    } else {
      segments.splice(1, 0, newLocale);
    }
    router.push(segments.join("/"));
  };

  const languageLabels: Record<string, string> = {
    en: "English",
    hi: "हिंदी (Hindi)",
    raj: "राजस्थानी (Rajasthani)",
  };

  return (
    <div className="flex items-center space-x-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <select
        value={currentLocale}
        onChange={(e) => handleLanguageChange(e.target.value)}
        className="bg-background border border-input rounded-md px-2 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label="Select Language"
      >
        {locales.map((loc) => (
          <option key={loc} value={loc}>
            {languageLabels[loc] || loc.toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  );
}
