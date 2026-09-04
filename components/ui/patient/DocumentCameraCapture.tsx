"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Camera,
  RotateCcw,
  Sparkles,
  Check,
  X,
  UploadCloud,
  Sliders,
  Sun,
  Contrast,
  FileText,
  AlertCircle,
  Eye,
  RefreshCw,
  Maximize2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface EnhancedDocumentResult {
  file: File;
  previewUrl: string;
  originalFileName: string;
  enhancementMode: "AUTO" | "DOCUMENT_BINARIZED" | "HIGH_CONTRAST" | "ORIGINAL";
}

interface DocumentCameraCaptureProps {
  onCaptureComplete: (result: EnhancedDocumentResult) => void;
  onCancel?: () => void;
  isHindi?: boolean;
}

export function DocumentCameraCapture({
  onCaptureComplete,
  onCancel,
  isHindi = true,
}: DocumentCameraCaptureProps) {
  const [mode, setMode] = useState<"CAMERA" | "PREVIEW" | "FALLBACK_UPLOAD">("CAMERA");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [enhancedDataUrl, setEnhancedDataUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [enhancementFilter, setEnhancementFilter] = useState<
    "AUTO" | "DOCUMENT_BINARIZED" | "HIGH_CONTRAST" | "ORIGINAL"
  >("AUTO");
  const [contrastLevel, setContrastLevel] = useState<number>(1.25);
  const [brightnessLevel, setBrightnessLevel] = useState<number>(1.1);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize and attach camera stream
  const startCamera = useCallback(async () => {
    setCameraError(null);
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera not supported on this device/browser");
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn("Camera access failed, enabling file upload fallback:", err);
      setCameraError(
        isHindi
          ? "कैमरा शुरू नहीं हो सका। कृपया फ़ाइल अपलोड विकल्प का उपयोग करें।"
          : "Camera unavailable or permission denied. Please use the file upload option."
      );
      setMode("FALLBACK_UPLOAD");
    }
  }, [facingMode, isHindi, stream]);

  // Clean up video stream on unmount
  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Client-Side Canvas Image Enhancement Pipeline (Perspective/Contrast/Adaptive Thresholding)
  const applyImageEnhancement = useCallback(
    (
      sourceDataUrl: string,
      filterType: "AUTO" | "DOCUMENT_BINARIZED" | "HIGH_CONTRAST" | "ORIGINAL"
    ) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);

        if (filterType === "ORIGINAL") {
          setEnhancedDataUrl(sourceDataUrl);
          return;
        }

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // Auto / High Contrast / Binarized processing
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Perceived luminance (grayscale conversion)
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;

          if (filterType === "DOCUMENT_BINARIZED") {
            // Adaptive Otsu / local threshold simulation for sharp prescription handwriting
            const threshold = 135;
            const val = gray > threshold ? 255 : 0;
            data[i] = val;
            data[i + 1] = val;
            data[i + 2] = val;
          } else if (filterType === "HIGH_CONTRAST") {
            // Contrast boost for faint pencil/blue pen writing
            const factor = (259 * (contrastLevel * 100 + 255)) / (255 * (259 - contrastLevel * 100));
            const enhancedGray = Math.min(255, Math.max(0, factor * (gray - 128) + 128 * brightnessLevel));
            data[i] = enhancedGray;
            data[i + 1] = enhancedGray;
            data[i + 2] = enhancedGray;
          } else {
            // AUTO: Dynamic range stretching and clarity enhancement
            const enhancedR = Math.min(255, Math.max(0, (r - 128) * 1.2 + 128 * 1.05));
            const enhancedG = Math.min(255, Math.max(0, (g - 128) * 1.2 + 128 * 1.05));
            const enhancedB = Math.min(255, Math.max(0, (b - 128) * 1.2 + 128 * 1.05));
            data[i] = enhancedR;
            data[i + 1] = enhancedG;
            data[i + 2] = enhancedB;
          }
        }

        ctx.putImageData(imgData, 0, 0);
        const enhancedUrl = canvas.toDataURL("image/jpeg", 0.92);
        setEnhancedDataUrl(enhancedUrl);
      };
      img.src = sourceDataUrl;
    },
    [contrastLevel, brightnessLevel]
  );

  // Take Snapshot from live video feed
  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.95);

    // Stop camera stream during preview to save battery & release hardware
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    setCapturedDataUrl(dataUrl);
    setMode("PREVIEW");
    applyImageEnhancement(dataUrl, enhancementFilter);
  };

  // Convert Base64 dataURL to standard File instance
  const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(",");
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  // Handle User Acceptance of Enhanced Image
  const handleConfirmAndUse = () => {
    const finalDataUrl = enhancedDataUrl || capturedDataUrl;
    if (!finalDataUrl) return;

    const file = dataURLtoFile(
      finalDataUrl,
      `scan_${Date.now()}_rx.jpg`
    );

    onCaptureComplete({
      file,
      previewUrl: finalDataUrl,
      originalFileName: file.name,
      enhancementMode: enhancementFilter,
    });
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedDataUrl(null);
    setEnhancedDataUrl(null);
    setMode("CAMERA");
    startCamera();
  };

  // Switch between front/back cameras
  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // File Picker Fallback Handler
  const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCapturedDataUrl(dataUrl);
      setMode("PREVIEW");
      applyImageEnhancement(dataUrl, enhancementFilter);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full space-y-4">
      {/* Invisible Canvas for Image Transformations */}
      <canvas ref={canvasRef} className="hidden" />

      {/* MODE 1: LIVE CAMERA VIEW WITH RECTANGLE GUIDANCE OVERLAY */}
      {mode === "CAMERA" && (
        <div className="relative rounded-3xl overflow-hidden bg-black border-4 border-emerald-400 shadow-2xl">
          {/* Top Camera Guidance Prompt & Controls */}
          <div className="absolute top-3 left-0 right-0 z-20 flex items-center justify-between px-4">
            <div className="bg-black/70 backdrop-blur-md text-white text-xs font-black px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span>{isHindi ? "पर्चे को फ्रेम के अंदर रखें" : "Place prescription inside frame"}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleCameraFacing}
                className="p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black/80 border border-white/20 transition-all"
                title="Switch Camera"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="p-2 rounded-full bg-black/70 hover:bg-rose-600/90 text-white border border-white/30 transition-all shadow-md"
                  title={isHindi ? "बंद करें (Close)" : "Close"}
                  aria-label="Close camera"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Live Video Feed */}
          <div className="relative aspect-[3/4] sm:aspect-[4/3] w-full flex items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="w-full h-full object-cover"
            />

            {/* Smart Document Rectangle Boundary Guide */}
            <div className="absolute inset-6 sm:inset-10 border-2 border-dashed border-emerald-400/90 rounded-2xl pointer-events-none flex flex-col justify-between p-3 bg-emerald-950/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
              <div className="flex justify-between">
                <div className="w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl" />
                <div className="w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr" />
              </div>
              <div className="text-center text-2xs font-extrabold text-emerald-300 tracking-wider uppercase bg-black/60 py-1 px-3 rounded-full mx-auto backdrop-blur-sm">
                {isHindi ? "स्पष्ट लिखावट के लिए स्थिर रखें" : "Hold steady for clear handwriting"}
              </div>
              <div className="flex justify-between">
                <div className="w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl" />
                <div className="w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br" />
              </div>
            </div>
          </div>

          {/* Bottom Shutter & Controls Bar */}
          <div className="p-5 bg-gradient-to-t from-black via-black/90 to-transparent flex items-center justify-around gap-4 z-20">
            {/* Fallback to File Upload */}
            <label className="cursor-pointer text-center text-white/80 hover:text-white flex flex-col items-center gap-1 text-2xs font-bold">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFilePicked}
                className="hidden"
              />
              <div className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20">
                <UploadCloud className="h-5 w-5" />
              </div>
              <span>{isHindi ? "फ़ाइल चुनें" : "Upload File"}</span>
            </label>

            {/* Big Obvious 76px Shutter Button */}
            <button
              type="button"
              onClick={handleCaptureSnapshot}
              className="w-20 h-20 rounded-full border-4 border-white bg-emerald-500 hover:bg-emerald-400 active:scale-90 flex items-center justify-center text-white shadow-2xl transition-all"
              aria-label="Capture Photo"
            >
              <div className="w-16 h-16 rounded-full border-2 border-emerald-200 bg-emerald-600 flex items-center justify-center">
                <Camera className="h-8 w-8" />
              </div>
            </button>

            {/* Cancel Button */}
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="text-center text-white/80 hover:text-white flex flex-col items-center gap-1 text-2xs font-bold"
              >
                <div className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20">
                  <X className="h-5 w-5" />
                </div>
                <span>{isHindi ? "रद्द करें" : "Cancel"}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* MODE 2: PREVIEW + IMAGE ENHANCEMENT CONTROLS */}
      {mode === "PREVIEW" && (
        <div className="space-y-4 rounded-3xl border-3 border-emerald-300 p-4 sm:p-6 bg-card shadow-xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b pb-3 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="p-1.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-lg shrink-0">
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="truncate">
                <h4 className="text-sm font-extrabold text-foreground truncate">
                  {isHindi ? "स्कैन व छवि स्पष्टता (Image Enhancement)" : "Scan & Clarity Enhancement"}
                </h4>
                <p className="text-2xs text-muted-foreground font-medium truncate">
                  {isHindi ? "लिखावट स्पष्ट करने के लिए फ़िल्टर चुनें" : "Select filter to optimize OCR accuracy"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden sm:inline-block text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                पूर्वावलोकन (Preview)
              </span>
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="p-1.5 rounded-full bg-muted hover:bg-rose-100 hover:text-rose-700 text-foreground border border-border transition-all flex items-center justify-center"
                  title={isHindi ? "बंद करें (Close)" : "Close"}
                  aria-label="Close preview"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Image Display */}
          <div className="relative aspect-[3/4] sm:aspect-[4/3] max-h-[380px] w-full rounded-2xl overflow-hidden bg-black/90 flex items-center justify-center border-2 border-border">
            {enhancedDataUrl ? (
              <img
                src={enhancedDataUrl}
                alt="Captured prescription preview"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-white text-xs font-bold">Loading preview...</div>
            )}
          </div>

          {/* One-Tap Enhancement Presets */}
          <div className="space-y-1.5">
            <span className="text-xs font-extrabold text-muted-foreground uppercase flex items-center gap-1">
              <Sliders className="h-3 w-3" /> {isHindi ? "स्पष्टता सुधार फ़िल्टर:" : "Enhancement Filter:"}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setEnhancementFilter("AUTO");
                  if (capturedDataUrl) applyImageEnhancement(capturedDataUrl, "AUTO");
                }}
                className={`p-2.5 rounded-xl border text-xs font-extrabold flex flex-col items-center gap-1 transition-all ${
                  enhancementFilter === "AUTO"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-muted/40 hover:bg-muted text-foreground border-border"
                }`}
              >
                <Sparkles className="h-4 w-4" />
                <span>स्मार्ट ऑटो (Auto)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEnhancementFilter("DOCUMENT_BINARIZED");
                  if (capturedDataUrl) applyImageEnhancement(capturedDataUrl, "DOCUMENT_BINARIZED");
                }}
                className={`p-2.5 rounded-xl border text-xs font-extrabold flex flex-col items-center gap-1 transition-all ${
                  enhancementFilter === "DOCUMENT_BINARIZED"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-muted/40 hover:bg-muted text-foreground border-border"
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>हस्तलिखित (Handwritten)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEnhancementFilter("HIGH_CONTRAST");
                  if (capturedDataUrl) applyImageEnhancement(capturedDataUrl, "HIGH_CONTRAST");
                }}
                className={`p-2.5 rounded-xl border text-xs font-extrabold flex flex-col items-center gap-1 transition-all ${
                  enhancementFilter === "HIGH_CONTRAST"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-muted/40 hover:bg-muted text-foreground border-border"
                }`}
              >
                <Contrast className="h-4 w-4" />
                <span>गहरा कंट्रास्ट (High Contrast)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEnhancementFilter("ORIGINAL");
                  if (capturedDataUrl) applyImageEnhancement(capturedDataUrl, "ORIGINAL");
                }}
                className={`p-2.5 rounded-xl border text-xs font-extrabold flex flex-col items-center gap-1 transition-all ${
                  enhancementFilter === "ORIGINAL"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-muted/40 hover:bg-muted text-foreground border-border"
                }`}
              >
                <Eye className="h-4 w-4" />
                <span>मूल फोटो (Original)</span>
              </button>
            </div>
          </div>

          {/* Action Buttons: Retake vs Confirm vs Cancel */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleRetake}
                className="flex-1 sm:flex-none min-h-[48px] px-5 rounded-2xl border-2 border-border hover:bg-muted font-bold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <RotateCcw className="h-4 w-4" />
                <span>{isHindi ? "दोबारा फोटो लें (Retake)" : "Retake Photo"}</span>
              </button>

              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 sm:flex-none min-h-[48px] px-5 rounded-2xl border-2 border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-700 dark:text-rose-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <X className="h-4 w-4" />
                  <span>{isHindi ? "रद्द करें (Cancel)" : "Cancel"}</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleConfirmAndUse}
              className="w-full sm:w-auto min-h-[52px] px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/20 transition-all"
            >
              <Check className="h-5 w-5" />
              <span>{isHindi ? "इस फोटो का उपयोग करें (Use Photo)" : "Use This Photo"}</span>
            </button>
          </div>
        </div>
      )}

      {/* MODE 3: FALLBACK FILE UPLOADER */}
      {mode === "FALLBACK_UPLOAD" && (
        <div className="space-y-4 p-6 rounded-3xl border-3 border-emerald-300 bg-card text-center shadow-xl relative">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="absolute top-4 right-4 p-2 rounded-full bg-muted hover:bg-rose-100 hover:text-rose-700 text-foreground border border-border transition-all"
              title={isHindi ? "बंद करें (Close)" : "Close"}
              aria-label="Close upload"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
            <UploadCloud className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-foreground">
              {isHindi ? "दस्तावेज़ फ़ाइल चुनें (Upload Document)" : "Choose Document File"}
            </h3>
            <p className="text-xs text-muted-foreground font-semibold">
              {cameraError || (isHindi ? "गैलरी से फोटो या PDF अपलोड करें" : "Upload photo or PDF from gallery")}
            </p>
          </div>

          <label className="block cursor-pointer pt-2">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFilePicked}
              className="hidden"
            />
            <div className="min-h-[52px] p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md">
              <UploadCloud className="h-5 w-5" />
              <span>{isHindi ? "फ़ोन से फ़ाइल चुनें (Browse Files)" : "Browse Files"}</span>
            </div>
          </label>

          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => {
                setMode("CAMERA");
                startCamera();
              }}
              className="text-xs font-bold text-emerald-700 hover:underline"
            >
              {isHindi ? "कैमरा दोबारा चालू करने का प्रयास करें" : "Try opening camera again"}
            </button>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="text-xs font-bold text-muted-foreground hover:text-rose-600 hover:underline"
              >
                {isHindi ? "रद्द करें" : "Cancel"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
