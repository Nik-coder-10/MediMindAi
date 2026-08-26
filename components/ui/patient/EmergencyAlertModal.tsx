"use client";

import React from "react";
import { AlertTriangle, PhoneCall, Volume2, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import { ExtraLargeButton } from "./ExtraLargeButton";

interface EmergencyAlertModalProps {
  description: string;
  onDismiss: () => void;
}

export function EmergencyAlertModal({
  description,
  onDismiss,
}: EmergencyAlertModalProps) {
  const speechText =
    "सावधानी! आपके लक्षणों में तुरंत डॉक्टरी सहायता की आवश्यकता हो सकती है। कृपया शांत रहें और तुरंत पास के अस्पताल या आपातकालीन हेल्पलाइन से संपर्क करें।";

  const handlePlayVoice = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.lang = "hi-IN";
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-white dark:bg-slate-900 border-4 border-rose-600 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl text-center"
      >
        <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-lg animate-pulse">
          <AlertTriangle className="h-12 w-12" />
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 uppercase">
            <ShieldAlert className="h-4 w-4" /> आपातकालीन चेतावनी (Emergency Alert)
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            तुरंत डॉक्टरी सहायता लें
          </h2>
          <p className="text-base text-muted-foreground font-medium">
            Possible emergency symptoms detected. Please consult emergency medical staff immediately.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 text-left space-y-2">
          <span className="text-xs font-extrabold text-rose-700 uppercase">पहचाने गए लक्षण:</span>
          <p className="text-sm font-semibold text-rose-950 dark:text-rose-200">{description}</p>
        </div>

        {/* Audio Button */}
        <button
          type="button"
          onClick={handlePlayVoice}
          className="min-h-[48px] px-4 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs inline-flex items-center gap-2 hover:bg-slate-200"
        >
          <Volume2 className="h-4 w-4 text-emerald-600" />
          <span>आवाज में सुनें (Listen in Hindi)</span>
        </button>

        {/* Action Controls */}
        <div className="space-y-3 pt-2">
          <a
            href="tel:108"
            className="w-full min-h-[64px] rounded-2xl bg-rose-600 text-white font-extrabold text-xl flex items-center justify-center gap-3 shadow-xl hover:bg-rose-700 active:scale-95 transition-all"
          >
            <PhoneCall className="h-6 w-6" />
            <span>एम्बुलेंस को कॉल करें (Call 108 Emergency)</span>
          </a>

          <ExtraLargeButton
            variant="secondary"
            size="default"
            className="w-full"
            onClick={onDismiss}
          >
            परामर्श जारी रखें (I understand, continue)
          </ExtraLargeButton>
        </div>
      </motion.div>
    </div>
  );
}
