"use client";

import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

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
  return (
    <div className="w-full py-2">
      <div className="flex items-center justify-between relative">
        {/* Connecting line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 w-full bg-muted rounded-full -z-10">
          <div
            className="h-full bg-ayush-green transition-all duration-300 rounded-full"
            style={{
              width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
            }}
          />
        </div>

        {steps.map((step, index) => {
          const stepNum = index + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          return (
            <div key={stepNum} className="flex flex-col items-center">
              <div
                className={cn(
                  "w-11 h-11 rounded-full flex items-center justify-center font-bold text-base border-3 transition-all",
                  isCompleted
                    ? "bg-ayush-green text-white border-ayush-green shadow-sm"
                    : isCurrent
                    ? "bg-white dark:bg-slate-900 text-ayush-green border-ayush-green ring-4 ring-emerald-200 dark:ring-emerald-900 shadow-md scale-110"
                    : "bg-muted text-muted-foreground border-border"
                )}
              >
                {isCompleted ? <Check className="h-5 w-5 stroke-[3]" /> : stepNum}
              </div>
              <span
                className={cn(
                  "text-xs font-bold mt-1.5 hidden sm:block",
                  isCurrent ? "text-ayush-green font-extrabold" : "text-muted-foreground"
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
