"use client";

import React from "react";
import Link from "next/link";
import { LanguageSelector } from "./LanguageSelector";
import { useThemeStore } from "@/stores/use-theme-store";
import { Button } from "@/components/ui/button";
import { Stethoscope, User, ShieldCheck, Eye } from "lucide-react";

export function Navbar({ locale }: { locale: string }) {
  const { highContrast, toggleHighContrast } = useThemeStore();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href={`/${locale}`} className="flex items-center space-x-2 font-bold text-lg text-ayush-green">
            <span className="text-2xl">🌿</span>
            <span>AyurSetu</span>
          </Link>
          <nav className="hidden md:flex gap-6 text-sm font-medium">
            <Link href={`/${locale}/doctor`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <Stethoscope className="h-4 w-4 text-emerald-600" /> Doctor Consultation
            </Link>
            <Link href={`/${locale}/patient`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <User className="h-4 w-4 text-emerald-600" /> Patient PHR
            </Link>
            <Link href={`/${locale}/admin-dashboard`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> Admin & AYUSH
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-3">
          <LanguageSelector currentLocale={locale} />
          <Button
            variant="outline"
            size="sm"
            onClick={toggleHighContrast}
            aria-label="Toggle High Contrast Mode"
            className="flex items-center gap-1.5 min-h-[38px]"
          >
            <Eye className="h-4 w-4 text-emerald-700" />
            <span className="hidden sm:inline font-semibold">{highContrast ? "Normal" : "High Contrast"}</span>
          </Button>
          <Button variant="outline" size="sm" asChild className="min-h-[38px] font-semibold">
            <Link href={`/${locale}/login`}>Login</Link>
          </Button>
          <Button variant="ayush" size="sm" asChild className="min-h-[38px] font-bold">
            <Link href={`/${locale}/patient`}>Start Case</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
