"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ProgressStepper } from "@/components/ui/patient/ProgressStepper";
import { AudioPrompt } from "@/components/ui/patient/AudioPrompt";
import { VoiceInputButton } from "@/components/ui/patient/VoiceInputButton";
import { IconButton } from "@/components/ui/patient/IconButton";
import { ExtraLargeButton } from "@/components/ui/patient/ExtraLargeButton";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function PatientComplaintPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(["घुटनों में दर्द"]);
  const [transcript, setTranscript] = useState(
    "मुझे ५ दिनों से दोनों घुटनों और जोड़ों में बहुत तेज दर्द है और सुबह जकड़न रहती है।"
  );

  const symptomIcons = [
    { id: "joints", label: "जोड़ों में दर्द", sub: "Joint Pain", icon: "🦴" },
    { id: "stomach", label: "पेट में गैस/दर्द", sub: "Digestion / Gas", icon: "🫄" },
    { id: "head", label: "सिरदर्द / तनाव", sub: "Headache", icon: "🤕" },
    { id: "sleep", label: "नींद न आना", sub: "Insomnia / Sleep", icon: "🥱" },
    { id: "fever", label: "बुखार / भारीपन", sub: "Fever / Malaise", icon: "🌡️" },
    { id: "skin", label: "त्वचा / खुजली", sub: "Skin Issues", icon: "🖐️" },
  ];

  const handleToggleSymptom = (label: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label]
    );
  };

  const handleToggleRecording = () => {
    setIsRecording(!isRecording);
  };

  return (
    <div className="space-y-6">
      <ProgressStepper currentStep={3} />

      <AudioPrompt
        hindiText="अपनी मुख्य समस्या बताएं - आप बोल सकते हैं या नीचे दिए गए विकल्पों को छू सकते हैं।"
        text="Describe your main health issue - you can speak using the mic or tap the symptom cards."
      />

      {/* Big Pulse Voice Recorder */}
      <div className="bg-white dark:bg-card p-6 rounded-3xl border-2 border-border shadow-sm">
        <VoiceInputButton
          isRecording={isRecording}
          onToggleRecording={handleToggleRecording}
          label={isRecording ? "सुन रहे हैं... बोलिए (Listening...)" : "बोलने के लिए दबाएं (Tap to Speak)"}
          sublabel="अपनी भाषा में समस्या विस्तार से बताएं"
        />

        {transcript && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border text-center">
            <span className="text-xs font-bold text-ayush-green block mb-1">पहचाने गए लक्षण (Detected Audio Transcript):</span>
            <p className="text-base font-semibold text-foreground italic">&ldquo;{transcript}&rdquo;</p>
          </div>
        )}
      </div>

      {/* Quick Visual Symptom Touch Cards */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-foreground">
          लक्षण चुनें (Select Symptoms):
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {symptomIcons.map((symptom) => {
            const isSelected = selectedSymptoms.includes(symptom.label);
            return (
              <IconButton
                key={symptom.id}
                icon={symptom.icon}
                label={symptom.label}
                sublabel={symptom.sub}
                active={isSelected}
                onClick={() => handleToggleSymptom(symptom.label)}
              />
            );
          })}
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex justify-between items-center pt-4">
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
          icon={<ArrowRight className="h-6 w-6" />}
          onClick={() => router.push(`/${locale}/patient/questions`)}
        >
          आगे प्रश्न (Next: Questions)
        </ExtraLargeButton>
      </div>
    </div>
  );
}
