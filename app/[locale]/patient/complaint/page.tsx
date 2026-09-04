"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ProgressStepper } from "@/components/ui/patient/ProgressStepper";
import { AudioPrompt } from "@/components/ui/patient/AudioPrompt";
import { ExtraLargeButton } from "@/components/ui/patient/ExtraLargeButton";
import { VoiceInputButton } from "@/components/ui/patient/VoiceInputButton";
import { ResumeSessionModal } from "@/components/ui/patient/ResumeSessionModal";
import { OfflineBannerSync } from "@/components/ui/patient/OfflineBannerSync";
import { SessionRecoveryStore } from "@/lib/offline/session-recovery.store";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, HeartPulse, Sparkles, Keyboard } from "lucide-react";
import { motion } from "framer-motion";

export default function PatientComplaintVoicePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const router = useRouter();
  const [complaintText, setComplaintText] = useState("");
  const [showKeyboard, setShowKeyboard] = useState(false);

  const isRajasthani = locale === "raj";
  const isHindi = locale === "hi";

  const quickSymptoms = [
    {
      textHi: isRajasthani ? "छाती में दरद अर भारीपण" : "छाती में दर्द व भारीपन",
      textEn: "Chest Pain & Pressure",
      icon: "🫀",
    },
    {
      textHi: isRajasthani ? "घणो माथो दरद अर चक्कर" : "तेज सिरदर्द व चक्कर",
      textEn: "Severe Headache",
      icon: "🧠",
    },
    {
      textHi: isRajasthani ? "पेट में बाळू अर दरद" : "पेट में जलन व दर्द",
      textEn: "Abdominal Pain / Acidity",
      icon: "⚡",
    },
    {
      textHi: isRajasthani ? "जोड़ां में तेज जकड़न अर दरद" : "जोड़ों में तेज जकड़न",
      textEn: "Joint Pain & Stiffness",
      icon: "🦴",
    },
    {
      textHi: isRajasthani ? "घणो ताव (बुखार) अर सी लागणो" : "तेज बुखार व ठंड लगना",
      textEn: "High Fever & Chills",
      icon: "🌡️",
    },
  ];

  const handleTranscription = (transcript: string) => {
    setComplaintText(transcript);
  };

  const handleContinue = async () => {
    if (!complaintText) return;
    const mode = (typeof window !== "undefined" ? sessionStorage.getItem("ayursetu_intake_mode") : null) || "AYURVEDA";

    if (typeof window !== "undefined") {
      sessionStorage.setItem("ayursetu_chief_complaint", complaintText);
      sessionStorage.setItem("ayursetu_intake_mode", mode);
      sessionStorage.removeItem("ayursetu_active_session_id");
      sessionStorage.removeItem("ayursetu_current_question");
      sessionStorage.removeItem("ayursetu_current_step");
    }

    // Persist durable session snapshot
    await SessionRecoveryStore.saveActiveSessionSnapshot({
      sessionId: `sess_${Date.now()}`,
      language: locale,
      chiefComplaint: complaintText,
      collectedAnswers: [],
      uploadedDocSummaries: [],
      triagePriority: "ROUTINE",
      lastActiveTimestamp: Date.now(),
      step: "QUESTIONS",
    });

    router.push(`/${locale}/patient/questions?mode=${mode}`);
  };

  return (
    <div className="space-y-6">
      <ResumeSessionModal locale={locale} onStartNew={() => setComplaintText("")} />
      <OfflineBannerSync />
      <ProgressStepper currentStep={3} />

      <AudioPrompt
        locale={locale}
        hindiText={
          isRajasthani
            ? "घणी विनती है, आपरी मुख्य तकलीफ या बीमारी बताओ सा। आप माइक रो बटन दाब’र बोल सको हो।"
            : "कृपया अपनी मुख्य बीमारी या समस्या बताएं। आप माइक का बटन दबाकर बोल सकते हैं।"
        }
        text="Please describe your main health concern. You can tap the big microphone to speak."
      />

      <Card className="border border-botanical-200/80 dark:border-botanical-800/40 shadow-glass-precision p-6 sm:p-8 rounded-3xl bg-card space-y-6 text-center">
        <div className="space-y-2">
          <span className="text-xs font-extrabold px-3 py-1 bg-botanical-100 dark:bg-botanical-950/60 text-botanical-800 dark:text-botanical-300 rounded-full inline-flex items-center gap-1.5 border border-botanical-200/80">
            <Sparkles className="h-3.5 w-3.5 text-botanical-600" />{" "}
            {isRajasthani
              ? "चरण ३ • मुख्य लक्षण (Chief Complaint)"
              : "चरण ३ • मुख्य लक्षण (Chief Complaint)"}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            {isRajasthani ? "आपणै कांई तकलीफ हो री है सा?" : "आपको क्या समस्या हो रही है?"}
          </h2>
          <p className="text-sm font-medium text-muted-foreground max-w-md mx-auto">
            {isRajasthani
              ? "आपरी भाषा में खुल'र बताओ। आप मारवाड़ी/राजस्थानी या हिंदी में बोल सको हो।"
              : "Describe how you are feeling in your own words. Speak naturally in Hindi or English."}
          </p>
        </div>

        {/* Big Animated Voice Input Centerpiece */}
        <div className="py-4">
          <VoiceInputButton
            onTranscriptionComplete={handleTranscription}
            language={isRajasthani || isHindi ? "hi-IN" : "en-IN"}
          />
        </div>

        {/* Live Transcription Box */}
        {complaintText && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-botanical-50/80 dark:bg-botanical-950/30 border border-botanical-300 text-left space-y-1 shadow-2xs"
          >
            <span className="text-xs font-bold text-botanical-800 dark:text-botanical-300 uppercase tracking-wider">पहचाना गया संदेश (Transcribed):</span>
            <p className="text-base font-black text-botanical-950 dark:text-botanical-100">{complaintText}</p>
          </motion.div>
        )}

        {/* Fallback Text Input Toggle */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowKeyboard(!showKeyboard)}
            className="text-xs font-bold text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-1.5 rounded-xl border border-border/80 hover:border-botanical-300 transition-colors"
          >
            <Keyboard className="h-4 w-4 text-botanical-600" />
            <span>{showKeyboard ? "कीबोर्ड छिपाएं" : "लिखकर बताएं (Type with keyboard)"}</span>
          </button>

          {showKeyboard && (
            <textarea
              rows={3}
              value={complaintText}
              onChange={(e) => setComplaintText(e.target.value)}
              placeholder="अपनी समस्या यहाँ लिखें..."
              className="mt-3 w-full p-4 rounded-2xl border border-input focus:border-botanical-500 focus:ring-2 focus:ring-botanical-500/30 text-base font-semibold bg-background transition-all outline-none"
            />
          )}
        </div>

        {/* Quick Tap Choices */}
        <div className="space-y-2 pt-2 text-left">
          <span className="text-xs font-black text-muted-foreground uppercase tracking-wider block">
            या इनमें से एक चुनें (Or quick tap):
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {quickSymptoms.map((sym) => (
              <button
                key={sym.textEn}
                type="button"
                onClick={() => setComplaintText(`${sym.textHi} (${sym.textEn})`)}
                className="min-h-[56px] p-3.5 rounded-2xl border border-border/80 hover:border-botanical-400 bg-background/90 flex items-center gap-3 font-bold text-left hover:bg-botanical-50/50 dark:hover:bg-botanical-950/20 transition-all shadow-2xs active:scale-[0.98]"
              >
                <span className="text-2xl">{sym.icon}</span>
                <div>
                  <div className="text-sm font-extrabold text-foreground leading-tight">{sym.textHi}</div>
                  <div className="text-xs text-muted-foreground">{sym.textEn}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-2">
        <ExtraLargeButton
          variant="secondary"
          size="default"
          icon={<ArrowLeft className="h-5 w-5" />}
          onClick={() => router.back()}
        >
          पीछे (Back)
        </ExtraLargeButton>

        <ExtraLargeButton
          variant="primary"
          size="large"
          disabled={!complaintText}
          icon={<ArrowRight className="h-6 w-6" />}
          onClick={handleContinue}
        >
          आगे बढ़ें (Continue)
        </ExtraLargeButton>
      </div>
    </div>
  );
}
