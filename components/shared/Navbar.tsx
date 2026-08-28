"use client";

import React from "react";
import Link from "next/link";
import { LanguageSelector } from "./LanguageSelector";
import { useThemeStore } from "@/stores/use-theme-store";
import { Button } from "@/components/ui/button";
import { Stethoscope, User, ShieldCheck, Eye, SunMedium, Moon, LogIn, LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/use-auth-store";

export function Navbar({ locale }: { locale: string }) {
  const { contrastMode, cycleContrastMode } = useThemeStore();
  const { isAuthenticated, user, logout } = useAuthStore();

  const contrastLabels = {
    normal: { label: "Normal", icon: <Eye className="h-4 w-4 text-emerald-700" />, badge: "Standard" },
    high: { label: "High Contrast", icon: <SunMedium className="h-4 w-4 text-amber-500" />, badge: "WCAG AAA" },
    low: { label: "Low Contrast", icon: <Moon className="h-4 w-4 text-sky-600" />, badge: "Eye-Rest" },
  }[contrastMode];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background shadow-xs">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href={`/${locale}`} className="flex items-center space-x-2 font-bold text-lg text-foreground hover:opacity-80">
            <span className="text-2xl">🌿</span>
            <span className="text-ayush-green font-extrabold">AyurSetu</span>
          </Link>
          <nav className="hidden md:flex gap-6 text-sm font-medium">
            <Link
              href={`/${locale}/doctor`}
              className="flex items-center gap-1.5 text-foreground hover:text-primary font-bold transition-colors"
            >
              <Stethoscope className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
              <span>Doctor Consultation</span>
            </Link>
            <Link
              href={`/${locale}/patient`}
              className="flex items-center gap-1.5 text-foreground hover:text-primary font-bold transition-colors"
            >
              <User className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
              <span>Patient PHR</span>
            </Link>
            <Link
              href={`/${locale}/admin-dashboard`}
              className="flex items-center gap-1.5 text-foreground hover:text-primary font-bold transition-colors"
            >
              <ShieldCheck className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
              <span>Admin & AYUSH</span>
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-2.5">
          <LanguageSelector currentLocale={locale} />
          <Button
            variant="outline"
            size="sm"
            onClick={cycleContrastMode}
            aria-label="Toggle Contrast Mode (Normal, High, Low)"
            className="flex items-center gap-1.5 min-h-[38px] border-2 font-semibold shadow-2xs"
            title="Switch contrast mode: Normal -> High Contrast (AAA) -> Low Contrast (Eye-Rest)"
          >
            {contrastLabels.icon}
            <span className="hidden sm:inline">{contrastLabels.label}</span>
          </Button>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-extrabold text-foreground truncate max-w-[140px]">{user.name}</span>
                <span className="text-3xs font-bold text-muted-foreground font-mono">
                  {user.role === "PATIENT" ? `ABHA: ${user.abhaId || "Linked"}` : user.role === "DOCTOR" ? user.doctorRegNumber || "MD (Ayu)" : "Ministry Admin"}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                title="Log out of session"
                className="min-h-[38px] text-xs font-extrabold text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-1"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" asChild className="min-h-[38px] font-bold">
              <Link href={`/${locale}/login`}>Login</Link>
            </Button>
          )}

          <Button variant="ayush" size="sm" asChild className="min-h-[38px] font-extrabold">
            <Link href={`/${locale}/patient`}>Start Case</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}


