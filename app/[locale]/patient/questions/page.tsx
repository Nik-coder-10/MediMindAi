"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProgressStepper } from "@/components/ui/patient/ProgressStepper";
import { AudioPrompt } from "@/components/ui/patient/AudioPrompt";
import { ExtraLargeButton } from "@/components/ui/patient/ExtraLargeButton";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, AlertTriangle, Check, HelpCircle, PauseCircle, PlayCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { EngineQuestionDefinition, QuestionOption } from "@/lib/engine/types";

export default function AdaptiveQuestionsFlowPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const router = useRouter();
  const [sessionId] = useState<string>("sess-demo-001");
  const [currentQuestion, setCurrentQuestion] = useState<EngineQuestionDefinition | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [redFlagBanner, setRedFlagBanner] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stepNumber, setStepNumber] = useState(1);

  // Initial question load
  useEffect(() => {
    async function initEngine() {
      setLoading(true);
      try {
        const res = await fetch("/api/patient/session/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            chiefComplaint: "छाती में दर्द (Chest pain since last night)",
          }),
        });
        const data = await res.json();
        if (data.data?.firstQuestion) {
          setCurrentQuestion(data.data.firstQuestion);
        }
      } catch {
        // Fallback default node
        setCurrentQuestion({
          nodeCode: "CP_SEVERITY",
          chiefComplaintCategory: "CHEST_PAIN",
          clinicalDomain: "SOCRATES_SEVERITY",
          questionText: "On a scale of 1 to 10, how severe is your chest pain?",
          questionTextHindi: "१ से १० के पैमाने पर, आपकी छाती का दर्द कितना तीव्र है?",
          questionType: "SINGLE_CHOICE",
          options: [
            { value: "MILD_1_3", labelHi: "हल्का (१ से ३)", labelEn: "Mild (1-3)" },
            { value: "MODERATE_4_6", labelHi: "मध्यम (४ से ६)", labelEn: "Moderate (4-6)" },
            { value: "SEVERE_7_10", labelHi: "अत्यधिक तेज (७ से १०)", labelEn: "Severe (7-10)" },
          ],
        });
      } finally {
        setLoading(false);
      }
    }

    initEngine();
  }, [sessionId]);

  const handleSelectOption = (option: QuestionOption) => {
    setSelectedAnswer(option.value);
  };

  const handleNextQuestion = async () => {
    if (!currentQuestion || !selectedAnswer) return;
    setLoading(true);

    try {
      const res = await fetch("/api/patient/conversation/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          nodeCode: currentQuestion.nodeCode,
          answerValue: selectedAnswer,
        }),
      });
      const data = await res.json();

      if (data.data?.redFlagAlert) {
        setRedFlagBanner(data.data.redFlagAlert.description);
      }

      if (data.data?.nextQuestion) {
        setCurrentQuestion(data.data.nextQuestion);
        setSelectedAnswer(null);
        setStepNumber((prev) => prev + 1);
      } else {
        router.push(`/${locale}/patient/documents`);
      }
    } catch {
      router.push(`/${locale}/patient/documents`);
    } finally {
      setLoading(false);
    }
  };

  if (isPaused) {
    return (
      <div className="container max-w-xl py-12 text-center space-y-6">
        <Card className="p-8 rounded-3xl border-2 border-amber-300 bg-amber-50/50 space-y-4">
          <PauseCircle className="h-16 w-16 text-amber-600 mx-auto" />
          <h2 className="text-2xl font-extrabold text-amber-950">सत्र रोका गया है (Session Paused)</h2>
          <p className="text-sm font-medium text-muted-foreground">
            Your answers have been saved. You can resume anytime without losing progress.
          </p>
          <ExtraLargeButton
            variant="primary"
            size="large"
            className="w-full"
            icon={<PlayCircle className="h-6 w-6" />}
            onClick={() => setIsPaused(false)}
          >
            जारी रखें (Resume Session)
          </ExtraLargeButton>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProgressStepper currentStep={4} />

      {/* Red Flag Alert Banner */}
      <AnimatePresence>
        {redFlagBanner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-2xl bg-rose-100 border-2 border-rose-400 text-rose-900 flex items-start gap-3 shadow-md"
          >
            <AlertTriangle className="h-6 w-6 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-extrabold text-sm uppercase">चिकित्सीय चेतावनी (Clinical Alert)</span>
              <p className="text-sm font-semibold">{redFlagBanner}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {currentQuestion && (
        <>
          <AudioPrompt
            hindiText={currentQuestion.questionTextHindi}
            text={currentQuestion.questionText}
          />

          <Card className="border-3 border-emerald-300 shadow-md p-6 sm:p-8 rounded-3xl bg-white dark:bg-card space-y-6 text-center">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                अडेप्टिव प्रश्न {stepNumber} • {currentQuestion.chiefComplaintCategory}
              </span>
              <button
                type="button"
                onClick={() => setIsPaused(true)}
                className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 min-h-[40px] px-2"
              >
                <PauseCircle className="h-4 w-4" />
                <span>रोकें (Pause)</span>
              </button>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground leading-snug">
                {currentQuestion.questionTextHindi}
              </h2>
              <p className="text-base text-muted-foreground font-medium">
                {currentQuestion.questionText}
              </p>
            </div>

            {/* Answer Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto pt-2">
              {currentQuestion.options?.map((opt) => {
                const isSelected = selectedAnswer === opt.value;
                return (
                  <motion.button
                    key={opt.value}
                    whileTap={{ scale: 0.96 }}
                    type="button"
                    onClick={() => handleSelectOption(opt)}
                    className={`min-h-[64px] p-4 rounded-2xl border-3 flex items-center justify-between text-left font-bold transition-all shadow-sm ${
                      isSelected
                        ? "bg-ayush-mint border-ayush-green text-ayush-green ring-4 ring-emerald-300 shadow-md"
                        : "bg-background border-input hover:border-ayush-emerald text-foreground"
                    }`}
                  >
                    <div>
                      <div className="text-base font-extrabold">{opt.labelHi}</div>
                      <div className="text-xs text-muted-foreground">{opt.labelEn}</div>
                    </div>
                    {isSelected && (
                      <div className="w-7 h-7 rounded-full bg-ayush-green text-white flex items-center justify-center">
                        <Check className="h-4 w-4 stroke-[3]" />
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* "I don't know / Skip" Option */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedAnswer("NOT_SURE");
                  handleNextQuestion();
                }}
                className="text-sm font-bold text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1.5 rounded-lg border"
              >
                <HelpCircle className="h-4 w-4" />
                <span>स्पष्ट नहीं है / छोड़ें (Not sure / Skip)</span>
              </button>
            </div>
          </Card>
        </>
      )}

      {/* Bottom Navigation */}
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
          disabled={!selectedAnswer || loading}
          icon={<ArrowRight className="h-6 w-6" />}
          onClick={handleNextQuestion}
        >
          {loading ? "सहेज रहे हैं..." : "अगला प्रश्न (Next)"}
        </ExtraLargeButton>
      </div>
    </div>
  );
}
