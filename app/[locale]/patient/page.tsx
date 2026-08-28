"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ExtraLargeButton } from "@/components/ui/patient/ExtraLargeButton";
import { AudioPrompt } from "@/components/ui/patient/AudioPrompt";
import { Card } from "@/components/ui/card";
import { Stethoscope, Sparkles, ArrowRight, ShieldCheck, HeartPulse, User, Flower2 } from "lucide-react";
import { motion } from "framer-motion";

import { speakWithIndianVoice } from "@/lib/voice/tts";
import { Volume2, VolumeX } from "lucide-react";

export default function PatientLauncherPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState<"GENERAL" | "AYURVEDA">("AYURVEDA");
  const [playingCard, setPlayingCard] = useState<"AYURVEDA" | "GENERAL" | null>(null);

  const isHindi = locale === "hi";

  const handleStart = () => {
    router.push(`/${locale}/patient/consent?mode=${selectedMode}`);
  };

  const handleSpeakCard = (e: React.MouseEvent, mode: "AYURVEDA" | "GENERAL") => {
    e.stopPropagation();

    if (playingCard === mode) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setPlayingCard(null);
      return;
    }

    setPlayingCard(mode);

    let speechText = "";
    if (mode === "AYURVEDA") {
      speechText = isHindi
        ? "आयुर्वेद परामर्श। इसमें दशविध परीक्षा, आपकी प्रकृति, विकृति, अग्नि और दोषों का समग्र इतिहास दर्ज किया जाएगा।"
        : "Ayurveda Consultation Mode. Classical Dashavidha Pariksha, Prakriti, Agni, and holistic lifestyle assessment.";
    } else {
      speechText = isHindi
        ? "सामान्य चिकित्सा परामर्श। इसमें मानक लक्षण, दर्द का इतिहास और पुरानी पर्चियों की जांच की जाएगी।"
        : "General Clinical Mode. Standard SOCRATES symptom history, pain triage, and medical records.";
    }

    speakWithIndianVoice(
      speechText,
      isHindi ? "hi" : "en",
      () => setPlayingCard(null),
      () => setPlayingCard(null)
    );
  };

  return (
    <div className="space-y-8 text-center max-w-xl mx-auto py-4">
      <AudioPrompt
        hindiText={isHindi ? "आयुर्वेद व सामान्य चिकित्सा परामर्श में आपका स्वागत है। कृपया अपनी परामर्श पद्धति चुनें।" : undefined}
        text={isHindi ? "Welcome to AyurSetu clinical consultation." : "Welcome to AyurSetu clinical consultation. Please select your preferred consultation mode."}
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
        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={() => setSelectedMode("AYURVEDA")}
          className={`p-5 rounded-3xl border-3 transition-all flex flex-col justify-between shadow-sm relative cursor-pointer ${
            selectedMode === "AYURVEDA"
              ? "bg-emerald-50/80 border-ayush-green ring-4 ring-emerald-300 dark:bg-emerald-950/30"
              : "bg-card border-input hover:border-emerald-400"
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-inner">
                <Flower2 className="h-6 w-6" />
              </div>
              <button
                type="button"
                onClick={(e) => handleSpeakCard(e, "AYURVEDA")}
                aria-label="Listen to Ayurveda mode explanation"
                className="w-10 h-10 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 flex items-center justify-center border border-emerald-300 transition-all active:scale-95"
              >
                {playingCard === "AYURVEDA" ? (
                  <VolumeX className="h-5 w-5 text-rose-600 animate-pulse" />
                ) : (
                  <Volume2 className="h-5 w-5 text-emerald-800" />
                )}
              </button>
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-800 uppercase block">
                {isHindi ? "मंत्रालय अनुशंसित" : "Ministry Recommended"}
              </span>
              <h3 className="text-lg font-extrabold text-foreground">
                {isHindi ? "आयुर्वेद परामर्श (AYUSH)" : "Ayurveda (AYUSH) Mode"}
              </h3>
              <p className="text-xs text-muted-foreground font-medium mt-1">
                {isHindi
                  ? "दशविध परीक्षा, प्रकृति-विकृति व अग्नि-दोष आधारित समग्र इतिहास।"
                  : "Classical Dashavidha Pariksha, Prakriti, Agni, and Dosha dynamics."}
              </p>
            </div>
          </div>
          {selectedMode === "AYURVEDA" && (
            <div className="mt-4 flex items-center gap-1 text-xs font-extrabold text-emerald-700">
              <ShieldCheck className="h-4 w-4" /> {isHindi ? "चयनित (Active Mode)" : "Selected Mode"}
            </div>
          )}
        </motion.div>

        {/* General Clinical Mode */}
        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={() => setSelectedMode("GENERAL")}
          className={`p-5 rounded-3xl border-3 transition-all flex flex-col justify-between shadow-sm relative cursor-pointer ${
            selectedMode === "GENERAL"
              ? "bg-emerald-50/80 border-ayush-green ring-4 ring-emerald-300 dark:bg-emerald-950/30"
              : "bg-card border-input hover:border-emerald-400"
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center shadow-inner">
                <Stethoscope className="h-6 w-6" />
              </div>
              <button
                type="button"
                onClick={(e) => handleSpeakCard(e, "GENERAL")}
                aria-label="Listen to General mode explanation"
                className="w-10 h-10 rounded-xl bg-blue-100 hover:bg-blue-200 text-blue-900 flex items-center justify-center border border-blue-300 transition-all active:scale-95"
              >
                {playingCard === "GENERAL" ? (
                  <VolumeX className="h-5 w-5 text-rose-600 animate-pulse" />
                ) : (
                  <Volume2 className="h-5 w-5 text-blue-800" />
                )}
              </button>
            </div>
            <div>
              <span className="text-xs font-bold text-blue-800 uppercase block">
                {isHindi ? "आधुनिक चिकित्सा" : "Modern Clinical"}
              </span>
              <h3 className="text-lg font-extrabold text-foreground">
                {isHindi ? "सामान्य चिकित्सा (General)" : "General Clinical Mode"}
              </h3>
              <p className="text-xs text-muted-foreground font-medium mt-1">
                {isHindi
                  ? "मानक लक्षण ट्राइएज, दर्द इतिहास और पुराने नुस्खे।"
                  : "Standard SOCRATES pain history, symptom triage, and medical records."}
              </p>
            </div>
          </div>
          {selectedMode === "GENERAL" && (
            <div className="mt-4 flex items-center gap-1 text-xs font-extrabold text-emerald-700">
              <ShieldCheck className="h-4 w-4" /> {isHindi ? "चयनित (Active Mode)" : "Selected Mode"}
            </div>
          )}
        </motion.div>
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
