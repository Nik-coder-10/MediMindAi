"use client";

import React from "react";
import { AlertTriangle, Volume2, ShieldAlert, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ExtraLargeButton } from "./ExtraLargeButton";
import { AlertStaffButton } from "./AlertStaffButton";

interface EmergencyAlertModalProps {
  description: string;
  onDismiss: () => void;
  sessionId?: string;
  locale?: string;
}

export function EmergencyAlertModal({
  description,
  onDismiss,
  sessionId,
  locale = "en",
}: EmergencyAlertModalProps) {
  const speechText =
    "सावधानी! आपके लक्षणों में तुरंत डॉक्टरी सहायता की आवश्यकता हो सकती है। कृपया शांत रहें और तुरंत पास के अस्पताल या आपातकालीन हेल्पलाइन से संपर्क करें।";

  const handlePlayVoice = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.lang = "hi-IN";
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
        onClick={onDismiss}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md relative"
        >
          {/* Neo-brutal alert card */}
          <div className="bg-white dark:bg-slate-950 rounded-[20px] border-[3px] border-red-600 shadow-[6px_6px_0px_0px_#DC2626] overflow-hidden">

            {/* Red header band */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 flex items-center gap-3">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0"
              >
                <AlertTriangle className="h-5 w-5 text-white" strokeWidth={2.5} />
              </motion.div>
              <div>
                <div className="text-white/80 text-[10px] font-black uppercase tracking-[0.15em]">
                  ⚠ Clinical Red Flag Detected
                </div>
                <h2 className="text-white font-black text-[18px] leading-tight">
                  तुरंत डॉक्टरी सहायता लें
                </h2>
              </div>
              <button
                onClick={onDismiss}
                className="ml-auto w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                aria-label="Dismiss alert"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <p className="text-sm font-medium text-muted-foreground">
                Possible emergency symptoms detected. Please consult emergency medical staff immediately.
              </p>

              {/* Detected symptoms */}
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40">
                <div className="flex items-center gap-1.5 mb-2">
                  <ShieldAlert className="h-3.5 w-3.5 text-red-600" />
                  <span className="text-[10px] font-black text-red-700 dark:text-red-400 uppercase tracking-wider">
                    पहचाने गए लक्षण:
                  </span>
                </div>
                <p className="text-[13px] font-semibold text-red-900 dark:text-red-200 leading-relaxed">
                  {description}
                </p>
              </div>

              {/* Voice button */}
              <button
                type="button"
                onClick={handlePlayVoice}
                className="w-full flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-border transition-all"
              >
                <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-950/50 flex items-center justify-center">
                  <Volume2 className="h-3.5 w-3.5 text-teal-700 dark:text-teal-400" />
                </div>
                <span className="text-[12px] font-bold text-foreground">
                  आवाज में सुनें (Listen in Hindi)
                </span>
              </button>

              {/* Alert Staff Button (replaces plain tel:108 link) */}
              <AlertStaffButton
                sessionId={sessionId || "sess-emergency"}
                chiefComplaint={description}
                locale={locale}
              />

              <ExtraLargeButton
                variant="secondary"
                size="default"
                className="w-full"
                onClick={onDismiss}
              >
                परामर्श जारी रखें (I understand, continue)
              </ExtraLargeButton>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

