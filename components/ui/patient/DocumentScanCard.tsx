"use client";

import React, { useRef, useState } from "react";
import { Camera, Upload, CheckCircle2, FileText, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DocumentScanCardProps {
  title?: string;
  description?: string;
  onFileSelected?: (file: File) => void;
  className?: string;
}

export function DocumentScanCard({
  title = "पुरानी पर्ची या जांच रिपोर्ट फोटो खींचें",
  description = "Take photo of doctor prescription or lab report",
  onFileSelected,
  className,
}: DocumentScanCardProps) {
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
      onFileSelected?.(file);
    }
  };

  return (
    <div
      className={cn(
        "p-6 rounded-3xl border-3 border-dashed border-ayush-emerald/40 bg-ayush-mint/30 dark:bg-emerald-950/10 text-center space-y-4 hover:border-ayush-green transition-all",
        className
      )}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,application/pdf"
        className="hidden"
      />

      <div className="w-16 h-16 mx-auto rounded-2xl bg-ayush-green text-white flex items-center justify-center shadow-md">
        <Camera className="h-9 w-9" />
      </div>

      <div className="space-y-1">
        <h3 className="text-xl font-bold text-foreground">{title}</h3>
        <p className="text-sm font-medium text-muted-foreground">{description}</p>
      </div>

      {selectedFileName ? (
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded-xl font-bold text-sm">
          <CheckCircle2 className="h-4 w-4" />
          <span>अपलोड हो गया: {selectedFileName}</span>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[56px] px-6 rounded-2xl bg-ayush-green text-white font-bold text-base flex items-center justify-center gap-2 shadow-md hover:bg-ayush-emerald"
          >
            <Camera className="h-5 w-5" />
            <span>कैमरा खोलें (Camera)</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[56px] px-6 rounded-2xl bg-white dark:bg-card border-2 border-border font-bold text-base flex items-center justify-center gap-2 shadow-sm hover:bg-muted"
          >
            <Upload className="h-5 w-5 text-muted-foreground" />
            <span>फ़ाइल चुनें (Upload File)</span>
          </motion.button>
        </div>
      )}
    </div>
  );
}
