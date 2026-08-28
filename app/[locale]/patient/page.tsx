"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ExtraLargeButton } from "@/components/ui/patient/ExtraLargeButton";
import { AudioPrompt } from "@/components/ui/patient/AudioPrompt";
import { Card } from "@/components/ui/card";
import { Stethoscope, Sparkles, ArrowRight, ShieldCheck, HeartPulse, User, Flower2 } from "lucide-react";
import { motion } from "framer-motion";

export default function PatientLauncherPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState<"GENERAL" | "AYURVEDA">("AYURVEDA");

  const handleStart = () => {
    router.push(`/${locale}/patient/consent?mode=${selectedMode}`);
  };

  const isHindi = locale === "hi";

  return (
    <div className="space-y-8 text-center max-w-xl mx-auto py-4">
      <AudioPrompt
        hindiText={isHindi ? "आयुर्वेद व सामान्य चिकित्सा परामर्श में आपका स्वागत है। कृपया अपनी परामर्श पद्धति चुनें।" : undefined}
        text="Welcome to AyurSetu clinical consultation. Please select your preferred consultation mode."
      />

      <div className="space-y-3">
        <span className="text-xs font-extrabold px-4 py-1.5 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 rounded-full inline-flex items-center gap-1.5 shadow-xs border border-emerald-300">
          <Sparkles className="h-4 w-4 text-emerald-600" /> SIH 2026 • {isHindi ? "अखिल भारतीय आयुर्वेद संस्थान (AIIA)" : "All India Institute of Ayurveda (AIIA)"}
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
          {isHindi ? "रोगी परामर्श सेवा (Patient Case-Taking)" : "Patient Consultation (Case-Taking)"}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground font-medium">
          {isHindi
            ? "अपनी नैदानिक परामर्श पद्धति चुनकर परामर्श आरंभ करें।"
            : "Choose your clinical consultation mode to begin your adaptive case-taking."}
        </p>
      </div>

      {/* Mode Selection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-2">
        {/* Ayurveda Mode */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          type="button"
          onClick={() => setSelectedMode("AYURVEDA")}
          className={`p-5 rounded-3xl border-3 transition-all flex flex-col justify-between shadow-sm relative ${
            selectedMode === "AYURVEDA"
              ? "bg-emerald-50/80 border-ayush-green ring-4 ring-emerald-300 dark:bg-emerald-950/30"
              : "bg-card border-input hover:border-emerald-400"
          }`}
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-inner">
              <Flower2 className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-800 uppercase block">मंत्रालय अनुशंसित</span>
              <h3 className="text-lg font-extrabold text-foreground">आयुर्वेद परामर्श (AYUSH)</h3>
              <p className="text-xs text-muted-foreground font-medium mt-1">
                दशविध परीक्षा, प्रकृति-विकृति व अग्नि-दोष आधारित समग्र इतिहास।
              </p>
            </div>
          </div>
          {selectedMode === "AYURVEDA" && (
            <div className="mt-4 flex items-center gap-1 text-xs font-extrabold text-emerald-700">
              <ShieldCheck className="h-4 w-4" /> चयनित (Active Mode)
            </div>
          )}
        </motion.button>

        {/* General Clinical Mode */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          type="button"
          onClick={() => setSelectedMode("GENERAL")}
          className={`p-5 rounded-3xl border-3 transition-all flex flex-col justify-between shadow-sm relative ${
            selectedMode === "GENERAL"
              ? "bg-emerald-50/80 border-ayush-green ring-4 ring-emerald-300 dark:bg-emerald-950/30"
              : "bg-card border-input hover:border-emerald-400"
          }`}
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center shadow-inner">
              <Stethoscope className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-blue-800 uppercase block">Modern Clinical</span>
              <h3 className="text-lg font-extrabold text-foreground">सामान्य चिकित्सा (General)</h3>
              <p className="text-xs text-muted-foreground font-medium mt-1">
                Standard SOCRATES pain history, symptom triage, and medical records.
              </p>
            </div>
          </div>
          {selectedMode === "GENERAL" && (
            <div className="mt-4 flex items-center gap-1 text-xs font-extrabold text-emerald-700">
              <ShieldCheck className="h-4 w-4" /> चयनित (Active Mode)
            </div>
          )}
        </motion.button>
      </div>

      {/* Primary Action Button */}
      <div className="pt-4">
        <ExtraLargeButton
          variant="primary"
          size="large"
          className="w-full shadow-xl"
          icon={<ArrowRight className="h-6 w-6" />}
          onClick={handleStart}
        >
          परामर्श शुरू करें (Start Consultation)
        </ExtraLargeButton>
      </div>
    </div>
  );
}
