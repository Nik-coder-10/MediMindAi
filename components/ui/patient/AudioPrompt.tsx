"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Volume2, VolumeX, Mic } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  const isHindi = locale ? locale === "hi" : pathname.startsWith("/hi");
  const [isPlaying, setIsPlaying] = useState(false);

  // Cancel + reset when locale changes
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  }, [locale]);

  // Cancel when question changes
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
    const spokenText = isHindi ? (hindiText || text) : text;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.lang = isHindi ? "hi-IN" : "en-IN";
    utterance.rate = 0.88;
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "relative flex items-center gap-4 p-4 rounded-2xl overflow-hidden",
        "clay-teal border border-botanical-200/80 dark:border-botanical-800/40 shadow-glass-precision",
        className
      )}
    >
      {/* Subtle background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-botanical-50/90 to-transparent dark:from-botanical-950/20 pointer-events-none" />

      {/* Voice button — botanical tactile */}
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={handleToggleSpeech}
          aria-label={isPlaying ? "Stop audio" : "Play audio guidance"}
          className={cn(
            "relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-botanical-300",
            isPlaying
              ? "bg-gradient-to-br from-botanical-600 to-botanical-800 shadow-[0_4px_16px_-2px_rgba(29,106,83,0.5),inset_0_1px_2px_rgba(255,255,255,0.3)] scale-95"
              : "bg-gradient-to-br from-botanical-500 to-botanical-700 shadow-[0_6px_20px_-4px_rgba(29,106,83,0.35),inset_0_1px_2px_rgba(255,255,255,0.3)] hover:shadow-[0_8px_28px_-4px_rgba(29,106,83,0.45)] active:scale-95"
          )}
        >
          {isPlaying ? (
            <VolumeX className="h-6 w-6 text-white" strokeWidth={2.5} />
          ) : (
            <Volume2 className="h-6 w-6 text-white" strokeWidth={2.5} />
          )}
        </button>

        {/* Pulse ring when playing */}
        <AnimatePresence>
          {isPlaying && (
            <motion.div
              initial={{ opacity: 0.8, scale: 1 }}
              animate={{ opacity: 0, scale: 1.8 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
              className="absolute inset-0 rounded-2xl border-2 border-botanical-400 pointer-events-none"
            />
          )}
        </AnimatePresence>
      </div>

      {/* Text content */}
      <div className="relative flex-1 min-w-0 space-y-0.5">
        <div className="editorial-label text-teal-700 dark:text-teal-400 flex items-center gap-1.5 mb-1">
          <Mic className="h-3 w-3" />
          <span>{isHindi ? "आवाज में निर्देश" : "Audio Guidance"}</span>
          {isPlaying && (
            <span className="flex gap-0.5 ml-1 items-end h-3">
              {[0, 0.1, 0.2].map((delay) => (
                <motion.span
                  key={delay}
                  className="w-[2px] bg-teal-500 rounded-full"
                  animate={{ height: ["4px", "10px", "4px"] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay, ease: "easeInOut" }}
                />
              ))}
            </span>
          )}
        </div>

        {isHindi ? (
          <>
            {hindiText && (
              <p className="text-[15px] font-bold text-foreground leading-snug line-clamp-3">
                {hindiText}
              </p>
            )}
            <p className="text-[12px] text-muted-foreground font-medium leading-relaxed line-clamp-2 mt-0.5">
              {text}
            </p>
          </>
        ) : (
          <p className="text-[15px] font-bold text-foreground leading-snug line-clamp-3">
            {text}
          </p>
        )}
      </div>
    </motion.div>
  );
}
