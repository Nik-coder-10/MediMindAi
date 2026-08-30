"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Play, CheckCircle2, AlertCircle, ArrowRight, UserPlus } from "lucide-react";
import { SessionRecoveryStore, DurableIntakeSnapshot } from "@/lib/offline/session-recovery.store";

export interface ResumeSessionModalProps {
  locale: string;
  onStartNew?: () => void;
}

export function ResumeSessionModal({ locale, onStartNew }: ResumeSessionModalProps) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<DurableIntakeSnapshot | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const isHindi = locale === "hi";

  useEffect(() => {
    async function checkForExistingSession() {
      const existing = await SessionRecoveryStore.getActiveSessionSnapshot();
      if (existing && existing.sessionId && existing.step !== "SUBMITTED") {
        setSnapshot(existing);
        setIsOpen(true);
      }
    }
    checkForExistingSession();
  }, []);

  if (!isOpen || !snapshot) return null;

  const handleResume = () => {
    setIsOpen(false);
    // Route to appropriate step
    if (snapshot.step === "QUESTIONS") {
      router.push(`/${locale}/patient/questions`);
    } else if (snapshot.step === "DOCUMENTS") {
      router.push(`/${locale}/patient/documents`);
    } else if (snapshot.step === "SUMMARY_PREVIEW") {
      router.push(`/${locale}/patient/summary-preview`);
    } else {
      router.push(`/${locale}/patient/complaint`);
    }
  };

  const handleDismissAndStartFresh = async () => {
    await SessionRecoveryStore.clearActiveSession(snapshot.sessionId);
    setIsOpen(false);
    if (onStartNew) {
      onStartNew();
    }
  };

  const timeAgoMinutes = Math.max(1, Math.round((Date.now() - snapshot.lastActiveTimestamp) / 60000));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="resume-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="w-full max-w-lg bg-card border-2 border-emerald-500/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0">
            <RotateCcw className="h-6 w-6" />
          </div>
          <div>
            <h2 id="resume-dialog-title" className="text-lg sm:text-xl font-black text-foreground">
              {isHindi ? "पिछला परामर्श सत्र जारी रखें?" : "Resume Previous Consultation?"}
            </h2>
            <p className="text-xs font-semibold text-muted-foreground">
              {isHindi ? `${timeAgoMinutes} मिनट पहले सक्रिय सत्र मिला` : `Active intake found from ${timeAgoMinutes}m ago`}
            </p>
          </div>
        </div>

        {/* Snapshot Summary Box */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border space-y-2 text-xs">
          <div className="flex justify-between items-center pb-2 border-b">
            <span className="font-bold text-muted-foreground">
              {isHindi ? "मुख्य शिकायत:" : "Chief Complaint:"}
            </span>
            <span className="font-black text-foreground truncate max-w-[200px]">
              {snapshot.chiefComplaint || "Consultation"}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="font-bold text-muted-foreground">
              {isHindi ? "उत्तर दिए गए प्रश्न:" : "Answers Saved:"}
            </span>
            <span className="font-black text-emerald-700 dark:text-emerald-400">
              {snapshot.collectedAnswers?.length || 0} {isHindi ? "उत्तर सुरक्षित" : "saved"}
            </span>
          </div>

          {snapshot.uploadedDocSummaries?.length > 0 && (
            <div className="flex justify-between items-center">
              <span className="font-bold text-muted-foreground">
                {isHindi ? "संलग्न दस्तावेज़:" : "Attached Documents:"}
              </span>
              <span className="font-black text-foreground">
                {snapshot.uploadedDocSummaries.length} {isHindi ? "दस्तावेज़" : "files"}
              </span>
            </div>
          )}
        </div>

        {/* Large Touch Target Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={handleResume}
            className="w-full min-h-[58px] px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer transition-all"
          >
            <Play className="h-5 w-5 fill-current" />
            <span>{isHindi ? "हाँ, पिछला सत्र जारी रखें (Resume)" : "Yes, Resume Previous Intake"}</span>
            <ArrowRight className="h-4 w-4 ml-1" />
          </button>

          <button
            type="button"
            onClick={handleDismissAndStartFresh}
            className="w-full min-h-[48px] px-6 py-2.5 rounded-2xl border-2 border-input hover:bg-muted text-muted-foreground font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <UserPlus className="h-4 w-4" />
            <span>{isHindi ? "नया मरीज / नया परामर्श शुरू करें" : "Start Fresh / New Patient Intake"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
