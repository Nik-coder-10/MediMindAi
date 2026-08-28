"use client";

import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ProgressStepperProps {
  currentStep: number;
  totalSteps?: number;
  steps?: Array<{ titleHi: string; titleEn: string }>;
}

export function ProgressStepper({
  currentStep,
  steps = [
    { titleHi: "भाषा", titleEn: "Language" },
    { titleHi: "सहमति", titleEn: "Consent" },
    { titleHi: "समस्या", titleEn: "Complaint" },
    { titleHi: "प्रश्न", titleEn: "Questions" },
    { titleHi: "पर्ची", titleEn: "Documents" },
    { titleHi: "सारांश", titleEn: "Summary" },
  ],
}: ProgressStepperProps) {
  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="w-full py-2">
      {/* Progress track */}
      <div className="relative flex items-center justify-between">
        {/* Track line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 w-full bg-muted rounded-full -z-10 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-600 to-teal-500 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>

        {steps.map((step, index) => {
          const stepNum = index + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          return (
            <div key={stepNum} className="flex flex-col items-center gap-1.5">
              <motion.div
                initial={false}
                animate={
                  isCurrent
                    ? { scale: 1.15 }
                    : isCompleted
                    ? { scale: 1 }
                    : { scale: 0.9 }
                }
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-300",
                  isCompleted
                    ? "bg-gradient-to-br from-teal-500 to-teal-600 text-white border-teal-400 shadow-sm"
                    : isCurrent
                    ? "bg-white dark:bg-slate-900 text-indigo-700 border-indigo-500 shadow-[0_0_0_4px_rgba(67,56,202,0.12)] dark:shadow-[0_0_0_4px_rgba(99,102,241,0.15)]"
                    : "bg-muted text-muted-foreground border-border"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4 stroke-[2.5]" />
                ) : (
                  <span className={cn("text-xs font-extrabold", isCurrent ? "text-indigo-700" : "")}>
                    {stepNum}
                  </span>
                )}
              </motion.div>
              <span
                className={cn(
                  "text-[10px] font-semibold hidden sm:block leading-none",
                  isCurrent
                    ? "text-indigo-700 dark:text-indigo-400 font-bold"
                    : isCompleted
                    ? "text-teal-600 dark:text-teal-400"
                    : "text-muted-foreground"
                )}
              >
                {step.titleHi}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
