"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ExtraLargeButton } from "@/components/ui/patient/ExtraLargeButton";
import { AudioPrompt } from "@/components/ui/patient/AudioPrompt";
import {
  Stethoscope,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Flower2,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AyurSetuLogo } from "@/components/shared/AyurSetuLogo";

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

  const isRajasthani = locale === "raj";
  const isHindi = locale === "hi";

  const handleStart = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("ayursetu_intake_mode", selectedMode);
    }
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
      speechText = isRajasthani
        ? "आयुर्वेद परामर्श सा। इण में दशविध परीक्षा, आपरी प्रकृति, विकृति, अग्नि अर दोषां रो पूरो इतिहास लिख्यो जावेगो।"
        : isHindi
        ? "आयुर्वेद परामर्श। इसमें दशविध परीक्षा, आपकी प्रकृति, विकृति, अग्नि और दोषों का समग्र इतिहास दर्ज किया जाएगा।"
        : "Ayurveda Consultation Mode. Classical Dashavidha Pariksha, Prakriti, Agni, and holistic lifestyle assessment.";
    } else {
      speechText = isRajasthani
        ? "सामान्य चिकित्सा परामर्श सा। इण में मुख्य लक्षण, दरद रो ब्यौरो अर पुरानी परचियां जांची जावेगी।"
        : isHindi
        ? "सामान्य चिकित्सा परामर्श। इसमें मानक लक्षण, दर्द का इतिहास और पुरानी पर्चियों की जांच की जाएगी।"
        : "General Clinical Mode. Standard SOCRATES symptom history, pain triage, and medical records.";
    }

    speakWithIndianVoice(
      speechText,
      isRajasthani ? "raj" : isHindi ? "hi" : "en",
      () => setPlayingCard(null),
      () => setPlayingCard(null)
    );
  };

  const modes = [
    {
      id: "AYURVEDA" as const,
      icon: <Flower2 className="h-6 w-6" />,
      iconBg: "bg-gradient-to-br from-botanical-600 to-botanical-800",
      cardSelected: "shadow-[0_8px_32px_-4px_rgba(29,106,83,0.22),inset_0_1px_2px_rgba(255,255,255,0.95)] border-botanical-400/70",
      cardBase: "hover:shadow-[0_4px_20px_-4px_rgba(29,106,83,0.15)]",
      selectedRing: "ring-2 ring-botanical-400/40",
      badgeBg: "bg-botanical-100 dark:bg-botanical-950/60 text-botanical-800 dark:text-botanical-300 border-botanical-300/60",
      labelColor: "text-botanical-700 dark:text-botanical-300",
      badge: isRajasthani ? "मंत्रालय अनुशंसित" : isHindi ? "मंत्रालय अनुशंसित" : "Ministry Recommended",
      title: isRajasthani ? "आयुर्वेद परामर्श (AYUSH)" : isHindi ? "आयुर्वेद परामर्श (AYUSH)" : "Ayurveda (AYUSH) Mode",
      desc: isRajasthani
        ? "दशविध परीक्षा, प्रकृति-विकृति अर अग्नि-दोष आधारित पूरो इतिहास।"
        : isHindi
        ? "दशविध परीक्षा, प्रकृति-विकृति व अग्नि-दोष आधारित समग्र इतिहास।"
        : "Classical Dashavidha Pariksha, Prakriti, Agni, and Dosha dynamics.",
    },
    {
      id: "GENERAL" as const,
      icon: <Stethoscope className="h-6 w-6" />,
      iconBg: "bg-gradient-to-br from-slate-600 to-forest",
      cardSelected: "shadow-[0_8px_32px_-4px_rgba(15,29,26,0.18),inset_0_1px_2px_rgba(255,255,255,0.95)] border-slate-400/70",
      cardBase: "hover:shadow-[0_4px_20px_-4px_rgba(15,29,26,0.12)]",
      selectedRing: "ring-2 ring-slate-400/40",
      badgeBg: "bg-slate-100 dark:bg-forest-card text-slate-700 dark:text-slate-300 border-slate-300/60",
      labelColor: "text-slate-700 dark:text-slate-300",
      badge: isRajasthani ? "सामान्य चिकित्सा" : isHindi ? "आधुनिक चिकित्सा" : "Modern Clinical",
      title: isRajasthani ? "सामान्य चिकित्सा (General)" : isHindi ? "सामान्य चिकित्सा (General)" : "General Clinical Mode",
      desc: isRajasthani
        ? "मानक लक्षण जांच, दरद रो ब्यौरो अर पुरानी परचियां।"
        : isHindi
        ? "मानक लक्षण ट्राइएज, दर्द इतिहास और पुराने नुस्खे।"
        : "Standard SOCRATES pain history, symptom triage, and medical records.",
    },
  ] as const;

  return (
    <div className="max-w-xl mx-auto space-y-7">
      {/* Audio Prompt */}
      <AudioPrompt
        locale={locale}
        hindiText={
          isRajasthani
            ? "आयुर्वेद अर सामान्य चिकित्सा जांच में आपरो घणो स्वागत है सा। कृपा कर आपरी परामर्श री पद्धति चुणो।"
            : isHindi
            ? "आयुर्वेद व सामान्य चिकित्सा परामर्श में आपका स्वागत है। कृपया अपनी परामर्श पद्धति चुनें।"
            : undefined
        }
        text={
          isRajasthani || isHindi
            ? "Welcome to AyurSetu clinical consultation."
            : "Welcome to AyurSetu clinical consultation. Please select your preferred consultation mode."
        }
      />

      {/* Header */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <AyurSetuLogo size="md" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full gov-badge text-[11px] font-black uppercase tracking-wider text-botanical-800 dark:text-botanical-300 border border-botanical-200/60 dark:border-botanical-800/40 shadow-2xs">
          <Sparkles className="h-3.5 w-3.5 text-botanical-600" />
          {isRajasthani || isHindi ? "अखिल भारतीय आयुर्वेद संस्थान (AIIA)" : "All India Institute of Ayurveda (AIIA)"}
        </div>
        <h1 className="text-[28px] sm:text-[34px] font-black text-foreground tracking-tight leading-tight">
          {isRajasthani ? "रोगी परामर्श सेवा" : isHindi ? "रोगी परामर्श सेवा" : "Patient Consultation"}
        </h1>
        <p className="text-[13px] text-muted-foreground font-medium leading-relaxed max-w-sm mx-auto">
          {isRajasthani
            ? "आपरी जांच रो तरीको चुण'र परामर्श शुरू करो सा।"
            : isHindi
            ? "अपनी नैदानिक परामर्श पद्धति चुनकर परामर्श आरंभ करें।"
            : "Choose your clinical consultation mode to begin your adaptive case-taking."}
        </p>
      </div>

      {/* Mode selection cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {modes.map((mode) => {
          const isSelected = selectedMode === mode.id;
          const isPlayingThis = playingCard === mode.id;

          return (
            <motion.div
              key={mode.id}
              whileTap={{ scale: 0.985 }}
              onClick={() => setSelectedMode(mode.id)}
              className={`
                relative p-5 rounded-2xl cursor-pointer transition-all duration-300
                ${isSelected
                  ? `clay-white ${mode.cardSelected} ${mode.selectedRing}`
                  : `bg-white/70 dark:bg-slate-900/60 border border-white/80 dark:border-white/08 shadow-glass-sm ${mode.cardBase}`
                }
              `}
            >
              {/* Selected check */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute top-3 right-3"
                  >
                    <CheckCircle2 className={`h-5 w-5 ${mode.labelColor}`} strokeWidth={2.5} />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-3">
                {/* Icon + audio */}
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-2xl ${mode.iconBg} flex items-center justify-center text-white shadow-sm`}>
                    {mode.icon}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleSpeakCard(e, mode.id)}
                    aria-label={`Listen to ${mode.id} mode explanation`}
                    className="w-9 h-9 rounded-xl bg-muted hover:bg-muted/80 flex items-center justify-center border border-border transition-all active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {isPlayingThis ? (
                      <VolumeX className="h-4 w-4 text-red-500 animate-pulse" />
                    ) : (
                      <Volume2 className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>

                {/* Text */}
                <div>
                  <span className={`inline-block text-[10px] font-black uppercase tracking-wider mb-1.5 ${mode.labelColor}`}>
                    {mode.badge}
                  </span>
                  <h3 className="text-[15px] font-extrabold text-foreground leading-tight mb-1">
                    {mode.title}
                  </h3>
                  <p className="text-[12px] text-muted-foreground font-medium leading-relaxed">
                    {mode.desc}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* CTA */}
      <div>
        <ExtraLargeButton
          variant="primary"
          size="large"
          className="w-full"
          icon={<ArrowRight className="h-5 w-5" />}
          onClick={handleStart}
        >
          {isHindi ? "परामर्श शुरू करें" : "Start Consultation"}
        </ExtraLargeButton>

        <p className="text-center text-[11px] text-muted-foreground font-medium mt-3 flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
          {isHindi ? "ABDM / ABHA सुरक्षित · एंड-टू-एंड एन्क्रिप्टेड" : "ABDM / ABHA Secured · End-to-End Encrypted"}
        </p>
      </div>
    </div>
  );
}
