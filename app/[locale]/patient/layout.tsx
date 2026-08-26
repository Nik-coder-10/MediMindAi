"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PatientLanguageSwitcher } from "@/components/ui/patient/PatientLanguageSwitcher";
import { useThemeStore } from "@/stores/use-theme-store";
import { Eye, LogOut, HeartHandshake, PhoneCall } from "lucide-react";
import { motion } from "framer-motion";

export default function PatientShellLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { highContrast, toggleHighContrast } = useThemeStore();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Top Patient Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b shadow-sm">
        <div className="container max-w-4xl mx-auto px-4 h-20 flex items-center justify-between gap-2">
          {/* Logo & Calming Badge */}
          <Link
            href={`/${locale}/patient`}
            className="flex items-center gap-2.5 focus:outline-none focus:ring-4 focus:ring-emerald-300 rounded-xl p-1"
          >
            <div className="w-12 h-12 rounded-2xl bg-ayush-mint flex items-center justify-center border-2 border-ayush-green text-2xl shadow-sm">
              🌿
            </div>
            <div>
              <span className="text-xl font-extrabold text-ayush-green tracking-tight">आयुर्वेद सेतु</span>
              <span className="block text-xs font-semibold text-muted-foreground">AyurSetu Patient Care</span>
            </div>
          </Link>

          {/* Action Tools: Language, Contrast, Emergency */}
          <div className="flex items-center gap-2">
            <PatientLanguageSwitcher currentLocale={locale} />

            <button
              type="button"
              onClick={toggleHighContrast}
              aria-label="Toggle High Contrast Mode"
              className="min-h-[48px] min-w-[48px] px-3 rounded-xl border-2 border-border bg-background hover:bg-muted font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">{highContrast ? "Normal" : "High Contrast"}</span>
            </button>

            <button
              type="button"
              onClick={() => router.push(`/${locale}/login`)}
              aria-label="Logout"
              className="min-h-[48px] min-w-[48px] px-3 rounded-xl border-2 border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs flex items-center gap-1 shadow-sm"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">लॉगआउट</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Persistent Rural Emergency Help Footer */}
      <footer className="border-t bg-white dark:bg-slate-900 py-4">
        <div className="container max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <HeartHandshake className="h-4 w-4 text-emerald-600" />
            <span>Ministry of Ayush / AIIA • 100% Free & Secure Clinical Service</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="tel:1075"
              className="min-h-[44px] px-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-100"
            >
              <PhoneCall className="h-3.5 w-3.5" />
              <span>National Ayush Helpline: 1075</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
