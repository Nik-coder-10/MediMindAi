"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ProgressStepper } from "@/components/ui/patient/ProgressStepper";
import { AudioPrompt } from "@/components/ui/patient/AudioPrompt";
import { ExtraLargeButton } from "@/components/ui/patient/ExtraLargeButton";
import { Card } from "@/components/ui/card";
import { ArrowRight, Check } from "lucide-react";
import { motion } from "framer-motion";

export default function PatientLanguagePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const router = useRouter();
  const [selectedLanguage, setSelectedLanguage] = useState<string>(locale || "hi");

  const languageOptions = [
    { code: "hi", title: "हिंदी", sub: "Hindi", icon: "🇮🇳", greeting: "नमस्ते" },
    { code: "raj", title: "राजस्थानी", sub: "Rajasthani (मारवाड़ी / ढूंढाड़ी)", icon: "🐪", greeting: "खम्मा घणी सा" },
    { code: "en", title: "English", sub: "English (India)", icon: "🌐", greeting: "Hello" },
  ];

  const handleContinue = () => {
    router.push(`/${selectedLanguage}/patient/consent`);
  };

  return (
    <div className="space-y-6">
      <ProgressStepper currentStep={1} />

      <AudioPrompt
        hindiText="अपनी पसंदीदा भाषा चुनें और आगे बढ़ें।"
        text="Select your preferred language and press continue."
      />

      <div className="space-y-4">
        <h2 className="text-2xl font-extrabold text-center text-foreground">
          परामर्श की भाषा चुनें (Select Language)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {languageOptions.map((item) => {
            const isSelected = selectedLanguage === item.code;
            return (
              <motion.div
                key={item.code}
                whileTap={{ scale: 0.96 }}
                onClick={() => setSelectedLanguage(item.code)}
                className={`p-6 rounded-3xl border-3 cursor-pointer text-center space-y-2 transition-all min-h-[140px] flex flex-col items-center justify-center ${
                  isSelected
                    ? "bg-ayush-mint border-ayush-green shadow-lg ring-4 ring-emerald-200"
                    : "bg-white dark:bg-card border-border hover:border-ayush-emerald shadow-sm"
                }`}
              >
                <div className="text-4xl">{item.icon}</div>
                <div className="space-y-0.5">
                  <h3 className="text-2xl font-extrabold text-foreground">{item.title}</h3>
                  <p className="text-sm font-semibold text-muted-foreground">{item.sub}</p>
                </div>
                {isSelected && (
                  <div className="w-8 h-8 rounded-full bg-ayush-green text-white flex items-center justify-center mt-2">
                    <Check className="h-5 w-5 stroke-[3]" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <ExtraLargeButton
          variant="primary"
          size="large"
          className="w-full sm:w-auto"
          icon={<ArrowRight className="h-6 w-6" />}
          onClick={handleContinue}
        >
          आगे बढ़ें (Continue to Consent)
        </ExtraLargeButton>
      </div>
    </div>
  );
}
