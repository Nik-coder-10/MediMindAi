"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProgressStepper } from "@/components/ui/patient/ProgressStepper";
import { AudioPrompt } from "@/components/ui/patient/AudioPrompt";
import { ExtraLargeButton } from "@/components/ui/patient/ExtraLargeButton";
import { ArrowLeft, ArrowRight, AlertTriangle, Check, HelpCircle, PauseCircle, PlayCircle, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { EngineQuestionDefinition, QuestionOption } from "@/lib/engine/types";
import { EmergencyAlertModal } from "@/components/ui/patient/EmergencyAlertModal";
import { speakWithIndianVoice } from "@/lib/voice/tts";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/use-auth-store";
import { SessionRecoveryStore } from "@/lib/offline/session-recovery.store";
import { OfflineBannerSync } from "@/components/ui/patient/OfflineBannerSync";

export default function AdaptiveQuestionsFlowPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [sessionId, setSessionId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("ayursetu_active_session_id");
      if (stored) return stored;
    }
    return "";
  });
  const [currentQuestion, setCurrentQuestion] = useState<EngineQuestionDefinition | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem("ayursetu_current_question");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.nodeCode) return parsed;
        }
      } catch {}
    }
    return null;
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

  // Deduplication ref to prevent duplicate initialization runs on rerenders
  const initializedSessionRef = React.useRef<string | null>(null);

  // Resume or sync question load without clearing UI
  useEffect(() => {
    async function initEngine() {
      const activeId = sessionId || (typeof window !== "undefined" ? sessionStorage.getItem("ayursetu_active_session_id") : null) || "";
      const storedComplaint = typeof window !== "undefined" ? sessionStorage.getItem("ayursetu_chief_complaint") : null;
      const complaint = storedComplaint || (locale === "hi" ? "सिरदर्द व शरीर में दर्द" : "Headache and body ache");
      const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const intakeMode = urlParams?.get("mode") || (typeof window !== "undefined" ? sessionStorage.getItem("ayursetu_intake_mode") : null) || "AYURVEDA";
      const cacheKey = `${activeId}_${complaint}_${intakeMode}_${locale}`;

      // Prevent redundant fetches if this session & complaint & mode & locale have already been initialized
      if (initializedSessionRef.current === cacheKey && activeId) {
        return;
      }

      try {
        if (activeId) {
          const currentRes = await fetch(`/api/patient/conversation/current?sessionId=${activeId}`);
          const currentData = await currentRes.json();

          if (currentData.data?.question) {
            initializedSessionRef.current = cacheKey;
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
        }

        const activeUserId = user?.id || (typeof window !== "undefined" ? localStorage.getItem("ayursetu_user_id") : null) || "pat-104-demo";
        const res = await fetch("/api/patient/session/start", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": activeUserId,
          },
          body: JSON.stringify({
            sessionId: activeId || undefined,
            chiefComplaint: complaint,
            language: locale === "hi" ? "hi" : "en",
            intakeMode: intakeMode,
          }),
        });
        const data = await res.json();
        if (data.data?.sessionId) {
          const newSessionId = data.data.sessionId;
          initializedSessionRef.current = `${newSessionId}_${complaint}_${intakeMode}_${locale}`;
          setSessionId(newSessionId);
          if (typeof window !== "undefined") {
            sessionStorage.setItem("ayursetu_active_session_id", newSessionId);
          }
        } else {
          initializedSessionRef.current = cacheKey;
        }

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
  }, [sessionId, locale, user?.id]);


  const handleSelectOption = (option: QuestionOption) => {
    setSelectedAnswer(option.value);
  };

  const handleNextQuestion = async () => {
    if (!currentQuestion || !selectedAnswer) return;
    setLoading(true);

    try {
      const activeId = sessionId || (typeof window !== "undefined" ? sessionStorage.getItem("ayursetu_active_session_id") : null) || "sess-demo-001";
      const activeUserId = user?.id || (typeof window !== "undefined" ? localStorage.getItem("ayursetu_user_id") : null) || "pat-104-demo";

      // 1. Update durable snapshot in IndexedDB
      const existingSnap = await SessionRecoveryStore.getActiveSessionSnapshot();
      const updatedAnswers = [
        ...(existingSnap?.collectedAnswers || []),
        {
          nodeCode: currentQuestion.nodeCode,
          questionText: currentQuestion.questionText,
          questionTextHindi: currentQuestion.questionTextHindi || "",
          answerValue: selectedAnswer,
          answeredAt: Date.now(),
        },
      ];

      await SessionRecoveryStore.saveActiveSessionSnapshot({
        sessionId: activeId,
        patientId: activeUserId,
        language: locale,
        chiefComplaint: existingSnap?.chiefComplaint || "Consultation",
        currentNodeCode: currentQuestion.nodeCode,
        collectedAnswers: updatedAnswers,
        uploadedDocSummaries: existingSnap?.uploadedDocSummaries || [],
        triagePriority: existingSnap?.triagePriority || "ROUTINE",
        lastActiveTimestamp: Date.now(),
        step: "QUESTIONS",
      });

      // 2. Check online status before network dispatch
      if (typeof window !== "undefined" && !navigator.onLine) {
        // Enqueue offline action
        await SessionRecoveryStore.enqueueOfflineAction({
          sessionId: activeId,
          actionType: "ANSWER",
          endpoint: "/api/patient/conversation/answer",
          payload: {
            sessionId: activeId,
            nodeCode: currentQuestion.nodeCode,
            answerValue: selectedAnswer,
          },
        });

        // Advance to next step or documents
        const nextStep = stepNumber + 1;
        setStepNumber(nextStep);
        setSelectedAnswer(null);
        return;
      }

      const res = await fetch("/api/patient/conversation/answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": activeUserId,
        },
        body: JSON.stringify({
          sessionId: activeId,
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
      // Graceful offline fallback
      await SessionRecoveryStore.enqueueOfflineAction({
        sessionId: sessionId || "sess-demo-001",
        actionType: "ANSWER",
        endpoint: "/api/patient/conversation/answer",
        payload: {
          sessionId: sessionId || "sess-demo-001",
          nodeCode: currentQuestion.nodeCode,
          answerValue: selectedAnswer,
        },
      });
      router.push(`/${locale}/patient/documents`);
    } finally {
      setLoading(false);
    }
  };

  // ── Paused state ──
  if (isPaused) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-sm mx-auto py-16 text-center space-y-6"
      >
        <div className="clay-white rounded-3xl p-8 space-y-5">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center">
            <PauseCircle className="h-8 w-8 text-amber-600" />
          </div>
          <div>
            <h2 className="text-[20px] font-black text-foreground">Session Paused</h2>
            <p className="text-[12px] text-muted-foreground font-medium mt-1.5">
              सत्र रोका गया — Your answers are saved. Resume anytime without losing progress.
            </p>
          </div>
          <ExtraLargeButton
            variant="primary"
            size="large"
            className="w-full"
            icon={<PlayCircle className="h-5 w-5" />}
            onClick={() => setIsPaused(false)}
          >
            जारी रखें (Resume)
          </ExtraLargeButton>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-5 max-w-xl mx-auto">
      <OfflineBannerSync />
      <ProgressStepper currentStep={4} />

      {/* Red Flag Alert Modal */}
      {redFlagBanner && (
        <EmergencyAlertModal
          description={redFlagBanner}
          onDismiss={() => setRedFlagBanner(null)}
        />
      )}

      {!currentQuestion ? (
        <div className="clay-white rounded-3xl p-12 text-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <h3 className="text-base font-extrabold text-foreground">
            {locale === "hi" ? "अनुकूलित प्रश्न तैयार किए जा रहे हैं..." : "Preparing tailored clinical questions..."}
          </h3>
          <p className="text-xs text-muted-foreground font-medium">
            {locale === "hi" ? "आपकी मुख्य समस्या के अनुसार प्रश्न लोड हो रहे हैं" : "Analyzing chief complaint to generate specific questions"}
          </p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.nodeCode}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4"
          >
            {/* Audio Prompt */}
            <AudioPrompt
              locale={locale}
              hindiText={currentQuestion.questionTextHindi}
              text={currentQuestion.questionText}
            />

            {/* Question Card */}
            <div className="clay-white rounded-3xl overflow-hidden">
              {/* Card header band */}
              <div className="px-6 pt-5 pb-4 border-b border-border/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/40 text-indigo-700 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider">
                    Q{stepNumber} · {currentQuestion.chiefComplaintCategory.replace("_", " ")}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPaused(true)}
                  className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors min-h-[36px] px-2 rounded-lg hover:bg-muted/50"
                >
                  <PauseCircle className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">रोकें</span>
                </button>
              </div>

              {/* Question text */}
              <div className="px-6 py-5 text-center space-y-1.5">
                {locale === "hi" ? (
                  <>
                    <h2 className="text-[22px] sm:text-[26px] font-black text-foreground leading-snug tracking-tight">
                      {currentQuestion.questionTextHindi}
                    </h2>
                    <p className="text-[13px] text-muted-foreground font-medium">
                      {currentQuestion.questionText}
                    </p>
                  </>
                ) : (
                  <h2 className="text-[22px] sm:text-[26px] font-black text-foreground leading-snug tracking-tight">
                    {currentQuestion.questionText}
                  </h2>
                )}
              </div>

              {/* Answer options */}
              <div className="px-5 pb-5 space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentQuestion.options?.map((opt) => {
                    const isSelected = selectedAnswer === opt.value;
                    const isPlayingThis = playingOptionAudio === opt.value;
                    const activeLabel = locale === "hi" ? opt.labelHi : opt.labelEn;
                    const subtitle = locale === "hi" ? opt.labelEn : "";

                    return (
                      <motion.div
                        key={opt.value}
                        whileTap={{ scale: 0.975 }}
                        onClick={() => handleSelectOption(opt)}
                        className={cn(
                          "relative min-h-[68px] p-3.5 rounded-2xl flex items-center justify-between gap-2 cursor-pointer transition-all duration-250",
                          isSelected
                            ? "bg-gradient-to-br from-indigo-50 to-indigo-100/60 dark:from-indigo-950/40 dark:to-indigo-900/20 border-2 border-indigo-400 shadow-[0_0_0_4px_rgba(67,56,202,0.08)]"
                            : "bg-muted/40 dark:bg-muted/20 border-2 border-transparent hover:border-indigo-300/60 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20"
                        )}
                      >
                        {/* Option label */}
                        <div className="flex-1 min-w-0">
                          <div className={cn(
                            "text-[14px] font-bold leading-snug",
                            isSelected ? "text-indigo-900 dark:text-indigo-200" : "text-foreground"
                          )}>
                            {activeLabel}
                          </div>
                          {subtitle && (
                            <div className="text-[11px] text-muted-foreground font-medium mt-0.5 truncate">
                              {subtitle}
                            </div>
                          )}
                        </div>

                        {/* Right: speaker + selection */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={(e) =>
                              handleSpeakOptionAudio(
                                e,
                                activeLabel,
                                locale === "hi" ? "hi" : "en",
                                opt.value
                              )
                            }
                            title="Listen"
                            className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center transition-all border",
                              isPlayingThis
                                ? "bg-teal-600 text-white border-teal-500 animate-pulse"
                                : "bg-background border-border text-muted-foreground hover:border-teal-400 hover:text-teal-600"
                            )}
                          >
                            <Volume2 className="h-3.5 w-3.5" />
                          </button>

                          <div className={cn(
                            "w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all",
                            isSelected
                              ? "bg-indigo-600 border-indigo-600 shadow-sm"
                              : "border-border"
                          )}>
                            {isSelected && <Check className="h-3.5 w-3.5 text-white stroke-[3]" />}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Skip option */}
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAnswer("NOT_SURE");
                      handleNextQuestion();
                    }}
                    className="text-[12px] font-bold text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-xl border border-border hover:border-indigo-300 bg-background hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all"
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                    <span>{locale === "hi" ? "स्पष्ट नहीं / छोड़ें" : "Not sure / Skip"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) =>
                      handleSpeakOptionAudio(
                        e,
                        locale === "hi" ? "स्पष्ट नहीं है, छोड़ें" : "Not sure, skip question",
                        locale === "hi" ? "hi" : "en",
                        "skip-opt"
                      )
                    }
                    title="Listen"
                    className="w-9 h-9 rounded-xl border border-border bg-background hover:border-teal-400 text-muted-foreground hover:text-teal-600 flex items-center justify-center transition-all"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center pt-1">
        <ExtraLargeButton
          variant="secondary"
          size="default"
          icon={<ArrowLeft className="h-5 w-5" />}
          onClick={() => router.back()}
        >
          {locale === "hi" ? "पीछे" : "Back"}
        </ExtraLargeButton>

        <ExtraLargeButton
          variant="primary"
          size="large"
          disabled={!selectedAnswer || loading}
          icon={<ArrowRight className="h-5 w-5" />}
          onClick={handleNextQuestion}
        >
          {loading
            ? locale === "hi" ? "सहेज रहे हैं..." : "Saving..."
            : locale === "hi" ? "अगला प्रश्न" : "Next Question"}
        </ExtraLargeButton>
      </div>
    </div>
  );
}
