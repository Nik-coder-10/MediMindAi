"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProgressStepper } from "@/components/ui/patient/ProgressStepper";
import { AudioPrompt } from "@/components/ui/patient/AudioPrompt";
import { ExtraLargeButton } from "@/components/ui/patient/ExtraLargeButton";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, AlertTriangle, Check, HelpCircle, PauseCircle, PlayCircle, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { EngineQuestionDefinition, QuestionOption } from "@/lib/engine/types";
import { EmergencyAlertModal } from "@/components/ui/patient/EmergencyAlertModal";
import { speakWithIndianVoice } from "@/lib/voice/tts";

export default function AdaptiveQuestionsFlowPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const router = useRouter();
  const [sessionId] = useState<string>("sess-demo-001");
  const [currentQuestion, setCurrentQuestion] = useState<EngineQuestionDefinition>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem("ayursetu_current_question");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.nodeCode) return parsed;
        }
      } catch {}
    }
    return {
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
    };
  });
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [redFlagBanner, setRedFlagBanner] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stepNumber, setStepNumber] = useState<number>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedStep = sessionStorage.getItem("ayursetu_current_step");
        if (savedStep) return parseInt(savedStep, 10) || 1;
      } catch {}
    }
    return 1;
  });
  const [playingOptionAudio, setPlayingOptionAudio] = useState<string | null>(null);

  const handleSpeakOptionAudio = (
    e: React.MouseEvent,
    text: string,
    lang: "hi" | "en",
    optionKey: string
  ) => {
    e.stopPropagation();

    if (playingOptionAudio === optionKey) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setPlayingOptionAudio(null);
      return;
    }

    setPlayingOptionAudio(optionKey);
    speakWithIndianVoice(
      text,
      lang,
      () => setPlayingOptionAudio(null),
      () => setPlayingOptionAudio(null)
    );
  };

  // Resume or sync question load without clearing UI
  useEffect(() => {
    async function initEngine() {
      try {
        const currentRes = await fetch(`/api/patient/conversation/current?sessionId=${sessionId}`);
        const currentData = await currentRes.json();

        if (currentData.data?.question) {
          setCurrentQuestion(currentData.data.question);
          if (typeof window !== "undefined") {
            sessionStorage.setItem("ayursetu_current_question", JSON.stringify(currentData.data.question));
          }
          if (currentData.data.state?.questionCount) {
            const nextStep = currentData.data.state.questionCount + 1;
            setStepNumber(nextStep);
            if (typeof window !== "undefined") {
              sessionStorage.setItem("ayursetu_current_step", nextStep.toString());
            }
          }
          return;
        }

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
          if (typeof window !== "undefined") {
            sessionStorage.setItem("ayursetu_current_question", JSON.stringify(data.data.firstQuestion));
          }
        }
      } catch {
        // Fallback default node stays in state
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
        const nextQ = data.data.nextQuestion;
        const nextStep = stepNumber + 1;
        setCurrentQuestion(nextQ);
        setStepNumber(nextStep);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("ayursetu_current_question", JSON.stringify(nextQ));
          sessionStorage.setItem("ayursetu_current_step", nextStep.toString());
        }
        setSelectedAnswer(null);
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

      {/* Red Flag Alert Modal Overlay */}
      {redFlagBanner && (
        <EmergencyAlertModal
          description={redFlagBanner}
          onDismiss={() => setRedFlagBanner(null)}
        />
      )}

      {currentQuestion && (
        <>
          <AudioPrompt
            locale={locale}
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
              {locale === "hi" ? (
                <>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground leading-snug">
                    {currentQuestion.questionTextHindi}
                  </h2>
                  <p className="text-base text-muted-foreground font-medium">
                    {currentQuestion.questionText}
                  </p>
                </>
              ) : (
                <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground leading-snug">
                  {currentQuestion.questionText}
                </h2>
              )}
            </div>

            {/* Answer Options with Single Clean Audio Button in Centralized Language */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto pt-2">
              {currentQuestion.options?.map((opt) => {
                const isSelected = selectedAnswer === opt.value;
                const isPlayingThis = playingOptionAudio === opt.value;
                const activeLabel = locale === "hi" ? opt.labelHi : opt.labelEn;
                const subtitle = locale === "hi" ? opt.labelEn : "";

                return (
                  <motion.div
                    key={opt.value}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectOption(opt)}
                    className={`min-h-[72px] p-4 rounded-2xl border-3 flex items-center justify-between text-left font-bold transition-all shadow-sm cursor-pointer ${
                      isSelected
                        ? "bg-ayush-mint border-ayush-green text-ayush-green ring-4 ring-emerald-300 shadow-md"
                        : "bg-background border-input hover:border-ayush-emerald text-foreground"
                    }`}
                  >
                    <div className="flex-1 pr-2">
                      <div className="text-base font-extrabold text-foreground">{activeLabel}</div>
                      {subtitle && <div className="text-xs text-muted-foreground font-semibold">{subtitle}</div>}
                    </div>

                    {/* Single Speaker Button Playing in Centralized Language & Selection Check */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleSpeakOptionAudio(e, activeLabel, locale === "hi" ? "hi" : "en", opt.value)}
                        title={locale === "hi" ? "विकल्प सुनें (Listen in Hindi)" : "Listen option in English"}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all border ${
                          isPlayingThis
                            ? "bg-emerald-600 text-white animate-pulse"
                            : "bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border-emerald-300 hover:bg-emerald-100"
                        }`}
                      >
                        <Volume2 className="h-4.5 w-4.5" />
                      </button>

                      {isSelected ? (
                        <div className="w-8 h-8 rounded-full bg-ayush-green text-white flex items-center justify-center shadow-xs">
                          <Check className="h-4 w-4 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full border-2 border-slate-300 dark:border-slate-700" />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* "I don't know / Skip" Option with Single Speaker Button */}
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedAnswer("NOT_SURE");
                  handleNextQuestion();
                }}
                className="text-sm font-bold text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-xl border bg-card"
              >
                <HelpCircle className="h-4 w-4" />
                <span>{locale === "hi" ? "स्पष्ट नहीं है / छोड़ें (Not sure / Skip)" : "Not sure / Skip"}</span>
              </button>

              <button
                type="button"
                onClick={(e) =>
                  handleSpeakOptionAudio(
                    e,
                    locale === "hi" ? "स्पष्ट नहीं है, छोड़ें" : "Not sure, Skip question",
                    locale === "hi" ? "hi" : "en",
                    "skip-opt"
                  )
                }
                title="Listen option"
                className="w-10 h-10 rounded-xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 flex items-center justify-center"
              >
                <Volume2 className="h-4.5 w-4.5" />
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
