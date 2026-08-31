"use client";

/**
 * AlertStaffButton
 *
 * Large, calm-but-unmissable emergency call-to-action for kiosk / patient intake.
 * Displayed whenever a CRITICAL / HIGH triage priority is detected.
 *
 * Behaviour:
 *  1. Click → POST /api/patient/emergency-alert → staff notified
 *  2. Shows "Staff notified" confirmation
 *  3. Secondary: tel:108 link (opens device dialer on mobile)
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PhoneCall, CheckCircle2, BellRing, Loader2, AlertTriangle } from "lucide-react";

interface AlertStaffButtonProps {
  sessionId: string;
  chiefComplaint?: string;
  tokenNumber?: string;
  locale?: string;
  /** If already confirmed, show the confirmed state immediately */
  alreadyAlerted?: boolean;
}

export function AlertStaffButton({
  sessionId,
  chiefComplaint,
  tokenNumber,
  locale = "en",
  alreadyAlerted = false,
}: AlertStaffButtonProps) {
  const isHindi = locale === "hi";
  const [state, setState] = useState<"idle" | "loading" | "confirmed" | "error">(
    alreadyAlerted ? "confirmed" : "idle"
  );

  const handleAlert = async () => {
    if (state === "loading" || state === "confirmed") return;
    setState("loading");

    try {
      const res = await fetch("/api/patient/emergency-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          chiefComplaint,
          tokenNumber,
          language: locale,
        }),
      });

      if (res.ok) {
        setState("confirmed");
        // Speak the confirmation in Hindi/English
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
          const text = isHindi
            ? "कर्मचारियों को सूचित कर दिया गया है। कृपया शांत रहें, सहायता आ रही है।"
            : "Medical staff have been notified. Please stay calm, help is on the way.";
          const u = new SpeechSynthesisUtterance(text);
          u.lang = isHindi ? "hi-IN" : "en-IN";
          u.rate = 0.88;
          window.speechSynthesis.speak(u);
        }
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Warning context strip */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40">
        <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" strokeWidth={2.5} />
        <p className="text-[12px] font-bold text-rose-800 dark:text-rose-300 leading-snug">
          {isHindi
            ? "संभावित आपातकालीन लक्षण पाए गए हैं। कृपया तुरंत कर्मचारियों को सूचित करें।"
            : "Possible emergency symptoms detected. Please alert staff immediately."}
        </p>
      </div>

      {/* Primary alert button */}
      <AnimatePresence mode="wait">
        {state === "confirmed" ? (
          <motion.div
            key="confirmed"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full min-h-[80px] rounded-3xl bg-emerald-600 flex items-center justify-center gap-4 px-6 shadow-xl shadow-emerald-900/30"
          >
            <CheckCircle2 className="h-8 w-8 text-white shrink-0" />
            <div className="text-left">
              <p className="text-white font-black text-[18px] leading-tight">
                {isHindi ? "कर्मचारी सूचित कर दिए गए" : "Staff have been notified"}
              </p>
              <p className="text-emerald-100/80 text-[12px] font-bold">
                {isHindi ? "कृपया शांत रहें — सहायता आ रही है" : "Please stay calm — help is on the way"}
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="idle"
            type="button"
            onClick={handleAlert}
            disabled={state === "loading"}
            whileTap={{ scale: 0.97 }}
            className="relative w-full min-h-[80px] rounded-3xl bg-gradient-to-br from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 disabled:opacity-70 text-white flex items-center justify-center gap-4 px-6 shadow-xl shadow-rose-900/40 transition-colors duration-200 cursor-pointer overflow-hidden"
            aria-label={isHindi ? "कर्मचारियों को सतर्क करें और 108 को कॉल करें" : "Alert medical staff and call 108"}
          >
            {/* Subtle pulse ring for urgency without alarm */}
            <motion.span
              className="absolute inset-0 rounded-3xl border-2 border-white/30"
              animate={{ scale: [1, 1.03, 1], opacity: [0.5, 0.2, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />

            <div className="relative w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              {state === "loading" ? (
                <Loader2 className="h-7 w-7 text-white animate-spin" />
              ) : (
                <BellRing className="h-7 w-7 text-white" />
              )}
            </div>

            <div className="relative text-left">
              <p className="font-black text-[18px] leading-tight">
                {isHindi ? "कर्मचारियों को सतर्क करें" : "Alert Medical Staff"}
              </p>
              <p className="text-white/80 text-[12px] font-bold">
                {isHindi ? "108 एम्बुलेंस सेवा" : "Call 108 — Emergency Ambulance"}
              </p>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Error state helper */}
      {state === "error" && (
        <p className="text-[11px] font-bold text-rose-600 text-center px-2">
          {isHindi
            ? "नेटवर्क त्रुटि — कृपया 108 पर कॉल करें"
            : "Network error — please call 108 directly"}
        </p>
      )}

      {/* tel:108 secondary link — always visible */}
      <a
        href="tel:108"
        className="w-full min-h-[52px] rounded-2xl border-2 border-rose-300 dark:border-rose-800 bg-rose-50/60 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 font-black text-[15px] flex items-center justify-center gap-2.5 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-all"
        aria-label="Call 108 emergency ambulance"
      >
        <PhoneCall className="h-5 w-5" strokeWidth={2.5} />
        {isHindi ? "108 पर कॉल करें (Emergency Ambulance)" : "Call 108 — Emergency Ambulance"}
      </a>
    </div>
  );
}
