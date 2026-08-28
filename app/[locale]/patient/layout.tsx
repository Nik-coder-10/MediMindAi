"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PatientLanguageSwitcher } from "@/components/ui/patient/PatientLanguageSwitcher";
import { useThemeStore } from "@/stores/use-theme-store";
import { Eye, LogOut, HeartHandshake, PhoneCall, LogIn } from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/use-auth-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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

  // If user is accessing patient routes but explicitly confirmed not logged in after mount
  if (mounted && !isAuthenticated && !pathname.includes("/login")) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
        <Card className="max-w-md w-full p-6 sm:p-8 rounded-3xl border-2 border-emerald-400 space-y-5 text-center shadow-xl">
          <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 rounded-full flex items-center justify-center mx-auto text-2xl">
            🛡️
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-black text-foreground">रोगी प्रमाणीकरण आवश्यक (Patient Login Required)</h2>
            <p className="text-xs text-muted-foreground font-semibold">
              To fetch your ABHA health record, past prescriptions, and register clinical encounters, please log in with your ABHA ID or mobile number.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <Button
              className="w-full font-extrabold min-h-[46px] flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => router.push(`/${locale}/login?role=patient`)}
            >
              <LogIn className="h-4 w-4" />
              <span>Login with ABHA / Mobile OTP</span>
            </Button>

            <Button
              variant="outline"
              className="w-full text-xs font-bold border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20"
              onClick={() => {
                loginAsPatient({
                  name: "Ramesh Sharma",
                  abhaId: "14-5542-8921-3410",
                  phone: "+91 98765 43210",
                });
              }}
            >
              <span>⚡ Quick Demo Login (Ramesh Sharma • ABHA)</span>
            </Button>
          </div>
        </Card>
      </div>
    );
  }


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

          {/* Action Tools: Logout */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push(`/${locale}/login`)}
              aria-label="Logout"
              className="min-h-[44px] min-w-[44px] px-3.5 rounded-xl border-2 border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <LogOut className="h-4 w-4" />
              <span>लॉगआउट</span>
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
