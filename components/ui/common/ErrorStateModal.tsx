"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { ExtraLargeButton } from "@/components/ui/patient/ExtraLargeButton";
import { AlertCircle, RefreshCw, ArrowLeft, MicOff, CameraOff, WifiOff } from "lucide-react";
import { motion } from "framer-motion";

interface ErrorModalProps {
  type: "MIC_DENIED" | "CAMERA_DENIED" | "OCR_LOW_CONFIDENCE" | "NETWORK_TIMEOUT";
  onRetry: () => void;
  onFallback?: () => void;
}

export function ErrorStateModal({ type, onRetry, onFallback }: ErrorModalProps) {
  const getDetails = () => {
    switch (type) {
      case "MIC_DENIED":
        return {
          icon: <MicOff className="h-10 w-10 text-rose-600" />,
          titleHi: "माइक्रोफ़ोन अनुमति आवश्यक है",
          titleEn: "Microphone Access Required",
          descHi: "कृपया ब्राउज़र सेटिंग में जाकर माइक्रोफ़ोन की अनुमति दें या कीबोर्ड से लिखकर बताएं।",
          descEn: "Please allow microphone access in browser settings or switch to keyboard input.",
          actionText: "कीबोर्ड से लिखें (Type with Keyboard)",
        };
      case "CAMERA_DENIED":
        return {
          icon: <CameraOff className="h-10 w-10 text-rose-600" />,
          titleHi: "कैमरा अनुमति आवश्यक है",
          titleEn: "Camera Access Required",
          descHi: "पर्चे की फोटो खींचने हेतु कैमरा अनुमति दें या गैलरी से फाइल चुनें।",
          descEn: "Please allow camera access to scan prescription or select file from gallery.",
          actionText: "गैलरी से चुनें (Select File)",
        };
      case "OCR_LOW_CONFIDENCE":
        return {
          icon: <AlertCircle className="h-10 w-10 text-amber-600" />,
          titleHi: "पर्चा स्पष्ट रूप से नहीं पढ़ा जा सका",
          titleEn: "Document Text Low Clarity",
          descHi: "कृपया अच्छी रोशनी में पर्चे की सीधी फोटो दोबारा लें।",
          descEn: "Please retake the photo in good lighting or enter medications manually.",
          actionText: "दोबारा फोटो लें (Retake Photo)",
        };
      default:
        return {
          icon: <WifiOff className="h-10 w-10 text-amber-600" />,
          titleHi: "सर्वर से संपर्क नहीं हो सका",
          titleEn: "Network Connection Timeout",
          descHi: "इंटरनेट कनेक्शन धीमा है। आपका डेटा स्थानीय रूप से सुरक्षित है।",
          descEn: "Slow network detected. Your progress is saved locally.",
          actionText: "पुनः प्रयास करें (Retry)",
        };
    }
  };

  const details = getDetails();

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-card border-3 border-input rounded-3xl p-6 sm:p-8 space-y-5 text-center shadow-2xl"
      >
        <div className="w-18 h-18 mx-auto rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-inner">
          {details.icon}
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-extrabold text-foreground">{details.titleHi}</h3>
          <h4 className="text-sm font-bold text-muted-foreground">{details.titleEn}</h4>
          <p className="text-xs font-semibold text-muted-foreground pt-1">{details.descHi}</p>
          <p className="text-xs text-muted-foreground">{details.descEn}</p>
        </div>

        <div className="space-y-2 pt-2">
          <ExtraLargeButton variant="primary" size="default" className="w-full text-xs" onClick={onRetry}>
            {details.actionText}
          </ExtraLargeButton>

          {onFallback && (
            <button
              type="button"
              onClick={onFallback}
              className="text-xs font-bold text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mt-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>वापस जाएं (Go Back)</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
