"use client";

/**
 * KioskModePage – AyurSetu Hospital Kiosk Entry
 *
 * Kiosk-hardened patient intake launcher:
 *  - Displays fullscreen "Start New Patient" vs "Resume" call-to-action.
 *  - Blocks accidental back-navigation via beforeunload guard.
 *  - Auto-clears stale sessions older than 4 hours.
 *  - Session timeout auto-reset after 10 minutes of inactivity.
 *  - Large (80px) touch targets for low-literacy / elderly users.
 */

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Play, RotateCcw, UserPlus, Clock, ShieldCheck, Hospital } from "lucide-react";
import { SessionRecoveryStore, DurableIntakeSnapshot } from "@/lib/offline/session-recovery.store";
import { OfflineBannerSync } from "@/components/ui/patient/OfflineBannerSync";
import { AyurSetuLogo } from "@/components/shared/AyurSetuLogo";

const KIOSK_INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 min

export default function KioskLauncherPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const router = useRouter();
  const isHindi = locale === "hi";

  const [resumableSession, setResumableSession] = useState<DurableIntakeSnapshot | null>(null);
  const [idleWarning, setIdleWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(30);

  // ── Session recovery check ──
  useEffect(() => {
    SessionRecoveryStore.getActiveSessionSnapshot().then((snap) => {
      if (snap && snap.step !== "SUBMITTED") {
        setResumableSession(snap);
      }
    });
  }, []);

  // ── Block accidental navigation away from kiosk ──
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // ── Inactivity auto-reset ──
  const resetIdleTimer = useCallback(() => {
    setIdleWarning(false);
    setSecondsLeft(30);
  }, []);

  useEffect(() => {
    let idleTimer: ReturnType<typeof setTimeout>;
    let countdownInterval: ReturnType<typeof setInterval>;

    const startIdle = () => {
      idleTimer = setTimeout(() => {
        setIdleWarning(true);
        let s = 30;
        countdownInterval = setInterval(() => {
          s--;
          setSecondsLeft(s);
          if (s <= 0) {
            clearInterval(countdownInterval);
            // Auto-clear and reset
            SessionRecoveryStore.clearActiveSession();
            setResumableSession(null);
            setIdleWarning(false);
          }
        }, 1000);
      }, KIOSK_INACTIVITY_TIMEOUT_MS);
    };

    const events = ["click", "touchstart", "keydown", "mousemove"];
    const handleActivity = () => {
      clearTimeout(idleTimer);
      clearInterval(countdownInterval);
      resetIdleTimer();
      startIdle();
    };

    events.forEach((e) => window.addEventListener(e, handleActivity));
    startIdle();

    return () => {
      clearTimeout(idleTimer);
      clearInterval(countdownInterval);
      events.forEach((e) => window.removeEventListener(e, handleActivity));
    };
  }, [resetIdleTimer]);

  // ── Actions ──
  const handleStartNew = async () => {
    await SessionRecoveryStore.clearActiveSession();
    router.push(`/${locale}/patient/language`);
  };

  const handleResume = () => {
    if (!resumableSession) return;
    if (resumableSession.step === "QUESTIONS") {
      router.push(`/${locale}/patient/questions`);
    } else if (resumableSession.step === "DOCUMENTS") {
      router.push(`/${locale}/patient/documents`);
    } else if (resumableSession.step === "SUMMARY_PREVIEW") {
      router.push(`/${locale}/patient/summary-preview`);
    } else {
      router.push(`/${locale}/patient/complaint`);
    }
  };

  const handleDismissResume = async () => {
    await SessionRecoveryStore.clearActiveSession(resumableSession?.sessionId);
    setResumableSession(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 opacity-5 pointer-events-none select-none">
        <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-emerald-500 blur-3xl" />
        <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-teal-500 blur-3xl" />
      </div>

      <OfflineBannerSync />

      {/* Idle Warning Overlay */}
      {idleWarning && (
        <div
          role="alertdialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full space-y-5 text-center shadow-2xl border-2 border-amber-400">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <Clock className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-black text-foreground">
              {isHindi ? "क्या आप यहाँ हैं?" : "Are you still here?"}
            </h2>
            <p className="text-sm font-semibold text-muted-foreground">
              {isHindi
                ? `${secondsLeft} सेकंड में स्वचालित रीसेट होगा`
                : `Auto-reset in ${secondsLeft} seconds for next patient`}
            </p>
            <button
              type="button"
              onClick={resetIdleTimer}
              className="w-full min-h-[56px] rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base cursor-pointer transition-all"
            >
              {isHindi ? "हाँ, जारी रखें" : "Yes, Continue"}
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-10 space-y-2 z-10">
        <div className="flex justify-center mb-4">
          <AyurSetuLogo size="xl" className="justify-center" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white">AyurSetu</h1>
        <p className="text-base font-bold text-emerald-300">
          {isHindi ? "रोगी परामर्श केंद्र" : "Patient Consultation Kiosk"}
        </p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-400/80">
            {isHindi ? "AIIA • स्वास्थ्य मंत्रालय" : "AIIA • Ministry of Ayush, Govt. of India"}
          </span>
        </div>
      </div>

      {/* Main CTA Cards */}
      <div className="w-full max-w-md space-y-4 z-10">
        {/* Start New Patient */}
        <button
          type="button"
          onClick={handleStartNew}
          className="w-full min-h-[80px] rounded-3xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white flex items-center justify-center gap-4 px-8 shadow-xl shadow-emerald-900/50 transition-all duration-200 cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-white/20 group-hover:bg-white/30 flex items-center justify-center transition-all shrink-0">
            <UserPlus className="h-6 w-6" />
          </div>
          <div className="text-left">
            <p className="text-xl font-black leading-tight">
              {isHindi ? "नया मरीज" : "New Patient"}
            </p>
            <p className="text-xs font-semibold text-emerald-100/80">
              {isHindi ? "परामर्श शुरू करें" : "Start intake for new patient"}
            </p>
          </div>
        </button>

        {/* Resume Previous (shown only if snapshot exists) */}
        {resumableSession && (
          <div className="rounded-3xl border-2 border-amber-400/60 bg-amber-950/40 backdrop-blur-sm p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-black text-amber-200">
                  {isHindi ? "अधूरा सत्र मिला" : "In-progress session found"}
                </p>
                <p className="text-xs font-semibold text-amber-300/70">
                  {resumableSession.chiefComplaint} • {resumableSession.collectedAnswers?.length || 0}{" "}
                  {isHindi ? "उत्तर सहेजे गए" : "answers saved"}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleResume}
                className="flex-1 min-h-[52px] rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Play className="h-4 w-4 fill-current" />
                {isHindi ? "जारी रखें" : "Resume"}
              </button>
              <button
                type="button"
                onClick={handleDismissResume}
                className="px-4 min-h-[52px] rounded-2xl bg-white/10 hover:bg-white/20 text-white/70 font-bold text-xs cursor-pointer transition-all"
              >
                {isHindi ? "नया" : "Discard"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-xs text-slate-500 z-10 space-y-1">
        <p>{isHindi ? "इस कियोस्क को छोड़ें नहीं — अगले मरीज़ के लिए अपने आप रीसेट होगा" : "Kiosk auto-resets after 10 min of inactivity for next patient"}</p>
        <p>SIH 2026 · Problem 26047 · AyurSetu v2.0</p>
      </div>
    </div>
  );
}
