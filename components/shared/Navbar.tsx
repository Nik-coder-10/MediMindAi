"use client";

import React from "react";
import Link from "next/link";
import { LanguageSelector } from "./LanguageSelector";
import { useThemeStore } from "@/stores/use-theme-store";
import { Button } from "@/components/ui/button";
import {
  Stethoscope,
  User,
  ShieldCheck,
  Eye,
  SunMedium,
  Moon,
  LogIn,
  LogOut,
  Activity,
} from "lucide-react";
import { useAuthStore } from "@/stores/use-auth-store";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { DoctorNotificationFeed } from "@/components/ui/clinical/DoctorNotificationFeed";

export function Navbar({ locale }: { locale: string }) {
  const { contrastMode, cycleContrastMode } = useThemeStore();
  const { isAuthenticated, user, logout } = useAuthStore();

  const contrastConfig = {
    normal: {
      label: "AA",
      title: "Normal Mode",
      icon: <Eye className="h-3.5 w-3.5" />,
    },
    high: {
      label: "AAA",
      title: "High Contrast",
      icon: <SunMedium className="h-3.5 w-3.5" />,
    },
    low: {
      label: "Eye",
      title: "Eye-Rest Mode",
      icon: <Moon className="h-3.5 w-3.5" />,
    },
  }[contrastMode];

  const navLinks = [
    {
      href: `/${locale}/doctor`,
      label: "Doctor",
      icon: <Stethoscope className="h-3.5 w-3.5" />,
    },
    {
      href: `/${locale}/patient`,
      label: "Patient",
      icon: <User className="h-3.5 w-3.5" />,
    },
    {
      href: `/${locale}/admin-dashboard`,
      label: "Admin",
      icon: <ShieldCheck className="h-3.5 w-3.5" />,
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Glass navbar */}
      <div className="glass-panel border-b border-white/40 dark:border-white/06">
        <div className="container flex h-[60px] items-center justify-between gap-4">

          {/* ── Brand ── */}
          <Link
            href={`/${locale}`}
            className="flex items-center gap-2.5 group"
            aria-label="AyurSetu home"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-ayush flex items-center justify-center shadow-sm group-hover:shadow-indigo-glow transition-all duration-300">
              <Activity className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[15px] font-black tracking-tight text-foreground">
                AyurSetu
              </span>
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.12em]">
                Ministry of Ayush
              </span>
            </div>
          </Link>

          {/* ── Nav Links ── */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Primary navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold text-muted-foreground hover:text-foreground hover:bg-indigo-50/60 dark:hover:bg-indigo-950/30 transition-all duration-200"
              >
                <span className="text-indigo-400">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </nav>

          {/* ── Right Controls ── */}
          <div className="flex items-center gap-2">
            {/* Language */}
            <LanguageSelector currentLocale={locale} />

            {/* Contrast toggle */}
            <button
              onClick={cycleContrastMode}
              aria-label={`Switch contrast: ${contrastConfig.title}`}
              title={`Contrast: ${contrastConfig.title} — click to cycle`}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-background/60 backdrop-blur-sm text-[11px] font-bold text-muted-foreground hover:text-foreground hover:border-indigo-300 transition-all duration-200 min-h-[34px]"
            >
              <span className="text-indigo-500">{contrastConfig.icon}</span>
              <span className="hidden sm:inline">{contrastConfig.label}</span>
            </button>

            {/* Doctor Real-time Notification Bell & Drawer */}
            <DoctorNotificationFeed locale={locale} />

            {/* Auth */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <div className="hidden lg:flex flex-col items-end leading-none">
                  <span className="text-[12px] font-bold text-foreground truncate max-w-[120px]">
                    {user.name}
                  </span>
                  <span className="text-[9px] font-semibold text-muted-foreground font-mono">
                    {user.role === "PATIENT"
                      ? `ABHA · ${user.abhaId?.slice(0, 8) || "Linked"}`
                      : user.role === "DOCTOR"
                      ? user.doctorRegNumber?.slice(0, 14) || "MD (Ayu)"
                      : "Ministry Admin"}
                  </span>
                </div>
                <button
                  onClick={logout}
                  title="Log out"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50/60 dark:bg-red-950/20 text-[11px] font-bold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/40 transition-all min-h-[34px]"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <Link
                href={`/${locale}/login`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-[12px] font-bold text-foreground hover:border-indigo-300 hover:bg-indigo-50/50 transition-all min-h-[34px]"
              >
                <LogIn className="h-3.5 w-3.5 text-indigo-500" />
                Login
              </Link>
            )}

            {/* CTA */}
            <Link
              href={`/${locale}/patient`}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-ayush text-white text-[12px] font-bold shadow-sm hover:shadow-indigo-glow transition-all duration-300 min-h-[34px]"
            >
              <Activity className="h-3.5 w-3.5" />
              Start Case
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
