"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ConsentTemplates } from "@/lib/consent/service";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Volume2, ShieldCheck, CheckSquare, AlertCircle, FileCheck, Check } from "lucide-react";

import { speakWithIndianVoice } from "@/lib/voice/tts";

export default function PatientConsentPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const router = useRouter();
  const [selectedLang, setSelectedLang] = useState<"hi" | "en" | "raj">(
    locale === "raj" ? "raj" : locale === "hi" ? "hi" : "en"
  );
  const [agreedPurposes, setAgreedPurposes] = useState<Record<string, boolean>>({
    HISTORY_TAKING: true,
    DOCUMENT_OCR: true,
    DOCTOR_SHARING: true,
    ABDM_EXCHANGE: true,
  });
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const template = ConsentTemplates[selectedLang] || ConsentTemplates.raj || ConsentTemplates.hi;

  const handleTogglePurpose = (key: string) => {
    setAgreedPurposes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePlayAudio = () => {
    setIsPlayingAudio(true);
    const spoken = speakWithIndianVoice(
      template.explanation,
      selectedLang,
      () => setIsPlayingAudio(false),
      () => setIsPlayingAudio(false)
    );

    if (!spoken) {
      setTimeout(() => setIsPlayingAudio(false), 4000);
    }
  };

  const handleGrantConsent = async () => {
    setIsSubmitting(true);
    try {
      // In Next.js client, read search params if available or default to AYURVEDA
      const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const mode = urlParams?.get("mode") || (typeof window !== "undefined" ? sessionStorage.getItem("ayursetu_intake_mode") : null) || "AYURVEDA";
      if (typeof window !== "undefined") {
        sessionStorage.setItem("ayursetu_intake_mode", mode);
      }
      router.push(`/${selectedLang}/patient/complaint?mode=${mode}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const labels = {
    hi: {
      badge: "आयुष्मान भारत डिजिटल मिशन (ABDM) सहमति प्रबंधक v1.0",
      voiceTitle: "आवाज में सुनें (Voice Explanation)",
      voiceSubtitle: "सहमति की शर्तें हिंदी में सुनने के लिए बटन दबाएं।",
      play: "ऑडियो सुनें (Play Audio)",
      playing: "ऑडियो चल रहा है (Playing...)",
      purposeTitle: "सहमति के उद्देश्य (Consent Purposes):",
      back: "रद्द करें / पीछे (Back)",
      submitting: "सहमति दर्ज हो रही है...",
    },
    raj: {
      badge: "आयुष्मान भारत डिजिटल मिशन (ABDM) सहमति प्रबंधक v1.0",
      voiceTitle: "आवाज में सुणो (Voice Explanation)",
      voiceSubtitle: "सहमति री शर्तां राजस्थानी में सुणन खातर बटन दाबो सा।",
      play: "आवाज सुणो (Play Audio)",
      playing: "आवाज चाल री है...",
      purposeTitle: "सहमति रा उद्देश्य (Consent Purposes):",
      back: "रद्द करो / पाछै (Back)",
      submitting: "सहमति लिखीज री है...",
    },
    en: {
      badge: "ABDM Consent Manager (v1.0)",
      voiceTitle: "Voice Explanation / Listen to Audio",
      voiceSubtitle: "Listen to the consent terms read out in clear Indian English.",
      play: "Play Audio",
      playing: "Playing Audio...",
      purposeTitle: "Consent Purposes:",
      back: "Cancel / Back",
      submitting: "Recording Consent...",
    },
  }[selectedLang];

  return (
    <div className="container max-w-3xl py-10 space-y-6">
      <Card className="border border-botanical-200/80 dark:border-botanical-800/40 shadow-glass-precision rounded-3xl overflow-hidden bg-card">
        <CardHeader className="bg-gradient-to-r from-botanical-50/90 to-transparent dark:from-botanical-950/30 border-b border-border/80 pb-6 px-6 sm:px-8">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-full bg-botanical-100 text-botanical-800 dark:bg-botanical-950 dark:text-botanical-300 border border-botanical-200">
              <ShieldCheck className="h-3.5 w-3.5 text-botanical-600" /> {labels.badge}
            </span>
            <CardTitle className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">{template.title}</CardTitle>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6 px-6 sm:px-8">
          {/* Audio explanation banner */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-botanical-50/60 dark:bg-botanical-950/20 border border-botanical-200/70 dark:border-botanical-800/40 shadow-2xs">
            <div className="space-y-0.5">
              <p className="text-sm font-bold text-foreground">{labels.voiceTitle}</p>
              <p className="text-xs text-muted-foreground">{labels.voiceSubtitle}</p>
            </div>
            <Button
              variant="outline"
              onClick={handlePlayAudio}
              aria-label={labels.play}
              className="flex items-center gap-2 border-botanical-300 min-h-[44px] rounded-xl hover:bg-botanical-100/60"
            >
              <Volume2 className={`h-4 w-4 ${isPlayingAudio ? "text-botanical-600 animate-bounce" : "text-botanical-700"}`} />
              <span className="text-xs font-bold text-foreground">{isPlayingAudio ? labels.playing : labels.play}</span>
            </Button>
          </div>

          <p className="text-sm leading-relaxed text-foreground bg-slate-50/80 dark:bg-forest-card/50 p-4 rounded-2xl border border-border/70">
            {template.explanation}
          </p>

          {/* Granular Purpose Checkboxes */}
          <div className="space-y-3">
            <h4 className="text-sm font-black tracking-tight text-foreground">{labels.purposeTitle}</h4>
            <div className="grid gap-2.5">
              {Object.entries(template.purposes).map(([key, label]) => {
                const isChecked = agreedPurposes[key];
                return (
                  <div
                    key={key}
                    onClick={() => handleTogglePurpose(key)}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 ${
                      isChecked
                        ? "bg-botanical-50/60 dark:bg-botanical-950/30 border-botanical-300 shadow-2xs"
                        : "bg-background border-input opacity-70 hover:opacity-100"
                    }`}
                  >
                    <div
                      className={`h-5 w-5 rounded-lg flex items-center justify-center border mt-0.5 transition-colors ${
                        isChecked
                          ? "bg-botanical-600 border-botanical-600 text-white shadow-2xs"
                          : "border-input bg-background"
                      }`}
                    >
                      {isChecked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </div>
                    <span className="text-sm font-semibold text-foreground leading-snug">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-between border-t border-border/80 pt-6 px-6 sm:px-8 bg-muted/20">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="w-full sm:w-auto min-h-[46px] rounded-xl font-bold"
          >
            {labels.back}
          </Button>
          <Button
            variant="ayush"
            size="lg"
            onClick={handleGrantConsent}
            disabled={isSubmitting || !Object.values(agreedPurposes).some(Boolean)}
            className="w-full sm:w-auto min-h-[48px] rounded-xl flex items-center gap-2 font-black shadow-md hover:shadow-botanical-glow"
          >
            <FileCheck className="h-5 w-5" />
            <span>{isSubmitting ? labels.submitting : template.acceptButton}</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
