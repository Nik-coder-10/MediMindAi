"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Volume2, VolumeX, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AudioPromptProps {
  text: string;
  hindiText?: string;
  autoPlay?: boolean;
  className?: string;
  locale?: string;
}

export function AudioPrompt({
  text,
  hindiText,
  autoPlay = false,
  className,
  locale,
}: AudioPromptProps) {
  const pathname = usePathname();
  // Exact check: only treat as Hindi if locale is 'hi' or pathname starts with '/hi'
  const isHindi = locale ? locale === "hi" : pathname.startsWith("/hi");
  const [isPlaying, setIsPlaying] = useState(false);
  const [voicesReady, setVoicesReady] = useState(false);

  // Load voices — some browsers fire voiceschanged before they're populated
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const load = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) setVoicesReady(true);
    };
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  // When locale changes, cancel any active audio and reset playing state
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  }, [locale]);

  // Also cancel when the question text changes (new question loaded)
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  }, [text, hindiText]);

  const handleToggleSpeech = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    // In English mode, speak the English text. In Hindi mode, speak Hindi text.
    const spokenText = isHindi ? (hindiText || text) : text;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.lang = isHindi ? "hi-IN" : "en-IN";
    utterance.rate = 0.88; // Calm medical pace
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    if (isHindi) {
      const hVoice = voices.find(
        (v) =>
          v.lang === "hi-IN" ||
          v.lang.startsWith("hi") ||
          v.name.toLowerCase().includes("hindi") ||
          v.name.toLowerCase().includes("swara") ||
          v.name.toLowerCase().includes("madhur")
      );
      if (hVoice) utterance.voice = hVoice;
    } else {
      const eVoice = voices.find(
        (v) =>
          v.lang === "en-IN" ||
          v.name.toLowerCase().includes("india") ||
          v.name.toLowerCase().includes("neerja") ||
          v.name.toLowerCase().includes("prabhat") ||
          v.name.toLowerCase().includes("ravi") ||
          v.lang.startsWith("en")
      );
      if (eVoice) utterance.voice = eVoice;
    }

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  }, [isHindi, isPlaying, text, hindiText]);

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
        className={cn(
          "flex-shrink-0 w-14 h-14 rounded-2xl text-white flex items-center justify-center shadow-md active:scale-95 transition-all focus:ring-4 focus:ring-emerald-300",
          isPlaying
            ? "bg-rose-500 hover:bg-rose-600 animate-pulse"
            : "bg-ayush-green hover:bg-ayush-emerald"
        )}
      >
        {isPlaying ? (
          <VolumeX className="h-7 w-7 text-white" />
        ) : (
          <Volume2 className="h-7 w-7" />
        )}
      </button>

      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-ayush-green uppercase tracking-wide">
          <Sparkles className="h-3.5 w-3.5" />
          <span>{isHindi ? "आवाज में निर्देश (Audio Guidance)" : "Audio Guidance"}</span>
        </div>
        {isHindi ? (
          <>
            {hindiText && (
              <p className="text-xl font-bold text-foreground leading-snug">
                {hindiText}
              </p>
            )}
            <p className="text-sm text-muted-foreground font-medium">
              {text}
            </p>
          </>
        ) : (
          <p className="text-xl font-bold text-foreground leading-snug">
            {text}
          </p>
        )}
      </div>

    </motion.div>
  );
}
