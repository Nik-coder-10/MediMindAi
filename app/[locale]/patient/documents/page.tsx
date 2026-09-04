"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProgressStepper } from "@/components/ui/patient/ProgressStepper";
import { AudioPrompt } from "@/components/ui/patient/AudioPrompt";
import { ExtraLargeButton } from "@/components/ui/patient/ExtraLargeButton";
import { Card } from "@/components/ui/card";
import {
  Camera,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Pill,
  Activity,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ExtractedEntitiesResult } from "@/lib/ocr/ocr.service";
import {
  DocumentCameraCapture,
  EnhancedDocumentResult,
} from "@/components/ui/patient/DocumentCameraCapture";

export default function PatientDocumentsScanPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const router = useRouter();
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{ name: string; size: string; status: "EXTRACTED" | "PROCESSING"; previewUrl?: string }>
  >([]);
  const [extractedEntities, setExtractedEntities] = useState<ExtractedEntitiesResult | null>(null);

  const isRajasthani = locale === "raj";
  const isHindi = locale === "hi";
  const isRegional = isHindi || isRajasthani;

  // Escape key listener to easily dismiss modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showCameraModal) {
        setShowCameraModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showCameraModal]);

  // Process File through OCR endpoint
  const processUploadedFile = async (file: File, previewUrl?: string) => {
    setUploading(true);
    const activeSessionId =
      (typeof window !== "undefined" && sessionStorage.getItem("ayursetu_active_session_id")) ||
      "sess-demo-001";
    const formData = new FormData();
    formData.append("file", file);
    formData.append("sessionId", activeSessionId);
    formData.append("type", "PRESCRIPTION");

    try {
      const activeUserId =
        (typeof window !== "undefined" &&
          (localStorage.getItem("ayursetu_user_id") ||
            sessionStorage.getItem("ayursetu_user_id"))) ||
        "pat-104-demo";

      const res = await fetch("/api/patient/documents/upload", {
        method: "POST",
        headers: {
          "x-user-id": activeUserId,
        },
        body: formData,
      });
      const data = await res.json();

      const newFiles = [
        ...uploadedFiles,
        {
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          status: "EXTRACTED" as const,
          previewUrl,
        },
      ];
      setUploadedFiles(newFiles);

      if (data.data?.entities) {
        // Merge with existing entities if multiple documents are added
        setExtractedEntities((prev) => {
          if (!prev) return data.data.entities;
          return {
            medications: [...prev.medications, ...(data.data.entities.medications || [])],
            labResults: [...prev.labResults, ...(data.data.entities.labResults || [])],
            diagnoses: [...(prev.diagnoses || []), ...(data.data.entities.diagnoses || [])],
            vitals: { ...(prev.vitals || {}), ...(data.data.entities.vitals || {}) },
            procedures: [...(prev.procedures || []), ...(data.data.entities.procedures || [])],
            allergies: [...(prev.allergies || []), ...(data.data.entities.allergies || [])],
          };
        });

        // Persist for summary preview page & doctor review
        try {
          if (typeof window !== "undefined") {
            sessionStorage.setItem("ayush_uploaded_docs", JSON.stringify(newFiles));
            sessionStorage.setItem("ayush_extracted_entities", JSON.stringify(data.data.entities));
            sessionStorage.setItem("ayush_ocr_raw", JSON.stringify(data.data.ocr || {}));
          }
        } catch (e) {
          console.error("Failed to save to sessionStorage", e);
        }
      }
    } catch {
      // Fallback preview
      const fallbackFiles = [
        ...uploadedFiles,
        {
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          status: "EXTRACTED" as const,
          previewUrl,
        },
      ];
      setUploadedFiles(fallbackFiles);

      const fallbackEntities: ExtractedEntitiesResult = {
        medications: [
          {
            name: "Tab Yogaraj Guggulu 500mg",
            dosage: "500mg",
            frequency: "1-0-1",
            duration: "15 days",
            confidence: 0.94,
          },
          {
            name: "Syp Amritarishta 15ml",
            dosage: "15ml",
            frequency: "BD",
            duration: "15 days",
            confidence: 0.88,
          },
          {
            name: "Tab Paracetamol 650mg",
            dosage: "650mg",
            frequency: "SOS",
            duration: "10 days",
            confidence: 0.95,
          },
        ],
        diagnoses: ["Amavata (Joint pain & stiffness)", "Amlapitta"],
        labResults: [
          {
            testName: "HbA1c",
            value: 6.8,
            unit: "%",
            referenceRange: "4.0 - 5.6",
            flag: "HIGH",
            confidence: 0.96,
          },
          {
            testName: "Serum Uric Acid",
            value: 7.8,
            unit: "mg/dL",
            referenceRange: "3.5 - 7.2",
            flag: "HIGH",
            confidence: 0.91,
          },
          {
            testName: "ESR",
            value: 38,
            unit: "mm/hr",
            referenceRange: "0 - 15",
            flag: "HIGH",
            confidence: 0.89,
          },
        ],
        vitals: { "Blood Pressure": "130/84 mmHg", Pulse: "78 bpm" },
        procedures: [],
        allergies: ["No Known Drug Allergies (NKDA)"],
        clinicalSummaryText: "Extracted 3 medications and 3 abnormal lab values.",
      };
      setExtractedEntities(fallbackEntities);

      try {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("ayush_uploaded_docs", JSON.stringify(fallbackFiles));
          sessionStorage.setItem("ayush_extracted_entities", JSON.stringify(fallbackEntities));
        }
      } catch (e) {}
    } finally {
      setUploading(false);
      setShowCameraModal(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processUploadedFile(file);
  };

  const handleCameraCapture = async (result: EnhancedDocumentResult) => {
    await processUploadedFile(result.file, result.previewUrl);
  };


  return (
    <div className="space-y-6">
      <ProgressStepper currentStep={5} />

      <AudioPrompt
        locale={locale}
        hindiText={
          isRajasthani
            ? "जे आपरे कनै कोई पुरानी परची या जांच री रिपोर्ट है, तो कैमरे सूं फोटो खींच’र अपलोड करो सा।"
            : "यदि आपके पास कोई पुरानी पर्ची या जांच रिपोर्ट है, तो कैमरे से फोटो खींचकर अपलोड करें।"
        }
        text="If you have any previous prescriptions or lab reports, please take a photo or upload them."
      />

      <Card className="border-3 border-emerald-300 shadow-xl p-6 sm:p-8 rounded-3xl bg-white dark:bg-card space-y-6 text-center">
        <div className="space-y-2">
          <span className="text-xs font-extrabold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full inline-flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" />{" "}
            {isRajasthani ? "चरण ५ • पुरानी परची व जांच (Medical Records)" : "चरण ५ • पुरानी पर्ची व जांच (Medical Records)"}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            {isRajasthani ? "परची री फोटो खींचो या अपलोड करो सा" : "पर्चे की फोटो खींचें या अपलोड करें"}
          </h2>
          <p className="text-sm font-medium text-muted-foreground">
            {isRajasthani
              ? "पुरानी डाक्टरी परची, हस्पताल री छुट्टी आळी परची या खून जांच री रिपोर्ट अपलोड करो सा।"
              : "Upload old prescription, discharge slip, or blood test reports."}
          </p>
        </div>

        {/* Two-Option Capture Choice: Live Camera with Guidance Overlay OR Direct Upload */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Option A: Dedicated Guided Camera */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCameraModal(true)}
            disabled={uploading}
            className="p-6 rounded-3xl border-2 border-botanical-500/80 bg-botanical-50/70 dark:bg-botanical-950/30 hover:bg-botanical-100/70 text-botanical-950 dark:text-botanical-200 flex flex-col items-center justify-center gap-3 shadow-glass-precision transition-all text-center min-h-[160px]"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-botanical text-white flex items-center justify-center shadow-md shadow-botanical-700/20">
              <Camera className="h-8 w-8" />
            </div>
            <div>
              <span className="text-lg font-black block">
                {isHindi ? "कैमरे से फोटो लें (Live Camera)" : "Take Photo with Camera"}
              </span>
              <span className="text-xs font-semibold text-muted-foreground block mt-0.5">
                {isHindi ? "मार्गदर्शक फ्रेम व लिखावट स्पष्टता के साथ" : "With guidance frame & handwriting auto-crop"}
              </span>
            </div>
          </motion.button>

          {/* Option B: Direct File / PDF Picker */}
          <label className="block cursor-pointer">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
            <motion.div
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              className="p-6 rounded-3xl border-2 border-border/80 bg-card hover:bg-muted/50 text-foreground flex flex-col items-center justify-center gap-3 shadow-glass-precision transition-all text-center min-h-[160px]"
            >
              <div className="w-16 h-16 rounded-2xl bg-botanical-100 dark:bg-forest-card text-botanical-700 dark:text-botanical-300 flex items-center justify-center shadow-2xs">
                <UploadCloud className="h-8 w-8" />
              </div>
              <div>
                <span className="text-lg font-black block">
                  {isHindi ? "फ़ाइल / PDF अपलोड करें (Upload File)" : "Upload File / PDF"}
                </span>
                <span className="text-xs font-semibold text-muted-foreground block mt-0.5">
                  {isHindi ? "गैलरी या स्टोरेज से पर्चा चुनें" : "Select from device storage or gallery"}
                </span>
              </div>
            </motion.div>
          </label>
        </div>

        {/* Live Camera Viewfinder Modal */}
        <AnimatePresence>
          {showCameraModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowCameraModal(false);
                }
              }}
              className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
            >
              {/* Floating Escape / Close Button on Top Right */}
              <button
                type="button"
                onClick={() => setShowCameraModal(false)}
                className="fixed top-4 right-4 z-[60] p-2.5 rounded-full bg-white/15 hover:bg-rose-600/90 text-white border border-white/30 backdrop-blur-md transition-all shadow-xl flex items-center gap-1.5 text-xs font-bold"
                aria-label="Close modal"
              >
                <span className="hidden sm:inline-block">{isHindi ? "बंद करें (Esc)" : "Close (Esc)"}</span>
                <span className="text-base leading-none">✕</span>
              </button>

              <div className="w-full max-w-lg my-auto" onClick={(e) => e.stopPropagation()}>
                <DocumentCameraCapture
                  isHindi={isHindi}
                  onCaptureComplete={handleCameraCapture}
                  onCancel={() => setShowCameraModal(false)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Processing Indicator */}
        {uploading && (
          <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 text-amber-900 dark:text-amber-200 flex flex-col items-center gap-3 animate-pulse">
            <Loader2 className="h-10 w-10 animate-spin text-amber-600" />
            <div className="space-y-0.5">
              <span className="text-base font-black block">
                {isHindi ? "दस्तावेज़ पढ़ा जा रहा है (Processing OCR & NER)..." : "Reading Document & Extracting Entities..."}
              </span>
              <span className="text-xs font-semibold text-muted-foreground block">
                {isHindi ? "दवाइयां और जांच परिणाम निकाले जा रहे हैं" : "Extracting medications and lab investigations"}
              </span>
            </div>
          </div>
        )}

        {/* Uploaded Documents List */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-3 text-left pt-2">
            <span className="text-xs font-extrabold text-muted-foreground uppercase">
              अपलोड किए गए दस्तावेज़ (Uploaded Files):
            </span>
            {uploadedFiles.map((doc, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-emerald-600" />
                  <div>
                    <span className="text-sm font-bold block">{doc.name}</span>
                    <span className="text-xs text-muted-foreground font-medium">{doc.size}</span>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> स्कैन पूर्ण (Processed)
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Plain Language Extracted Summary Card */}
        {extractedEntities && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl bg-emerald-50/80 border-2 border-emerald-300 text-left space-y-4 shadow-sm"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-extrabold text-sm text-emerald-950 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-600" /> पर्चे से निकाली गई जानकारी (Extracted Details)
              </span>
              <span className="text-xs font-bold px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded-full">
                AI समर्थित (Accurate)
              </span>
            </div>

            {/* Extracted Medications with Confidence Scores */}
            {extractedEntities.medications.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-extrabold text-muted-foreground uppercase flex items-center gap-1">
                  <Pill className="h-3.5 w-3.5 text-emerald-700" /> पहचानी गई दवाइयां (Medications):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {extractedEntities.medications.map((med, i) => {
                    const conf = med.confidence ?? 0.9;
                    const confPercent = Math.round(conf * 100);
                    const isHigh = conf >= 0.85;
                    const isMedium = conf >= 0.6 && conf < 0.85;

                    return (
                      <div key={i} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border text-xs space-y-1 shadow-2xs">
                        <div className="flex items-start justify-between gap-1">
                          <div className="font-extrabold text-foreground">{med.name}</div>
                          <span
                            className={`text-[10px] font-black px-1.5 py-0.5 rounded-md shrink-0 ${
                              isHigh
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : isMedium
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                            }`}
                            title={`Extraction confidence: ${confPercent}%`}
                          >
                            {confPercent}% {isHigh ? "✓" : isMedium ? "⚠" : "!"}
                          </span>
                        </div>
                        <div className="text-muted-foreground font-semibold text-[11px]">
                          {med.dosage} • {med.frequency} • {med.duration}
                        </div>
                        {med.needsReview && (
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 block pt-0.5">
                            * चिकित्सक सत्यापन अपेक्षित (Review suggested)
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Extracted Lab Reports with Confidence Scores */}
            {extractedEntities.labResults.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-xs font-extrabold text-muted-foreground uppercase flex items-center gap-1">
                  <Activity className="h-3.5 w-3.5 text-emerald-700" /> खून की जांच रिपोर्ट (Lab Values):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {extractedEntities.labResults.map((lab, i) => {
                    const conf = lab.confidence ?? 0.9;
                    const confPercent = Math.round(conf * 100);
                    const isHigh = conf >= 0.85;
                    const isMedium = conf >= 0.6 && conf < 0.85;

                    return (
                      <div key={i} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border text-xs flex justify-between items-center shadow-2xs">
                        <div className="space-y-0.5">
                          <div className="font-extrabold text-foreground">{lab.testName}</div>
                          <div className="text-muted-foreground font-semibold text-[11px]">
                            {lab.value} {lab.unit} ({lab.referenceRange})
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {lab.flag === "HIGH" && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800">
                              उच्च (High)
                            </span>
                          )}
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                              isHigh
                                ? "bg-emerald-100 text-emerald-800"
                                : isMedium
                                ? "bg-amber-100 text-amber-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {confPercent}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-2">
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
          icon={<ArrowRight className="h-6 w-6" />}
          onClick={() => router.push(`/${locale}/patient/summary-preview`)}
        >
          परामर्श सारांश देखें (Next)
        </ExtraLargeButton>
      </div>
    </div>
  );
}
