"use client";

import React, { useState } from "react";
import { Mic, MicOff, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface VoiceInputButtonProps {
  isRecording?: boolean;
  onToggleRecording?: () => void;
  label?: string;
  sublabel?: string;
  className?: string;
}

export function VoiceInputButton({
  isRecording = false,
  onToggleRecording,
  label = "बोलने के लिए दबाएं (Tap to Speak)",
  sublabel = "अपनी समस्या अपनी भाषा में बताएं",
  className,
}: VoiceInputButtonProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-6 text-center space-y-4", className)}>
      <div className="relative">
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0.8 }}
              animate={{ scale: 1.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
              className="absolute inset-0 rounded-full bg-rose-500 -z-10"
            />
          )}
        </AnimatePresence>

        <motion.button
          type="button"
          onClick={onToggleRecording}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label={isRecording ? "Stop Recording" : "Start Voice Recording"}
          className={cn(
            "w-28 h-28 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center shadow-xl border-4 transition-all focus:outline-none focus:ring-4 focus:ring-emerald-400",
            isRecording
              ? "bg-rose-600 border-rose-300 text-white animate-pulse"
              : "bg-ayush-green border-emerald-300 text-white hover:bg-ayush-emerald"
          )}
        >
          {isRecording ? (
            <>
              <MicOff className="h-12 w-12 mb-1" />
              <span className="text-xs font-bold uppercase tracking-wider">रोकें (Stop)</span>
            </>
          ) : (
            <>
              <Mic className="h-12 w-12 mb-1" />
              <span className="text-xs font-bold uppercase tracking-wider">बोलें (Speak)</span>
            </>
          )}
        </motion.button>
      </div>

      <div className="space-y-1">
        <p className="text-xl font-extrabold text-foreground">{label}</p>
        <p className="text-sm font-medium text-muted-foreground flex items-center justify-center gap-1">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span>{sublabel}</span>
        </p>
      </div>
    </div>
  );
}
