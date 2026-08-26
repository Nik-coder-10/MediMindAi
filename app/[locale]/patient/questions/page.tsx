"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ProgressStepper } from "@/components/ui/patient/ProgressStepper";
import { AudioPrompt } from "@/components/ui/patient/AudioPrompt";
import { ExtraLargeButton } from "@/components/ui/patient/ExtraLargeButton";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Check, X, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function PatientQuestionsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const adaptiveQuestions = [
    {
      id: 1,
      textHi: "क्या भारी या चिकना भोजन करने के बाद जोड़ों का दर्द और पेट भारी हो जाता है?",
      textEn: "Does your joint pain and abdominal heaviness worsen after heavy/oily meals?",
      category: "अग्नि एवं आम परीक्षण (Agni & Ama Assessment)",
    },
    {
      id: 2,
      textHi: "क्या सुबह उठने पर जोड़ों में १ घंटे से अधिक जकड़न (Stiffness) रहती है?",
      textEn: "Do you experience joint stiffness for more than 1 hour upon waking up in morning?",
      category: "आमवात लक्षण (Rheumatoid / Amavata Sign)",
    },
    {
      id: 3,
      textHi: "क्या आपको भूख सामान्य से बहुत कम लग रही है?",
      textEn: "Is your appetite noticeably reduced compared to normal?",
      category: "अग्निमांद्य (Appetite / Digestive Fire)",
    },
  ];

  const question = adaptiveQuestions[currentQuestionIndex];
  const selectedAnswer = answers[currentQuestionIndex];

  const handleAnswer = (choice: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestionIndex]: choice }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < adaptiveQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      router.push(`/${locale}/patient/documents`);
    }
  };

  return (
    <div className="space-y-6">
      <ProgressStepper currentStep={4} />

      <AudioPrompt
        hindiText={question.textHi}
        text={question.textEn}
      />

      {/* Active Question Box */}
      <Card className="border-3 border-emerald-300 shadow-md p-6 sm:p-8 rounded-3xl bg-white dark:bg-card space-y-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <span>प्रश्न {currentQuestionIndex + 1} / {adaptiveQuestions.length}</span> • <span>{question.category}</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground leading-snug">
          {question.textHi}
        </h2>
        <p className="text-base text-muted-foreground font-medium">
          {question.textEn}
        </p>

        {/* Large Touch Answer Choices (Zero Training) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 max-w-xl mx-auto">
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => handleAnswer("हाँ")}
            className={`min-h-[72px] rounded-2xl border-3 flex items-center justify-center gap-3 font-extrabold text-xl transition-all shadow-md ${
              selectedAnswer === "हाँ"
                ? "bg-emerald-600 text-white border-emerald-700 ring-4 ring-emerald-300"
                : "bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100"
            }`}
          >
            <Check className="h-7 w-7 stroke-[3]" />
            <span>हाँ (Yes)</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => handleAnswer("नहीं")}
            className={`min-h-[72px] rounded-2xl border-3 flex items-center justify-center gap-3 font-extrabold text-xl transition-all shadow-md ${
              selectedAnswer === "नहीं"
                ? "bg-rose-600 text-white border-rose-700 ring-4 ring-rose-300"
                : "bg-rose-50 text-rose-900 border-rose-200 hover:bg-rose-100"
            }`}
          >
            <X className="h-7 w-7 stroke-[3]" />
            <span>नहीं (No)</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => handleAnswer("पता नहीं")}
            className={`min-h-[72px] rounded-2xl border-3 flex items-center justify-center gap-3 font-extrabold text-lg transition-all shadow-md ${
              selectedAnswer === "पता नहीं"
                ? "bg-slate-700 text-white border-slate-900 ring-4 ring-slate-400"
                : "bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200"
            }`}
          >
            <HelpCircle className="h-6 w-6" />
            <span>पता नहीं (Not sure)</span>
          </motion.button>
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-4">
        <ExtraLargeButton
          variant="secondary"
          size="default"
          icon={<ArrowLeft className="h-5 w-5" />}
          onClick={() => {
            if (currentQuestionIndex > 0) setCurrentQuestionIndex(currentQuestionIndex - 1);
            else router.back();
          }}
        >
          पीछे (Back)
        </ExtraLargeButton>

        <ExtraLargeButton
          variant="primary"
          size="large"
          icon={<ArrowRight className="h-6 w-6" />}
          onClick={handleNext}
        >
          {currentQuestionIndex < adaptiveQuestions.length - 1 ? "अगला प्रश्न (Next)" : "पर्ची अपलोड (Next: Documents)"}
        </ExtraLargeButton>
      </div>
    </div>
  );
}
