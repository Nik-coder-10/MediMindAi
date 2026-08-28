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
  const [selectedLang, setSelectedLang] = useState<"hi" | "en">(
    locale === "hi" ? "hi" : "en"
  );
  const [agreedPurposes, setAgreedPurposes] = useState<Record<string, boolean>>({
    HISTORY_TAKING: true,
    DOCUMENT_OCR: true,
    DOCTOR_SHARING: true,
    ABDM_EXCHANGE: true,
  });
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const template = ConsentTemplates[selectedLang] || ConsentTemplates.hi;

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
      const mode = urlParams?.get("mode") || "AYURVEDA";
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
      <Card className="border-2 border-emerald-500/30 shadow-lg">
        <CardHeader className="bg-emerald-50/50 dark:bg-emerald-950/20 border-b pb-6">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
              <ShieldCheck className="h-3.5 w-3.5" /> {labels.badge}
            </span>
            <CardTitle className="text-2xl font-bold">{template.title}</CardTitle>
          </div>
        </CardHeader>


        <CardContent className="space-y-6 pt-6">
          {/* Audio explanation banner */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/60 border">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold">{labels.voiceTitle}</p>
              <p className="text-xs text-muted-foreground">{labels.voiceSubtitle}</p>
            </div>
            <Button
              variant="outline"
              onClick={handlePlayAudio}
              aria-label={labels.play}
              className="flex items-center gap-2 border-emerald-300 min-h-[44px]"
            >
              <Volume2 className={`h-4 w-4 ${isPlayingAudio ? "text-emerald-600 animate-bounce" : ""}`} />
              <span className="text-xs font-bold">{isPlayingAudio ? labels.playing : labels.play}</span>
            </Button>
          </div>

          <p className="text-sm leading-relaxed text-foreground bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border">
            {template.explanation}
          </p>

          {/* Granular Purpose Checkboxes */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold tracking-tight">{labels.purposeTitle}</h4>
            <div className="grid gap-3">
              {Object.entries(template.purposes).map(([key, label]) => {
                const isChecked = agreedPurposes[key];
                return (
                  <div
                    key={key}
                    onClick={() => handleTogglePurpose(key)}
                    className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                      isChecked ? "bg-emerald-50/40 border-emerald-300" : "bg-background border-input opacity-70"
                    }`}
                  >
                    <div
                      className={`h-5 w-5 rounded flex items-center justify-center border mt-0.5 ${
                        isChecked ? "bg-emerald-600 border-emerald-600 text-white" : "border-input"
                      }`}
                    >
                      {isChecked && <Check className="h-3.5 w-3.5" />}
                    </div>
                    <span className="text-sm font-medium text-foreground">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-between border-t pt-6 bg-muted/20">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="w-full sm:w-auto"
          >
            {labels.back}
          </Button>
          <Button
            variant="ayush"
            size="lg"
            onClick={handleGrantConsent}
            disabled={isSubmitting || !Object.values(agreedPurposes).some(Boolean)}
            className="w-full sm:w-auto flex items-center gap-2"
          >
            <FileCheck className="h-5 w-5" />
            <span>{isSubmitting ? labels.submitting : template.acceptButton}</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
