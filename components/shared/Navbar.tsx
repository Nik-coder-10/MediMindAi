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
            <Link href={`/${locale}/doctor/consultation`} className="flex items-center gap-1 hover:text-primary">
              <Stethoscope className="h-4 w-4" /> Doctor Consultation
            </Link>
            <Link href={`/${locale}/patient/patient-dashboard`} className="flex items-center gap-1 hover:text-primary">
              <User className="h-4 w-4" /> Patient PHR
            </Link>
            <Link href={`/${locale}/admin/admin-dashboard`} className="flex items-center gap-1 hover:text-primary">
              <ShieldCheck className="h-4 w-4" /> Admin & AYUSH
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <LanguageSelector currentLocale={locale} />
          <Button
            variant="outline"
            size="sm"
            onClick={toggleHighContrast}
            aria-label="Toggle High Contrast Mode"
            className="flex items-center gap-1"
          >
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">{highContrast ? "Normal" : "High Contrast"}</span>
          </Button>
          <Button variant="ayush" size="sm" asChild>
            <Link href={`/${locale}/doctor/consultation`}>Start Case</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
