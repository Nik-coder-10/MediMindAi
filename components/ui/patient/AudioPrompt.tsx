"use client";

import React, { useState } from "react";
import { Volume2, VolumeX, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AudioPromptProps {
  text: string;
  hindiText?: string;
  autoPlay?: boolean;
  className?: string;
}

export function AudioPrompt({
  text,
  hindiText,
  autoPlay = false,
  className,
}: AudioPromptProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleToggleSpeech = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utteranceText = hindiText || text;
    const utterance = new SpeechSynthesisUtterance(utteranceText);
    utterance.lang = hindiText ? "hi-IN" : "en-IN";
    utterance.rate = 0.9; // Slightly slower, calm cadence for elderly patients

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-start gap-4 p-5 rounded-2xl bg-ayush-mint/60 dark:bg-emerald-950/20 border-2 border-ayush-emerald/30 shadow-sm",
        className
      )}
    >
      <button
        type="button"
        onClick={handleToggleSpeech}
        aria-label={isPlaying ? "Stop audio instruction" : "Play audio instruction"}
        className="flex-shrink-0 w-14 h-14 rounded-2xl bg-ayush-green text-white flex items-center justify-center shadow-md hover:bg-ayush-emerald active:scale-95 transition-all focus:ring-4 focus:ring-emerald-300"
      >
        {isPlaying ? (
          <VolumeX className="h-7 w-7 animate-pulse text-amber-300" />
        ) : (
          <Volume2 className="h-7 w-7" />
        )}
      </button>

      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-ayush-green uppercase tracking-wide">
          <Sparkles className="h-3.5 w-3.5" />
          <span>आवाज में निर्देश (Audio Guidance)</span>
        </div>
        {hindiText && (
          <p className="text-xl font-bold text-foreground leading-snug">
            {hindiText}
          </p>
        )}
        <p className="text-base text-muted-foreground font-medium">
          {text}
        </p>
      </div>
    </motion.div>
  );
}
