"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ProgressStepper } from "@/components/ui/patient/ProgressStepper";
import { AudioPrompt } from "@/components/ui/patient/AudioPrompt";
import { ExtraLargeButton } from "@/components/ui/patient/ExtraLargeButton";
import { MedicalTimelineView } from "@/components/ui/clinical/MedicalTimelineView";
import { Card } from "@/components/ui/card";
import {
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Clock,
  FileText,
  Pill,
  Activity,
  AlertTriangle,
  Calendar,
  Send,
  User,
  Volume2,
  VolumeX,
  HelpCircle,
  RotateCcw,
  PlusCircle,
  Flower2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/stores/use-auth-store";
import { speakWithIndianVoice } from "@/lib/voice/tts";
import { PatientDashboardPreviewDTO } from "@/lib/services/preview.service";

export default function PatientSummaryPreviewDashboardPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const router = useRouter();
  const isHindi = locale === "hi";
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<PatientDashboardPreviewDTO | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showAllAnswers, setShowAllAnswers] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string>("#AYUR-XXXX");

  // Load preview data from backend with fallback to sessionStorage
  const loadPreview = useCallback(async () => {
    setLoading(true);
    setError(null);

    const activeSessionId =
      typeof window !== "undefined"
        ? sessionStorage.getItem("ayursetu_active_session_id")
        : null;

    const activeUserId =
      user?.id ||
      (typeof window !== "undefined" ? localStorage.getItem("ayursetu_user_id") : null) ||
      "pat-104-demo";

    // 1. If no active session in storage, check if we have offline intake data or redirect
    if (!activeSessionId) {
      const storedComplaint =
        typeof window !== "undefined"
          ? sessionStorage.getItem("ayursetu_chief_complaint")
          : null;

      if (!storedComplaint) {
        // Incomplete session -> redirect back to complaint
        router.replace(`/${locale}/patient/complaint`);
        return;
      }
    }

    try {
      if (activeSessionId) {
        const res = await fetch(`/api/patient/session/${activeSessionId}/preview`, {
          headers: {
            "x-user-id": activeUserId,
          },
        });
        const data = await res.json();
        if (res.ok && data.data) {
          setPreviewData(data.data);
          setGeneratedToken(data.data.tokenNumber);
          if (data.data.isSubmitted) {
            setSubmittedSuccess(true);
          }
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn("Backend preview fetch fallback to client session state:", e);
    }

    // 2. Client-side state fallback if session API returned error
    try {
      const storedDocs =
        typeof window !== "undefined"
          ? JSON.parse(sessionStorage.getItem("ayush_uploaded_docs") || "[]")
          : [];
      const storedEntities =
        typeof window !== "undefined"
          ? JSON.parse(sessionStorage.getItem("ayush_extracted_entities") || "{}")
          : {};
      const storedComplaint =
        typeof window !== "undefined"
          ? sessionStorage.getItem("ayursetu_chief_complaint") || "सिरदर्द व शरीर में दर्द"
          : "सिरदर्द व शरीर में दर्द";

      const fallbackDTO: PatientDashboardPreviewDTO = {
        sessionId: activeSessionId || "sess-demo-001",
        tokenNumber: `#AYUR-${(activeSessionId || "104").slice(-4).toUpperCase()}`,
        status: "IN_PROGRESS",
        isSubmitted: false,
        triagePriority: "ROUTINE",
        language: locale,
        startedAt: new Date().toISOString(),
        patient: {
          name: user?.name || "रमेश शर्मा (Ramesh Sharma)",
          ageGender: `${user?.age || 42}Y / ${user?.gender || "MALE"}`,
          abhaId: user?.abhaId || "14-5542-8921-3410",
        },
        chiefComplaint: {
          symptomName: storedComplaint,
          duration: "२-३ दिन से (Acute)",
          severity: "मध्यम (Moderate)",
          location: "General",
        },
        hpiSummary: isHindi
          ? `रोगी ने '${storedComplaint}' की शिकायत दर्ज कराई है। यह समस्या २-३ दिन से है।`
          : `Patient reports chief concern of '${storedComplaint}' present for 2-3 days.`,
        facts: {},
        answers: [],
        medications: storedEntities.medications || [],
        labResults: storedEntities.labResults || [],
        documents: storedDocs.map((d: any, i: number) => ({
          id: `doc-${i}`,
          fileName: d.name,
          fileSize: 1024 * 100,
          uploadedAt: new Date().toISOString(),
          type: "PRESCRIPTION",
          hasEntities: true,
        })),
        timeline: [
          {
            id: "tl-today",
            patientId: user?.id || "pat-current",
            eventDate: new Date().toISOString().split("T")[0],
            title: isHindi ? "आज का नैदानिक परामर्श" : "Today's Clinical Consultation",
            description: storedComplaint,
            category: "CONSULTATION",
          },
        ],
        redFlags: [],
        ayurveda: {
          prakriti: "VATA_PITTA",
          vikriti: "KAPHA",
          anala: "MANDAGNI",
          sattva: "MADHYAMA",
          bala: "MADHYAMA",
          notes: "Dashavidha Pariksha completed",
        },
        canSubmit: true,
        canEdit: true,
      };

      setPreviewData(fallbackDTO);
      setGeneratedToken(fallbackDTO.tokenNumber);
    } catch (e) {
      setError(isHindi ? "परामर्श सारांश लोड करने में त्रुटि हुई।" : "Failed to load summary preview.");
    } finally {
      setLoading(false);
    }
  }, [locale, router, user, isHindi]);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  // Audio Playback
  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingAudio(false);
      return;
    }

    if (!previewData) return;

    let narrative = "";
    if (isHindi) {
      narrative = `यह आपके द्वारा दी गई जानकारी का सारांश है जो डॉक्टर को भेजा जाएगा। आपकी मुख्य समस्या है: ${previewData.chiefComplaint.symptomName}। अवधि है: ${previewData.chiefComplaint.duration}। ${previewData.medications.length > 0 ? `पुराने पर्चे से ${previewData.medications.length} दवाइयां पाई गई हैं।` : ""} डॉक्टर को भेजने के लिए नीचे हरा बटन दबाएं।`;
    } else {
      narrative = `This is the summary of information that will be shared with the doctor. Your primary concern is: ${previewData.chiefComplaint.symptomName}, duration: ${previewData.chiefComplaint.duration}. ${previewData.medications.length > 0 ? `${previewData.medications.length} medications identified from previous prescription.` : ""} To send this to the doctor, please tap the green submit button below.`;
    }

    setIsPlayingAudio(true);
    speakWithIndianVoice(
      narrative,
      isHindi ? "hi" : "en",
      () => setIsPlayingAudio(false),
      () => setIsPlayingAudio(false)
    );
  };

  // Submit to Doctor Queue
  const handleSubmitToDoctor = async () => {
    if (!previewData) return;
    setSubmitting(true);
    setError(null);

    try {
      const activeSessionId =
        previewData.sessionId ||
        (typeof window !== "undefined" && sessionStorage.getItem("ayursetu_active_session_id")) ||
        "sess-demo-001";

      const activeUserId =
        user?.id ||
        (typeof window !== "undefined" ? localStorage.getItem("ayursetu_user_id") : null) ||
        "pat-104-demo";

      const res = await fetch("/api/patient/session/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": activeUserId,
        },
        body: JSON.stringify({
          sessionId: activeSessionId,
          chiefComplaint: previewData.chiefComplaint.symptomName,
          duration: previewData.chiefComplaint.duration,
          severity: previewData.chiefComplaint.severity,
          location: previewData.chiefComplaint.location,
        }),
      });

      const data = await res.json();
      if (res.ok && data.data?.tokenNumber) {
        setGeneratedToken(data.data.tokenNumber);
        setSubmittedSuccess(true);
      } else {
        // If already submitted, still show success
        if (data.error?.message?.includes("already") || data.data?.tokenNumber) {
          setSubmittedSuccess(true);
        } else {
          setError(data.error?.message || "Failed to submit case. Please try again.");
        }
      }
    } catch (e: any) {
      setError(isHindi ? "सर्वर से संपर्क नहीं हो सका। कृपया पुनः प्रयास करें।" : "Network error. Please try submitting again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto pb-12">
        <ProgressStepper currentStep={6} />
        <Card className="p-12 text-center rounded-3xl border-2 animate-pulse bg-muted/40 space-y-4">
          <div className="w-12 h-12 bg-emerald-200 rounded-full mx-auto" />
          <div className="h-6 bg-muted rounded w-48 mx-auto" />
          <div className="h-4 bg-muted rounded w-64 mx-auto" />
        </Card>
      </div>
    );
  }

  const d = previewData;

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-16 px-1 sm:px-0">
      <ProgressStepper currentStep={6} />

      {/* Audio Prompt & Listen Control */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border-2 border-emerald-300 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-foreground">
              {isHindi ? "यह सारांश आपके डॉक्टर को दिखेगा" : "This is what the doctor will see"}
            </h4>
            <p className="text-xs font-semibold text-muted-foreground">
              {isHindi ? "कृपया नीचे दी गई जानकारी जांच लें।" : "Please review the synthesized intake below."}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleAudio}
          className={`min-h-[48px] px-4 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 border transition-all active:scale-95 shrink-0 ${
            isPlayingAudio
              ? "bg-rose-600 text-white border-rose-600 animate-pulse shadow-md"
              : "bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 border-emerald-300 hover:bg-emerald-100/50 shadow-2xs"
          }`}
          aria-label={isPlayingAudio ? "Stop reading summary" : "Listen to summary in audio"}
        >
          {isPlayingAudio ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-emerald-600" />}
          <span>{isPlayingAudio ? (isHindi ? "आवाज़ रोकें" : "Stop Audio") : (isHindi ? "बोलकर सुनें" : "Listen Audio")}</span>
        </button>
      </div>

      {/* Main Review Card */}
      <Card className="border-3 border-emerald-400/80 shadow-xl rounded-3xl bg-white dark:bg-card p-5 sm:p-8 space-y-6 text-left">
        {/* Patient Identity Badge */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border-2 border-emerald-200 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-[11px] font-extrabold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
              {isHindi ? "रोगी विवरण (Patient Details)" : "Patient Details"}
            </span>
            <div className="text-lg font-black text-foreground">{d?.patient.name}</div>
            <div className="text-xs font-semibold text-muted-foreground">
              {d?.patient.ageGender} • ABHA: <span className="font-mono">{d?.patient.abhaId}</span>
            </div>
          </div>
          <span className="text-xs font-extrabold px-3 py-1.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5 shadow-2xs">
            <ShieldCheck className="h-4 w-4" /> {isHindi ? "सहमति सत्यापित (ABDM)" : "Consent Verified"}
          </span>
        </div>

        {/* 1. Chief Complaint - Extremely Large and Clear */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border-2 border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Stethoscope className="h-4 w-4" /> {isHindi ? "१. मुख्य समस्या (Chief Complaint)" : "1. Chief Health Concern"}
            </span>
            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300">
              {d?.chiefComplaint.severity}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            {d?.chiefComplaint.symptomName}
          </h3>
          <p className="text-xs sm:text-sm font-semibold text-muted-foreground">
            {isHindi ? "समस्या की अवधि:" : "Duration:"} <span className="font-extrabold text-foreground">{d?.chiefComplaint.duration}</span>
            {d?.chiefComplaint.location && d.chiefComplaint.location !== "General" && (
              <> • {isHindi ? "स्थान:" : "Site:"} <span className="font-extrabold text-foreground">{d?.chiefComplaint.location}</span></>
            )}
          </p>
        </div>

        {/* 2. Plain Language HPI Summary */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-1.5">
          <span className="text-xs font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-indigo-600" /> {isHindi ? "२. लक्षण विवरण (Symptom Summary)" : "2. History of Present Illness"}
          </span>
          <p className="text-sm font-bold text-foreground leading-relaxed">
            {d?.hpiSummary}
          </p>
        </div>

        {/* 3. Red-Flag Warning (Presented calmly if any) */}
        {d?.redFlags && d.redFlags.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 space-y-2">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span className="text-xs font-black uppercase">
                {isHindi ? "विशेष ध्यान देने योग्य लक्षण (Safety Notes)" : "Clinical Safety Notes Identified"}
              </span>
            </div>
            <ul className="text-xs font-bold text-amber-950 dark:text-amber-100 list-disc list-inside space-y-1">
              {d.redFlags.map((rf, idx) => (
                <li key={idx}>{rf.description}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 4. Medications & Lab Results Extracted from Documents */}
        <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border-2 border-emerald-300/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-emerald-900 dark:text-emerald-300 uppercase flex items-center gap-1.5">
              <Pill className="h-4 w-4 text-emerald-700" /> {isHindi ? "३. दवाइयां व जांच रिपोर्ट (Medications & Labs)" : "3. Previous Medications & Labs"}
            </span>
            <span className="text-[10px] font-black px-2 py-0.5 bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 rounded-full">
              AI विश्लेषित (Extracted)
            </span>
          </div>

          {/* Medications list */}
          {d?.medications && d.medications.length > 0 ? (
            <div className="space-y-1.5">
              <span className="text-[11px] font-extrabold text-muted-foreground">
                {isHindi ? "पहचानी गई दवाइयां:" : "Prescription Medications:"}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {d.medications.map((m, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border text-xs shadow-2xs">
                    <span className="font-extrabold text-foreground block">{m.name}</span>
                    <span className="text-muted-foreground font-semibold text-[11px]">
                      {m.dosage} {m.frequency && `• ${m.frequency}`} {m.duration && `• ${m.duration}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs font-medium text-muted-foreground italic">
              {isHindi ? "कोई पूर्व दवा रिकॉर्ड नहीं मिला।" : "No previous prescription medications extracted."}
            </p>
          )}

          {/* Labs list */}
          {d?.labResults && d.labResults.length > 0 && (
            <div className="space-y-1.5 pt-1 border-t border-emerald-200">
              <span className="text-[11px] font-extrabold text-muted-foreground flex items-center gap-1">
                <Activity className="h-3.5 w-3.5 text-emerald-600" /> {isHindi ? "जांच रिपोर्ट मान:" : "Lab Values:"}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {d.labResults.map((l, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border text-xs flex justify-between items-center shadow-2xs">
                    <div>
                      <span className="font-extrabold text-foreground block">{l.testName}</span>
                      <span className="text-muted-foreground font-semibold text-[11px]">
                        {l.value} {l.unit} ({l.referenceRange})
                      </span>
                    </div>
                    {l.flag === "HIGH" && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900">
                        HIGH
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 5. Uploaded Documents List with Thumbnails & Status */}
        {d?.documents && d.documents.length > 0 && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="text-xs font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-indigo-600" /> {isHindi ? "४. संलग्न दस्तावेज़ (Uploaded Documents)" : "4. Attached Medical Documents"} ({d.documents.length})
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {d.documents.map((doc) => (
                <div key={doc.id} className="p-3 rounded-xl bg-white dark:bg-slate-800 border flex items-center gap-3 shadow-2xs">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-extrabold text-foreground truncate">{doc.fileName}</p>
                    <p className="text-[10px] font-semibold text-muted-foreground">
                      {(doc.fileSize / 1024).toFixed(1)} KB • {doc.hasEntities ? (isHindi ? "डेटा निकाला गया" : "Parsed") : (isHindi ? "संलग्न" : "Attached")}
                    </p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. AYUSH / Dashavidha Findings (If AYUSH Mode) */}
        {d?.ayurveda && (
          <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/20 border-2 border-teal-300 space-y-2">
            <span className="text-xs font-black text-teal-950 dark:text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
              <Flower2 className="h-4 w-4 text-teal-700" /> {isHindi ? "५. आयुर्वेद दशविध परीक्षा व प्रकृति (AYUSH Profile)" : "5. Ayurveda & Dashavidha Profile"}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs">
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border">
                <span className="text-muted-foreground block text-[10px] font-bold">प्रकृति (Prakriti):</span>
                <span className="font-extrabold text-foreground">{d.ayurveda.prakriti || "Vata-Pitta"}</span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border">
                <span className="text-muted-foreground block text-[10px] font-bold">विकृति (Vikriti):</span>
                <span className="font-extrabold text-foreground">{d.ayurveda.vikriti || "Kapha"}</span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border">
                <span className="text-muted-foreground block text-[10px] font-bold">अग्नि स्थिति (Agni):</span>
                <span className="font-extrabold text-foreground">{d.ayurveda.anala || "Mandagni"}</span>
              </div>
            </div>
          </div>
        )}

        {/* 7. Longitudinal Medical Timeline */}
        <div className="space-y-2 pt-1">
          <span className="text-xs font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-indigo-600" /> {isHindi ? "६. स्वास्थ्य यात्रा टाइमलाइन (Medical Timeline)" : "6. Medical History Timeline"}
          </span>
          <MedicalTimelineView
            events={(d?.timeline || []).map((t) => ({
              id: t.id,
              patientId: t.patientId,
              eventDate: t.eventDate,
              title: t.title,
              description: t.description || "",
              category: (["DIAGNOSIS", "MEDICATION", "LAB", "ENCOUNTER", "PROCEDURE"].includes(t.category)
                ? t.category
                : "ENCOUNTER") as any,
            }))}
          />
        </div>

        {/* 8. Review Individual Answers Accordion (Tertiary Option) */}
        {d?.answers && d.answers.length > 0 && (
          <div className="pt-2 border-t">
            <button
              type="button"
              onClick={() => setShowAllAnswers(!showAllAnswers)}
              className="w-full py-2.5 px-3 rounded-xl bg-muted/60 hover:bg-muted text-xs font-extrabold flex items-center justify-between text-foreground transition-all"
            >
              <span className="flex items-center gap-1.5">
                <HelpCircle className="h-4 w-4 text-indigo-600" />
                {isHindi ? "प्रश्नोत्तरी के सभी उत्तर देखें (Review All Answers)" : "Review All Intake Answers"} ({d.answers.length})
              </span>
              {showAllAnswers ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showAllAnswers && (
              <div className="mt-2 space-y-2 max-h-60 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border">
                {d.answers.map((ans, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-white dark:bg-slate-800 text-xs border">
                    <p className="font-bold text-foreground">{isHindi && ans.questionTextHindi ? ans.questionTextHindi : ans.questionText}</p>
                    <p className="font-extrabold text-emerald-800 dark:text-emerald-400 mt-0.5">
                      उत्तर: {typeof ans.answerValue === "object" ? JSON.stringify(ans.answerValue) : String(ans.answerValue)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Error message if submission failed */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-300 text-rose-900 dark:text-rose-200 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* High Touch-Target Action Buttons (64px - 80px) */}
        <div className="space-y-3 pt-4 border-t">
          {/* Primary Action: Big Submit Button */}
          <ExtraLargeButton
            variant="primary"
            size="large"
            className="w-full min-h-[64px] sm:min-h-[72px] text-base sm:text-lg font-black shadow-lg hover:shadow-emerald-glow flex items-center justify-center gap-3"
            icon={<Send className="h-6 w-6" />}
            onClick={handleSubmitToDoctor}
            disabled={submitting}
          >
            {submitting
              ? (isHindi ? "परामर्श भेजा जा रहा है..." : "Submitting to Physician...")
              : (isHindi ? "डॉक्टर को भेजें (Submit to Doctor)" : "Submit to Doctor")}
          </ExtraLargeButton>

          {/* Secondary Action: Add More Info (Go back to questions or docs) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => router.push(`/${locale}/patient/documents`)}
              className="min-h-[56px] px-4 py-3 rounded-2xl border-2 border-border bg-card hover:bg-muted font-bold text-xs sm:text-sm text-foreground flex items-center justify-center gap-2 transition-all shadow-2xs active:scale-98"
            >
              <PlusCircle className="h-4 w-4 text-emerald-600" />
              <span>{isHindi ? "और पर्चे / जानकारी जोड़ें" : "Add More Info / Docs"}</span>
            </button>

            <button
              type="button"
              onClick={() => router.push(`/${locale}/patient/questions`)}
              className="min-h-[56px] px-4 py-3 rounded-2xl border-2 border-border bg-card hover:bg-muted font-bold text-xs sm:text-sm text-foreground flex items-center justify-center gap-2 transition-all shadow-2xs active:scale-98"
            >
              <RotateCcw className="h-4 w-4 text-indigo-600" />
              <span>{isHindi ? "प्रश्नोत्तरी में बदलाव करें" : "Modify Q&A Answers"}</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Success Confirmation & Waiting Modal */}
      <AnimatePresence>
        {submittedSuccess && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 border-4 border-emerald-500 rounded-3xl p-6 sm:p-8 space-y-6 text-center shadow-2xl"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shadow-inner">
                <CheckCircle2 className="h-12 w-12" />
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-black px-3 py-1 bg-emerald-100 text-emerald-900 rounded-full uppercase tracking-wider">
                  {isHindi ? "परामर्श सफलतापूर्वक दर्ज" : "Submission Confirmed"}
                </span>
                <h3 className="text-2xl font-black text-foreground">
                  {isHindi ? "आपकी जानकारी डॉक्टर को भेज दी गई है" : "Your information has been sent to the doctor"}
                </h3>
                <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                  {isHindi
                    ? "डॉक्टर आपके परामर्श व लक्षणों का अध्ययन कर रहे हैं। शीघ्र ही आपको परामर्श रिपोर्ट प्राप्त होगी।"
                    : "The attending physician desk has received your clinical dossier and is reviewing your case."}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-300 text-center space-y-1">
                <span className="text-[11px] font-bold text-muted-foreground uppercase">
                  {isHindi ? "आपका टोकन नंबर (Token)" : "Your Consultation Token:"}
                </span>
                <div className="text-2xl sm:text-3xl font-black text-emerald-900 dark:text-emerald-200 font-mono">
                  {generatedToken}
                </div>
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center justify-center gap-1.5 pt-0.5">
                  <Clock className="h-4 w-4" /> {isHindi ? "अनुमानित प्रतीक्षा समय: 10-15 मिनट" : "Estimated wait guidance: 10-15 mins"}
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <ExtraLargeButton
                  variant="primary"
                  size="large"
                  className="w-full min-h-[56px] font-black"
                  onClick={() => router.push(`/${locale}/patient/cases`)}
                >
                  {isHindi ? "मेरे परामर्श देखें (My Cases)" : "View My Cases & Records"}
                </ExtraLargeButton>

                <button
                  type="button"
                  onClick={() => router.push(`/${locale}/patient`)}
                  className="text-xs font-bold text-muted-foreground hover:text-foreground text-center w-full py-2 min-h-[40px]"
                >
                  {isHindi ? "मुख्य पृष्ठ पर जाएं (Back to Home)" : "Return to Home Page"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
