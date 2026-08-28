"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PatientLanguageSwitcher } from "@/components/ui/patient/PatientLanguageSwitcher";
import { useThemeStore } from "@/stores/use-theme-store";
import { Eye, LogOut, HeartHandshake, PhoneCall, LogIn, Activity, ShieldCheck, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/use-auth-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function PatientShellLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, loginAsPatient } = useAuthStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Only show auth gate after client hydration confirms user is not authenticated
  // DO NOT block rendering before mount — this causes blank screen on language switch
  if (mounted && !isAuthenticated && !pathname.includes("/login")) {
    return (
      <div className="min-h-screen patient-mesh flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm"
        >
          <div className="clay-white rounded-3xl p-8 space-y-6 text-center">
            {/* Icon */}
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-50 border border-indigo-200/60 flex items-center justify-center shadow-clay-sm">
              <ShieldCheck className="h-7 w-7 text-indigo-600" />
            </div>

            {/* Text */}
            <div className="space-y-2">
              <h2 className="text-[19px] font-black text-foreground tracking-tight">
                Patient Login Required
              </h2>
              <p className="text-[12px] text-muted-foreground font-medium leading-relaxed">
                रोगी प्रमाणीकरण आवश्यक — Please log in with your ABHA ID or mobile number to access your health records.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-2.5">
              <button
                className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white font-bold text-[14px] shadow-md hover:shadow-indigo-glow transition-all duration-300 active:scale-[0.98]"
                onClick={() => router.push(`/${locale}/login?role=patient`)}
              >
                <LogIn className="h-4 w-4" />
                Login with ABHA / Mobile OTP
              </button>

              <button
                className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-xl border border-teal-300 bg-teal-50/60 dark:bg-teal-950/20 text-teal-800 dark:text-teal-300 font-bold text-[13px] hover:bg-teal-100 dark:hover:bg-teal-950/40 transition-all"
                onClick={() => {
                  loginAsPatient({
                    name: "Ramesh Sharma",
                    abhaId: "14-5542-8921-3410",
                    phone: "+91 98765 43210",
                  });
                }}
              >
                <Zap className="h-3.5 w-3.5" />
                Quick Demo Login (Ramesh Sharma · ABHA)
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // While zustand-persist is still rehydrating (mounted=false), show the full shell with children
  // This ensures language switch never produces a blank screen

  return (
    <div className="min-h-screen flex flex-col patient-mesh font-sans">
      {/* ── Patient Portal Header ── */}
      <header className="sticky top-0 z-40 glass-panel border-b border-white/50 dark:border-white/06">
        <div className="container max-w-4xl mx-auto px-4 h-[60px] flex items-center justify-between gap-3">

          {/* Brand */}
          <Link
            href={`/${locale}/patient`}
            className="flex items-center gap-2.5 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 p-1"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-sm">
              <Activity className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
            </div>
            <div className="leading-none">
              <span className="block text-[14px] font-black text-foreground tracking-tight">
                आयुर्वेद सेतु
              </span>
              <span className="block text-[10px] font-semibold text-muted-foreground">
                Patient Care Portal
              </span>
            </div>
          </Link>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            <PatientLanguageSwitcher currentLocale={locale} />

            <button
              type="button"
              onClick={() => router.push(`/${locale}/login`)}
              aria-label="Logout"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50/60 dark:bg-red-950/20 text-red-600 dark:text-red-400 font-bold text-[11px] hover:bg-red-100 dark:hover:bg-red-950/40 transition-all min-h-[34px]"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">लॉगआउट</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          {children}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="glass-panel border-t border-white/40 dark:border-white/06 py-3.5">
        <div className="container max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
            <HeartHandshake className="h-3.5 w-3.5 text-teal-600" />
            <span>Ministry of Ayush / AIIA · 100% Free &amp; Secure</span>
          </div>
          <a
            href="tel:1075"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-300 dark:border-teal-800 bg-teal-50/60 dark:bg-teal-950/20 text-teal-800 dark:text-teal-300 font-bold text-[11px] hover:bg-teal-100 dark:hover:bg-teal-950/40 transition-all min-h-[36px]"
          >
            <PhoneCall className="h-3.5 w-3.5" />
            Ayush Helpline: 1075
          </a>
        </div>
      </footer>
    </div>
  );
}
