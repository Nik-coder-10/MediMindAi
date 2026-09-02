"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ExtraLargeButton } from "@/components/ui/patient/ExtraLargeButton";
import { MedicalTimelineView } from "@/components/ui/clinical/MedicalTimelineView";
import { speakWithIndianVoice } from "@/lib/voice/tts";
import {
  Stethoscope,
  AlertTriangle,
  FileText,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Edit3,
  Calendar,
  Activity,
  Pill,
  Sparkles,
  ArrowLeft,
  Share2,
  Lock,
  Phone,
  Eye,
  Loader2,
  Check,
  Volume2,
  VolumeX,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/use-auth-store";

export default function IndividualDoctorCaseViewPage({
  params,
}: {
  params: { locale: string; sessionId: string };
}) {
  const router = useRouter();
  const sessionId = params.sessionId;
  const [caseData, setCaseData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"SUMMARY" | "INSIGHTS" | "TIMELINE" | "LABS" | "AYUSH" | "DOCS" | "PRESCRIPTION" | "ANSWERS">("SUMMARY");
  const [editedMarkdown, setEditedMarkdown] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isPlayingSummaryAudio, setIsPlayingSummaryAudio] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Doctor Sign-in & Authentication State
  const [doctorAuth, setDoctorAuth] = useState<{
    isSignedIn: boolean;
    name: string;
    regNumber: string;
    specialty: string;
    hospital: string;
  }>({
    isSignedIn: true,
    name: "Dr. Arvind K. Sharma (MD, BAMS)",
    regNumber: "AYUSH-REG-DL-2024-9842",
    specialty: "Senior Vaidya & Consultant Physician",
    hospital: "All India Institute of Ayurveda (AIIA), New Delhi",
  });

  const [showDoctorLoginModal, setShowDoctorLoginModal] = useState(false);
  const [tempDoctorName, setTempDoctorName] = useState(doctorAuth.name);
  const [tempDoctorReg, setTempDoctorReg] = useState(doctorAuth.regNumber);
  const [tempSpecialty, setTempSpecialty] = useState(doctorAuth.specialty);
  const [tempHospital, setTempHospital] = useState(doctorAuth.hospital);


  // Doctor's Official Prescription & Clinical Report State
  const [doctorRxNotes, setDoctorRxNotes] = useState(
    "Patient presented with acute retrosternal chest discomfort and chronic Amavata joint stiffness. ECG and Stat cardiac markers advised immediately. Continue supportive Ayurvedic formulations with strict dietary restrictions."
  );
  const [doctorPrescriptions, setDoctorPrescriptions] = useState([
    { name: "Tab Yogaraj Guggulu 500mg", dosage: "1 Tab", frequency: "1-0-1 (BD)", duration: "15 Days", instructions: "With lukewarm water after meals" },
    { name: "Syp Amritarishta 15ml", dosage: "15ml (2 tsp)", frequency: "1-0-1 (BD)", duration: "15 Days", instructions: "Mixed with equal water after food" },
    { name: "Cap Omeprazole 20mg", dosage: "1 Cap", frequency: "1-0-0 (OD)", duration: "10 Days", instructions: "Empty stomach morning" },
  ]);
  const [doctorInvestigations, setDoctorInvestigations] = useState(
    "12-Lead ECG (Stat), Cardiac Troponin I, Repeat HbA1c & Lipid Profile at 4 weeks."
  );
  const [doctorDietAdvice, setDoctorDietAdvice] = useState(
    "Pathya: Fresh warm light diet (Mudga Yusha), ginger water. Strictly avoid curd, heavy fried foods, and cold drinks (Apathya)."
  );
  const [doctorFollowUp, setDoctorFollowUp] = useState("After 7 days or SOS if chest symptoms recur.");
  const [newRxName, setNewRxName] = useState("");
  const [newRxDose, setNewRxDose] = useState("");
  const [newRxFreq, setNewRxFreq] = useState("1-0-1");
  const [newRxDuration, setNewRxDuration] = useState("15 Days");


  const { user } = useAuthStore();

  useEffect(() => {
    async function loadCase() {
      setLoading(true);
      try {
        const activeDoctorId = user?.id || (typeof window !== "undefined" ? localStorage.getItem("ayursetu_user_id") : null) || "doc-8842-demo";
        const res = await fetch(`/api/doctor/case/${sessionId}`, {
          headers: {
            "x-user-id": activeDoctorId,
          },
        });
        const data = await res.json();
        if (data.data) {
          setCaseData(data.data);
          setEditedMarkdown(
            data.data.summary?.doctorEditedMarkdown || data.data.summary?.aiGeneratedMarkdown || ""
          );
        }
      } finally {
        setLoading(false);
      }
    }
    loadCase();
  }, [sessionId, user?.id]);

  const handleAccept = async () => {
    setLoading(true);
    try {
      const activeDoctorId = "doc-8842-demo";
      const res = await fetch(`/api/doctor/summary/${sessionId}/accept`, {
        method: "POST",
        headers: {
          "x-user-id": activeDoctorId,
        },
      });
      const data = await res.json();
      setCaseData((prev: any) => ({ ...prev, summary: data.data }));
      setActionSuccess("क्लिनिकल सारांश हस्ताक्षरित व स्वीकृत (Case Signed Off)");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    setLoading(true);
    try {
      const activeDoctorId = "doc-8842-demo";
      const res = await fetch(`/api/doctor/summary/${sessionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": activeDoctorId,
        },
        body: JSON.stringify({
          doctorEditedMarkdown: editedMarkdown,
          status: "REVISED",
        }),
      });
      const data = await res.json();
      setCaseData((prev: any) => ({ ...prev, summary: data.data }));
      setIsEditing(false);
      setActionSuccess("चिकित्सक संशोधन सहेजे गए (Physician Edits Saved)");
    } finally {
      setLoading(false);
    }
  };

  if (!caseData && loading) {
    return (
      <div className="container py-20 text-center space-y-3">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mx-auto" />
        <p className="text-sm font-bold text-muted-foreground">रोगी केस लोड हो रहा है (Loading dossier...)</p>
      </div>
    );
  }

  const patient = caseData?.patient || {
    firstName: "अज्ञात",
    lastName: "रोगी (Unknown Patient)",
    age: 0,
    gender: "UNKNOWN",
    bloodGroup: "N/A",
    abhaId: "N/A",
  };
  const isEmergency = caseData?.encounter?.triagePriority === "EMERGENCY";

  return (
    <div className="container max-w-7xl py-6 space-y-6 pb-24">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push(`/${params.locale}/doctor`)}
          className="text-xs font-bold text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-lg border bg-card"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>कतार पर वापस जाएं (Back to Queue)</span>
        </button>

        <div className="flex items-center gap-2">
          {caseData?.tokenNumber && (
            <span className="text-xs font-black px-3 py-1 bg-indigo-100 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200 rounded-full font-mono border border-indigo-300">
              टोकन: {caseData.tokenNumber}
            </span>
          )}
          <span className="text-xs font-extrabold px-3 py-1 bg-slate-100 dark:bg-slate-800 text-muted-foreground rounded-full">
            सत्र आईडी: {sessionId}
          </span>
        </div>
      </div>

      {/* Prominent Patient Banner (Never below fold) */}
      <Card
        className={`p-6 rounded-3xl border-3 shadow-md space-y-4 ${
          isEmergency
            ? "border-rose-400 bg-rose-50/50 dark:bg-rose-950/20"
            : "border-emerald-300 bg-emerald-50/30"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              {caseData?.tokenNumber && (
                <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white font-mono shadow-xs">
                  {caseData.tokenNumber}
                </span>
              )}
              <span
                className={`text-xs font-extrabold px-3 py-0.5 rounded-full border ${
                  isEmergency ? "bg-rose-600 text-white border-rose-300 animate-pulse" : "bg-emerald-600 text-white"
                }`}
              >
                {caseData?.encounter?.triagePriority || "ROUTINE"}
              </span>
              <span className="text-xs font-bold text-muted-foreground">ABHA ID: {patient.abhaId}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
              {patient.firstName} {patient.lastName} • {patient.age}Y / {patient.gender} ({patient.bloodGroup})
            </h1>

            <p className="text-sm font-semibold text-foreground">
              <span className="text-muted-foreground font-medium">मुख्य लक्षण: </span>
              {caseData?.encounter?.chiefComplaint}
            </p>
          </div>

          {/* ABDM & Consent Pill */}
          <div className="text-right space-y-1">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> ABDM सक्रिय सहमति (Consent Granted)
            </span>
          </div>
        </div>

        {/* Critical Red Flag Callout Banner */}
        {caseData?.redFlags?.length > 0 && (
          <div className="p-4 rounded-2xl bg-rose-100 dark:bg-rose-950/50 border-2 border-rose-400 text-rose-950 dark:text-rose-200 flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="text-xs font-extrabold uppercase tracking-wide">
                🚨 आपातकालीन चेतावनी (Critical Red-Flags Detected):
              </span>
              {caseData.redFlags.map((rf: any, i: number) => (
                <p key={i} className="text-xs sm:text-sm font-bold">
                  • [{rf.ruleId}] {rf.description}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* ⚠️ Drug-Drug & Drug-Allergy Safety Cross-Check Banner */}
        {caseData?.drugSafetyAlerts?.length > 0 && (
          <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 text-amber-950 dark:text-amber-200 space-y-3 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-300 dark:border-amber-800 pb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <span className="text-sm font-black uppercase tracking-wide">
                  ⚠️ दवा परस्पर-क्रिया व एलर्जी चेतावनी (Drug Interactions & Allergy Alerts)
                </span>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 w-fit">
                {caseData.drugSafetyAlerts.length} संभावित परस्पर-क्रिया चिन्हित
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {caseData.drugSafetyAlerts.map((alert: any, i: number) => (
                <div
                  key={i}
                  className={`p-4 rounded-xl border-2 space-y-2 bg-white dark:bg-slate-900 ${
                    alert.severity === "CRITICAL"
                      ? "border-rose-400 dark:border-rose-800"
                      : "border-amber-300 dark:border-amber-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-md inline-block uppercase ${
                          alert.severity === "CRITICAL"
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                            : alert.severity === "MAJOR"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                        }`}
                      >
                        {alert.severity} • {alert.category === "DRUG_ALLERGY" ? "एलर्जी (Allergy)" : "DDI"}
                      </span>
                      <h4 className="text-xs font-black text-foreground pt-1">{alert.title}</h4>
                      <p className="text-[11px] font-bold text-muted-foreground">{alert.titleHindi}</p>
                    </div>
                  </div>

                  <p className="text-xs text-foreground font-medium leading-relaxed">
                    {alert.clinicalMechanism}
                  </p>

                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-[11px] font-semibold text-foreground space-y-1">
                    <div>
                      <span className="font-bold text-amber-800 dark:text-amber-400">चिकित्सक परामर्श: </span>
                      <span>{alert.physicianAdvisory}</span>
                    </div>
                    <div>
                      <span className="font-bold text-indigo-700 dark:text-indigo-400">अनुशंसित कदम: </span>
                      <span>{alert.recommendedAction}</span>
                    </div>
                  </div>

                  {/* Doctor Dismissal & Review Action Controls */}
                  <div className="pt-2 border-t flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] text-muted-foreground font-bold">
                      संबंधित: {alert.involvedSubstances.join(" + ")}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await fetch("/api/doctor/safety", {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                                "x-user-id": user?.id || "doc-8842-demo",
                              },
                              body: JSON.stringify({
                                sessionId,
                                alertId: alert.id,
                                action: "REVIEWED_NO_ACTION_NEEDED",
                                clinicalNote: "Physician verified interaction profile.",
                              }),
                            });
                            alert.isDismissed = true;
                            setActionSuccess(`चेतावनी '${alert.title}' की समीक्षा दर्ज की गई (No Action Needed)`);
                          } catch (e) {
                            alert("समीक्षा सहेजने में त्रुटि हुई");
                          }
                        }}
                        className="text-[11px] font-bold px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-foreground transition-all"
                      >
                        ✓ समीक्षा संपन्न (Acknowledge)
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const note = window.prompt("चिकित्सकीय कार्रवाई दर्ज करें (e.g. Changed to Pantoprazole / adjusted dose):", "Prescription revised accordingly");
                          if (note) {
                            try {
                              await fetch("/api/doctor/safety", {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                  "x-user-id": user?.id || "doc-8842-demo",
                                },
                                body: JSON.stringify({
                                  sessionId,
                                  alertId: alert.id,
                                  action: "ACTION_TAKEN",
                                  clinicalNote: note,
                                }),
                              });
                              alert.isDismissed = true;
                              setActionSuccess(`कार्रवाई दर्ज की गई: ${note}`);
                            } catch (e) {
                              alert("कार्रवाई सहेजने में त्रुटि हुई");
                            }
                          }
                        }}
                        className="text-[11px] font-bold px-2 py-1 rounded-md bg-emerald-100 hover:bg-emerald-200 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 transition-all"
                      >
                        ⚡ कार्रवाई की गई (Action Taken)
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Case Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b pb-2">
        {[
          { id: "SUMMARY", label: "क्लिनिकल सारांश (Summary)", icon: <FileText className="h-4 w-4" /> },
          { id: "INSIGHTS", label: "💡 क्लिनिकल अंतर्दृष्टि (Clinical Insights)", icon: <Sparkles className="h-4 w-4 text-amber-500" /> },
          { id: "PRESCRIPTION", label: "🩺 चिकित्सक नुस्खा व OPD रिपोर्ट (Rx & Report)", icon: <Stethoscope className="h-4 w-4" /> },
          { id: "ANSWERS", label: "प्रश्नोत्तरी उत्तर (Q&A)", icon: <Activity className="h-4 w-4" /> },
          { id: "TIMELINE", label: "इतिहास (Timeline)", icon: <Calendar className="h-4 w-4" /> },
          { id: "LABS", label: "जांच रिपोर्ट (Abnormal Labs)", icon: <Activity className="h-4 w-4" /> },
          { id: "AYUSH", label: "आयुर्वेद दशविध (AYUSH)", icon: <Sparkles className="h-4 w-4" /> },
          { id: "DOCS", label: "दस्तावेज़ (Documents)", icon: <Pill className="h-4 w-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`min-h-[44px] px-4 rounded-2xl text-xs font-extrabold inline-flex items-center gap-2 transition-all shrink-0 ${
              activeTab === tab.id
                ? "bg-ayush-green text-white shadow-xs"
                : "bg-card text-muted-foreground hover:text-foreground border"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>


      {/* Tab Content Display */}
      <div className="space-y-6">
        {/* Tab 1: Clinical Summary */}
        {activeTab === "SUMMARY" && (
              <Card className="p-6 sm:p-8 rounded-3xl border-2 border-input space-y-4 bg-card shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
                  <div className="space-y-1">
                    <span className="text-sm font-extrabold text-foreground flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-emerald-600" />
                      {isEditing ? "संशोधन मोड (Editing Mode)" : "AI समर्थित क्लिनिकल सारांश (AI Draft Summary)"}
                    </span>
                    <span className="text-xs text-muted-foreground font-semibold block">
                      Accessibility & Read-Aloud for visually impaired / low-literacy patients
                    </span>
                  </div>

                    <div className="flex items-center gap-2">
                    {/* Audio Read-Out Button with Language Switching */}
                    <button
                      type="button"
                      onClick={() => {
                        if (isPlayingSummaryAudio) {
                          if (typeof window !== "undefined" && "speechSynthesis" in window) {
                            window.speechSynthesis.cancel();
                          }
                          setIsPlayingSummaryAudio(false);
                          return;
                        }

                        setIsPlayingSummaryAudio(true);
                        // Strip markdown formatting for natural voice readout
                        const cleanText = editedMarkdown
                          .replace(/[#*`_~-]/g, " ")
                          .replace(/\s+/g, " ")
                          .trim();

                        speakWithIndianVoice(
                          cleanText || "Clinical summary is currently empty.",
                          params.locale === "hi" ? "hi" : "en",
                          () => setIsPlayingSummaryAudio(false),
                          () => setIsPlayingSummaryAudio(false)
                        );
                      }}
                      aria-label="Listen to medical summary readout"
                      className={`min-h-[38px] px-3 py-1.5 rounded-xl border font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-xs ${
                        isPlayingSummaryAudio
                          ? "bg-rose-50 border-rose-300 text-rose-700 animate-pulse"
                          : "bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-900"
                      }`}
                    >
                      {isPlayingSummaryAudio ? (
                        <VolumeX className="h-4 w-4 text-rose-600" />
                      ) : (
                        <Volume2 className="h-4 w-4 text-emerald-700" />
                      )}
                      <span>
                        {isPlayingSummaryAudio
                          ? params.locale === "hi" ? "ऑडियो रोकें" : "Stop Audio"
                          : params.locale === "hi" ? "आवाज में सुनें (Listen)" : "Listen Summary"}
                      </span>
                    </button>

                    {/* PDF Download Button */}
                    <a
                      href={`/api/doctor/summary/${sessionId}/pdf`}
                      download
                      className="min-h-[38px] px-3 py-1.5 rounded-xl border-2 border-emerald-600 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs inline-flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>{params.locale === "hi" ? "PDF डाउनलोड करें" : "Download PDF"}</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => setIsEditing(!isEditing)}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl border bg-slate-100 dark:bg-slate-800 text-foreground inline-flex items-center gap-1 min-h-[38px]"
                    >
                      {isEditing ? <Eye className="h-3.5 w-3.5" /> : <Edit3 className="h-3.5 w-3.5" />}
                      <span>{isEditing ? "पूर्वावलोकन देखें" : "संशोधित करें (Edit)"}</span>
                    </button>
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-3">
                    <textarea
                      rows={18}
                      value={editedMarkdown}
                      onChange={(e) => setEditedMarkdown(e.target.value)}
                      className="w-full p-4 font-mono text-xs sm:text-sm rounded-2xl border-2 border-input focus:border-ayush-green bg-slate-50 dark:bg-slate-900"
                    />
                    <div className="flex justify-end gap-2">
                      <ExtraLargeButton variant="secondary" size="default" onClick={() => setIsEditing(false)}>
                        रद्द करें
                      </ExtraLargeButton>
                      <ExtraLargeButton variant="primary" size="default" onClick={handleSaveEdit}>
                        सहेजें (Save)
                      </ExtraLargeButton>
                    </div>
                  </div>
                ) : (
                  <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-900/60 border">
                    <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm">{editedMarkdown}</pre>
                  </div>
                )}
              </Card>
        )}

        {/* Tab: Explainable Clinical Insights (Phase 5) */}
        {activeTab === "INSIGHTS" && (
          <Card className="p-6 sm:p-8 rounded-3xl border-2 border-input space-y-6 bg-card shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  <span>प्रमाण-आधारित क्लिनिकल अंतर्दृष्टि (Traceable Clinical Insights & Evidence)</span>
                </h3>
                <p className="text-xs text-muted-foreground font-medium">
                  Deterministic longitudinal patterns, structured observation links, and AYUSH knowledge context for physician review.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xs font-mono font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-muted-foreground border">
                  Engine Version: v1.0
                </span>
                <span className="text-2xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 border border-emerald-300">
                  {caseData?.clinicalInsights?.length || 0} अंतर्दृष्टि उपलब्ध
                </span>
              </div>
            </div>

            {/* Non-diagnostic Safety Callout */}
            <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-300 font-medium">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>चिकित्सकीय निर्णय समर्थन सूचना:</strong> अंतर्दृष्टि केवल अवलोकन प्रवृत्तियों व पारंपरिक साहित्य संदर्भों पर आधारित है। यह स्वचालित निदान या औषधि आदेश नहीं है। अंतिम निर्णय चिकित्सक का है।
              </span>
            </div>

            {/* List of Insights */}
            {(!caseData?.clinicalInsights || caseData.clinicalInsights.length === 0) ? (
              <div className="p-12 text-center text-muted-foreground text-xs font-medium bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed">
                इस परामर्श सत्र के लिए कोई क्लिनिकल अंतर्दृष्टि उत्पन्न नहीं हुई है।
              </div>
            ) : (
              <div className="space-y-4">
                {caseData.clinicalInsights.map((ins: any, idx: number) => {
                  const isVerified = ins.status === "VERIFIED";
                  const isRejected = ins.status === "REJECTED";
                  const isOverridden = ins.status === "OVERRIDDEN";

                  return (
                    <div
                      key={idx}
                      className={`p-5 rounded-2xl border-2 space-y-3.5 transition-all shadow-xs ${
                        isVerified
                          ? "border-emerald-300 bg-emerald-50/30 dark:bg-emerald-950/10"
                          : isRejected
                          ? "border-rose-200 bg-rose-50/20 opacity-75 dark:bg-rose-950/10"
                          : isOverridden
                          ? "border-amber-300 bg-amber-50/20 dark:bg-amber-950/10"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                      }`}
                    >
                      {/* Insight Header */}
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-2xs font-mono font-black uppercase px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200 border border-indigo-200">
                              {ins.insightType}
                            </span>
                            <span
                              className={`text-3xs font-extrabold px-2 py-0.5 rounded-full ${
                                ins.priority === "IMPORTANT" || ins.priority === "ATTENTION"
                                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                                  : "bg-slate-100 text-slate-800 border"
                              }`}
                            >
                              Priority: {ins.priority}
                            </span>
                            <span className="text-3xs font-semibold text-muted-foreground">
                              विश्वास्यता (Confidence): {Math.round(ins.confidence * 100)}% ({ins.confidenceLevel})
                            </span>
                          </div>
                          <h4 className="text-sm font-extrabold text-foreground">{ins.title}</h4>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`text-2xs font-black px-2.5 py-1 rounded-full border ${
                            isVerified
                              ? "bg-emerald-600 text-white border-emerald-400"
                              : isRejected
                              ? "bg-rose-600 text-white border-rose-400"
                              : isOverridden
                              ? "bg-amber-600 text-white border-amber-400"
                              : "bg-slate-100 text-slate-800 border-slate-300"
                          }`}
                        >
                          {ins.status}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-xs font-semibold text-foreground/90 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border">
                        {ins.description}
                      </p>

                      {/* Structured Explainability Breakdown (WHAT, WHY, EVIDENCE, LIMITATION) */}
                      {ins.explanation && (
                        <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/80 border space-y-2 text-2xs">
                          <div>
                            <strong className="text-muted-foreground">क्या देखा गया (What): </strong>
                            <span className="text-foreground font-medium">{ins.explanation.what}</span>
                          </div>
                          <div>
                            <strong className="text-muted-foreground">कारण / क्लिनिकल तर्क (Why): </strong>
                            <span className="text-foreground font-medium">{ins.explanation.why}</span>
                          </div>
                          {ins.explanation.knowledgeContext && (
                            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-950 dark:text-emerald-200">
                              <strong>आयुष ज्ञान संदर्भ: </strong>
                              <span>{ins.explanation.knowledgeContext.conceptName} ({ins.explanation.knowledgeContext.sourceCitation})</span>
                            </div>
                          )}
                          <div className="text-3xs text-muted-foreground italic border-t pt-1.5">
                            <strong>सीमाएं (Limitations): </strong>{ins.explanation.limitations}
                          </div>
                        </div>
                      )}

                      {/* Evidence Links */}
                      {ins.evidence && ins.evidence.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <span className="text-3xs font-extrabold text-muted-foreground uppercase">
                            प्रमाण लिंक (Linked Clinical Evidence):
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {ins.evidence.map((ev: any, evIdx: number) => (
                              <span
                                key={evIdx}
                                className="text-3xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-muted-foreground border"
                              >
                                {ev.isDirectEvidence ? "DIRECT" : "DERIVED"} • Obs: {ev.observationId} (Weight: {ev.weight})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Doctor Review Actions */}
                      <div className="pt-2 border-t flex flex-wrap items-center justify-between gap-2">
                        <span className="text-3xs text-muted-foreground font-mono">
                          Fingerprint: {ins.fingerprint ? ins.fingerprint.slice(0, 32) + "..." : "fp-default"}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await fetch(`/api/doctor/insights/${sessionId}`, {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    insightId: ins.fingerprint || `ins-${idx}`,
                                    decision: "CONFIRMED",
                                  }),
                                });
                                ins.status = "VERIFIED";
                                setActionSuccess(`अंतर्दृष्टि '${ins.title}' की पुष्टि (Confirmed) दर्ज की गई`);
                              } catch {
                                alert("समीक्षा सहेजने में त्रुटि हुई");
                              }
                            }}
                            className="text-2xs font-bold px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 transition-all inline-flex items-center gap-1"
                          >
                            <Check className="h-3 w-3" /> पुष्टि करें (Confirm)
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const reason = window.prompt("अस्वीकृति का कारण दर्ज करें (Reason for rejection):", "Not clinically relevant for acute episode");
                              if (reason) {
                                try {
                                  await fetch(`/api/doctor/insights/${sessionId}`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      insightId: ins.fingerprint || `ins-${idx}`,
                                      decision: "REJECTED",
                                      reason,
                                    }),
                                  });
                                  ins.status = "REJECTED";
                                  setActionSuccess(`अंतर्दृष्टि '${ins.title}' को अस्वीकृत (Rejected) किया गया`);
                                } catch {
                                  alert("अस्वीकृति सहेजने में त्रुटि हुई");
                                }
                              }
                            }}
                            className="text-2xs font-bold px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 transition-all inline-flex items-center gap-1"
                          >
                            <XCircle className="h-3 w-3" /> अस्वीकार करें (Reject)
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {/* Tab: Patient Q&A Answers */}
        {activeTab === "ANSWERS" && (
          <Card className="p-6 sm:p-8 rounded-3xl border-2 border-input space-y-4 bg-card shadow-sm">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-extrabold text-foreground">
                रोगी द्वारा दर्ज प्रश्नोत्तरी उत्तर (Patient Intake Responses)
              </h3>
              <span className="text-xs font-bold px-2.5 py-0.5 bg-indigo-100 text-indigo-900 rounded-full">
                {caseData.answers?.length || 0} उत्तर दर्ज
              </span>
            </div>

            {caseData.answers?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-xs font-medium">
                इस सत्र के लिए कोई पूर्व प्रश्नोत्तर उत्तर उपलब्ध नहीं हैं।
              </div>
            ) : (
              <div className="space-y-3">
                {caseData.answers.map((ans: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-2xl bg-muted/30 border space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400">
                        Q{idx + 1} · {ans.nodeCode}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(ans.answeredAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <p className="text-sm font-bold text-foreground">
                      {params.locale === "hi" && ans.questionTextHindi ? ans.questionTextHindi : ans.questionText}
                    </p>

                    <div className="p-2.5 rounded-xl bg-background border text-xs font-extrabold text-emerald-950 dark:text-emerald-200">
                      उत्तर: {typeof ans.answerValue === "object" ? JSON.stringify(ans.answerValue) : String(ans.answerValue)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Tab 2: Medical Timeline & Longitudinal Patient Journey */}
        {activeTab === "TIMELINE" && (
          <div className="space-y-6">
            {/* Consultation Comparison Banner: "What changed since last visit?" */}
            {caseData?.longitudinalComparison && (
              <Card className="p-6 sm:p-8 rounded-3xl border-2 border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200 dark:border-emerald-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                    <h3 className="text-base font-extrabold text-foreground">
                      पिछले परामर्श से परिवर्तन (Since Last Consultation Comparison)
                    </h3>
                  </div>
                  {caseData.longitudinalComparison.previousConsultationDate && (
                    <span className="text-xs font-bold text-muted-foreground">
                      अंतिम परामर्श: {new Date(caseData.longitudinalComparison.previousConsultationDate).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {caseData.longitudinalComparison.status === "NO_COMPARABLE_PREVIOUS_CONSULTATION" ? (
                  <p className="text-xs font-semibold text-muted-foreground">
                    यह रोगी का प्रारंभिक परामर्श (Baseline Assessment) है।
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                    {/* Improved */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900 space-y-2">
                      <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-1">
                        ↓ सुधार देखा गया (Improved)
                      </span>
                      {caseData.longitudinalComparison.improved.length > 0 ? (
                        caseData.longitudinalComparison.improved.map((item: any, i: number) => (
                          <div key={i} className="text-xs space-y-0.5">
                            <span className="font-extrabold text-foreground block">{item.symptom}</span>
                            <span className="text-2xs font-semibold text-emerald-600 block">
                              {item.previousValue} → {item.currentValue}
                            </span>
                          </div>
                        ))
                      ) : (
                        <span className="text-2xs text-muted-foreground">कोई स्पष्ट सुधार दर्ज नहीं</span>
                      )}
                    </div>

                    {/* Worsened */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 space-y-2">
                      <span className="text-xs font-black text-rose-700 dark:text-rose-400 uppercase tracking-wide flex items-center gap-1">
                        ↑ वृद्धि / तीव्रता (Worsened)
                      </span>
                      {caseData.longitudinalComparison.worsened.length > 0 ? (
                        caseData.longitudinalComparison.worsened.map((item: any, i: number) => (
                          <div key={i} className="text-xs space-y-0.5">
                            <span className="font-extrabold text-foreground block">{item.symptom}</span>
                            <span className="text-2xs font-semibold text-rose-600 block">
                              {item.previousValue} → {item.currentValue}
                            </span>
                          </div>
                        ))
                      ) : (
                        <span className="text-2xs text-muted-foreground">कोई तीव्रता नहीं</span>
                      )}
                    </div>

                    {/* Newly Reported */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900 space-y-2">
                      <span className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-wide flex items-center gap-1">
                        ● नए लक्षण (Newly Reported)
                      </span>
                      {caseData.longitudinalComparison.newlyReported.length > 0 ? (
                        caseData.longitudinalComparison.newlyReported.map((item: any, i: number) => (
                          <div key={i} className="text-xs space-y-0.5">
                            <span className="font-extrabold text-foreground block">{item.symptom}</span>
                            <span className="text-2xs text-muted-foreground block">{item.currentValue}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-2xs text-muted-foreground">कोई नया लक्षण नहीं</span>
                      )}
                    </div>

                    {/* Persistent */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900 space-y-2">
                      <span className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase tracking-wide flex items-center gap-1">
                        ⟳ स्थिर / निरंतर (Persistent)
                      </span>
                      {caseData.longitudinalComparison.persistent.length > 0 ? (
                        caseData.longitudinalComparison.persistent.map((item: any, i: number) => (
                          <div key={i} className="text-xs space-y-0.5">
                            <span className="font-extrabold text-foreground block">{item.symptom}</span>
                            <span className="text-2xs text-muted-foreground block">{item.currentValue}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-2xs text-muted-foreground">कोई निरंतर लक्षण नहीं</span>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Symptom Trajectories Visualization Card */}
            {caseData?.symptomTrajectories?.length > 0 && (
              <Card className="p-6 sm:p-8 rounded-3xl border-2 border-input space-y-4 bg-card shadow-sm">
                <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-600" />
                  <span>लक्षण प्रक्षेपवक्र व रुझान (Symptom Trajectories & Severity Trends)</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {caseData.symptomTrajectories.map((traj: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-foreground">{traj.canonicalName}</span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            traj.severityTrend === "IMPROVING"
                              ? "bg-emerald-100 text-emerald-800"
                              : traj.severityTrend === "WORSENING"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-slate-200 text-slate-800"
                          }`}
                        >
                          {traj.severityTrend}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium">{traj.explanation}</p>
                      <div className="text-[11px] font-semibold text-muted-foreground flex items-center gap-2 pt-1 border-t">
                        <span>अभिलेख संख्या: {traj.encounterCount}</span>
                        <span>•</span>
                        <span>स्थिति: {traj.evolutionState}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Unified Chronological Timeline Card */}
            <Card className="p-6 sm:p-8 rounded-3xl border-2 border-input space-y-4 bg-card shadow-sm">
              <h3 className="text-base font-extrabold text-foreground">दीर्घकालिक इतिहास (Longitudinal History)</h3>
              <MedicalTimelineView events={caseData?.timeline || []} />
            </Card>
          </div>
        )}

        {/* Tab 3: Abnormal Labs */}
        {activeTab === "LABS" && (
          <Card className="p-6 sm:p-8 rounded-3xl border-2 border-input space-y-4 bg-card shadow-sm">
            <h3 className="text-base font-extrabold text-foreground">
              जांच रिपोर्ट असामान्यताएं (Flagged Lab Investigations)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {caseData?.abnormalLabs?.map((lab: any, i: number) => (
                <div key={i} className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border-2 border-rose-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-foreground">{lab.testName}</span>
                    <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-rose-200 text-rose-900">
                      {lab.flag}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground">
                    मान (Value): <span className="font-extrabold text-foreground">{lab.value} {lab.unit}</span> ({lab.referenceRange})
                  </div>
                  <p className="text-xs text-rose-800 dark:text-rose-300 font-medium pt-1">{lab.clinicalNote}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Tab 4: Ayurveda Dashavidha & Prakriti Scorecard */}
        {activeTab === "AYUSH" && (
          <div className="space-y-6">
            <Card className="p-6 sm:p-8 rounded-3xl border-2 border-emerald-300 space-y-6 bg-card shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                  <span>चरक संहिता दशविध परीक्षा व त्रिदोष स्थिति (Dashavidha Pariksha)</span>
                </h3>
                <span className="text-xs font-bold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                  AIIA Standardized
                </span>
              </div>

              {/* Tridosha Visual Scorecard */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border space-y-4">
                <span className="text-xs font-extrabold text-muted-foreground uppercase">
                  प्रकृति त्रिदोष अनुपात (Constitutional Dosha Distribution):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Vata */}
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-sm text-sky-700">वात (Vata)</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">45% (प्रमुख)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-sky-600 h-2.5 rounded-full" style={{ width: "45%" }} />
                    </div>
                    <span className="text-2xs text-muted-foreground font-medium block">चंचल, शीत, रुक्ष गुण (Pain & Movement)</span>
                  </div>

                  {/* Pitta */}
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-sm text-amber-700">पित्त (Pitta)</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">35%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: "35%" }} />
                    </div>
                    <span className="text-2xs text-muted-foreground font-medium block">उष्ण, तीक्ष्ण गुण (Metabolism & Heat)</span>
                  </div>

                  {/* Kapha */}
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-sm text-emerald-700">कफ (Kapha)</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">20%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-emerald-600 h-2.5 rounded-full" style={{ width: "20%" }} />
                    </div>
                    <span className="text-2xs text-muted-foreground font-medium block">स्निग्ध, गुरु गुण (Structure & Stability)</span>
                  </div>
                </div>
              </div>

              {/* 6 Key AYUSH Attributes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 space-y-1">
                  <span className="text-xs font-bold text-muted-foreground uppercase">देहा प्रकृति (Prakriti)</span>
                  <p className="text-base font-extrabold text-emerald-950 dark:text-emerald-200">{caseData?.ayurveda?.prakriti || "Vata-Kapha"}</p>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 space-y-1">
                  <span className="text-xs font-bold text-muted-foreground uppercase">अग्नि स्थिति (Digestion)</span>
                  <p className="text-base font-extrabold text-emerald-950 dark:text-emerald-200">{caseData?.ayurveda?.agni || "Vishamagni (Irregular)"}</p>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 space-y-1">
                  <span className="text-xs font-bold text-muted-foreground uppercase">कोष्ठ व मल (Bowel)</span>
                  <p className="text-base font-extrabold text-emerald-950 dark:text-emerald-200">{caseData?.ayurveda?.koshtha || "Krura (Hard / Constipated)"}</p>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 space-y-1">
                  <span className="text-xs font-bold text-muted-foreground uppercase">सत्त्व बल (Mental Stamina)</span>
                  <p className="text-base font-extrabold text-emerald-950 dark:text-emerald-200">{caseData?.ayurveda?.sattva || "Madhyama (Moderate)"}</p>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 space-y-1">
                  <span className="text-xs font-bold text-muted-foreground uppercase">व्यायाम शक्ति (Physical Bala)</span>
                  <p className="text-base font-extrabold text-emerald-950 dark:text-emerald-200">{caseData?.ayurveda?.bala || "Madhyama (Moderate)"}</p>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 space-y-1">
                  <span className="text-xs font-bold text-muted-foreground uppercase">दोष विकृति (Doshic Imbalance)</span>
                  <p className="text-base font-extrabold text-emerald-950 dark:text-emerald-200">{caseData?.ayurveda?.vikriti || "Vata-Pitta Dushti"}</p>
                </div>
              </div>

              {/* Pathya-Apathya Clinical Dietetics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                  <span className="text-xs font-extrabold text-emerald-900 uppercase flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" /> पथ्य (Recommended Pathya / Diet):
                  </span>
                  <ul className="text-xs font-bold text-emerald-950 space-y-1">
                    <li>• गुनगुना पानी व ताजा सुपाच्य भोजन (Warm water & freshly cooked meals)</li>
                    <li>• लहसुन, सोंठ व अजवाइन युक्त तक्र (Ginger & Garlic seasoned buttermilk)</li>
                    <li>• जौ, मूंग दाल व पुराना साठी चावल (Mudga, Yava, Shali rice)</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
                  <span className="text-xs font-extrabold text-rose-900 uppercase flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-rose-600" /> अपथ्य (Contraindicated Apathya):
                  </span>
                  <ul className="text-xs font-bold text-rose-950 space-y-1">
                    <li>• ठंडा पानी, दही व बासी भोजन (Cold water, curd & stale food)</li>
                    <li>• अधिक तीखा, तला-भुना व भारी भोजन (Deep fried & heavy meals)</li>
                    <li>• दिन में सोना व रात्रि जागरण (Day sleeping & late nights)</li>
                  </ul>
                </div>
              </div>

              {/* Explainable AYUSH Clinical Knowledge Context */}
              {caseData?.knowledgeContexts && caseData.knowledgeContexts.length > 0 && (
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-muted-foreground uppercase flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-emerald-600" />
                      <span>आयुष ज्ञान ग्राफ संबंध (AYUSH Clinical Knowledge Context & Provenance):</span>
                    </span>
                    <span className="text-2xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
                      Version: {caseData.knowledgeContexts[0]?.knowledgeVersion || "v1.0"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {caseData.knowledgeContexts.map((ctx: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-emerald-100 dark:border-emerald-900 space-y-2.5 shadow-2xs">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-xs font-bold text-muted-foreground block">
                              Observed Finding → AYUSH Concept
                            </span>
                            <span className="text-sm font-extrabold text-foreground block">
                              {ctx.matchedConceptName}
                            </span>
                          </div>
                          <span className="text-2xs font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {ctx.domain} · {ctx.category}
                          </span>
                        </div>

                        {ctx.relationships && ctx.relationships.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            {ctx.relationships.map((rel: any, rIdx: number) => (
                              <div key={rIdx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 text-2xs space-y-1">
                                <div className="flex items-center justify-between text-muted-foreground font-semibold">
                                  <span className="font-mono text-emerald-800 dark:text-emerald-300 font-bold">{rel.relationshipType}</span>
                                  <span>{rel.targetConceptName}</span>
                                </div>
                                <p className="text-foreground font-medium">{rel.clinicalRationale}</p>
                                <div className="flex items-center justify-between text-3xs text-muted-foreground pt-0.5">
                                  <span>स्रोत: {rel.sourceTitle}</span>
                                  <span className="font-mono">{rel.sourceReference}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <p className="text-3xs text-muted-foreground italic border-t pt-1.5">
                          {ctx.clinicalDisclaimer}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Differential Diagnoses & NAMASTE / ICD-11 Coding */}
            <Card className="p-6 sm:p-8 rounded-3xl border-2 border-input space-y-4 bg-card shadow-sm">
              <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-emerald-600" />
                <span>संभावित निदान व वर्गीकरण (Differential Diagnoses & NAMASTE / ICD-11)</span>
              </h3>
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-foreground">1. Hridroga / Angina Pectoris (Acute Coronary Evaluation)</span>
                      <span className="px-2 py-0.5 rounded text-2xs font-extrabold bg-rose-100 text-rose-800">उच्च प्राथमिकता (Stat ECG)</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-semibold">Crushing retrosternal chest pain radiating to left arm with diaphoresis.</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-extrabold bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-md">ICD-11: BA41.Z</span>
                    <span className="text-xs font-mono font-bold text-muted-foreground block mt-0.5">NAMASTE: AYU-HR-003</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-foreground">2. Amavata (Saama Vata-Kaphaja Syndrome)</span>
                      <span className="px-2 py-0.5 rounded text-2xs font-extrabold bg-amber-100 text-amber-800">मध्यम</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-semibold">Joint stiffness, high ESR (38 mm/hr) and high Uric Acid (7.8 mg/dL).</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-extrabold bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-md">ICD-11: FA20.Z</span>
                    <span className="text-xs font-mono font-bold text-muted-foreground block mt-0.5">NAMASTE: AYU-AV-012</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Tab 2: Doctor Prescription & Official Report */}
        {activeTab === "PRESCRIPTION" && (
          <div className="space-y-6">
            {/* Doctor Credentials & Authentication Banner */}
            <Card className="p-5 rounded-3xl border-2 border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xl font-bold shadow-sm">
                  👨‍⚕️
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base text-foreground">{doctorAuth.name}</span>
                    <span className="text-2xs font-extrabold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                      सत्यापित चिकित्सक (Verified)
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    पंजीकरण सं (Reg No): <span className="font-mono font-bold text-foreground">{doctorAuth.regNumber}</span> • {doctorAuth.specialty}
                  </p>
                  <p className="text-2xs text-muted-foreground">{doctorAuth.hospital}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDoctorLoginModal(true)}
                  className="min-h-[40px] px-3.5 rounded-xl border border-emerald-300 bg-white dark:bg-slate-900 text-emerald-900 dark:text-emerald-200 font-bold text-xs hover:bg-emerald-100/50"
                >
                  चिकित्सक बदलें / साइन-इन (Change Doctor)
                </button>
              </div>
            </Card>

            {/* Main Doctor Prescription & Clinical Report Composer */}
            <Card className="p-6 sm:p-8 rounded-3xl border-2 border-input space-y-6 bg-card shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                    <Stethoscope className="h-5 w-5 text-emerald-600" />
                    <span>आधिकारिक चिकित्सक परामर्श एवं पर्ची (Physician Rx & Clinical Notes)</span>
                  </h3>
                  <p className="text-xs text-muted-foreground font-semibold">
                    Doctor&apos;s authoritative clinical report, Rx medications, and lifestyle instructions.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      // Fetch / Pre-populate from AI Summary
                      setDoctorRxNotes(
                        `Clinical Findings: Retrosternal chest heaviness radiating to left arm. High ESR (38 mm/hr) & HbA1c (6.8%). Suspected Saama Vata-Pitta Dushti.\nImmediate Actions: 12-Lead ECG Stat, Troponin I.`
                      );
                      setActionSuccess("AI सारांश से मुख्य निष्कर्ष प्राप्त किए गए (Prefilled from AI Dossier)");
                    }}
                    className="min-h-[38px] px-3.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-900 font-bold text-xs inline-flex items-center gap-1.5 hover:bg-emerald-100"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>AI सारांश से फेच करें (Fetch AI Insights)</span>
                  </button>
                </div>
              </div>

              {/* 1. Doctor's Clinical Impression / Narrative */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-muted-foreground uppercase flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-emerald-700" /> १. चिकित्सक क्लिनिकल रिपोर्ट व जांच निष्कर्ष (Doctor&apos;s Assessment & Clinical Notes):
                </label>

                <textarea
                  rows={3}
                  value={doctorRxNotes}
                  onChange={(e) => setDoctorRxNotes(e.target.value)}
                  className="w-full p-4 rounded-2xl border-2 border-input focus:border-ayush-green text-sm font-semibold text-foreground bg-background"
                  placeholder="Enter clinical assessment, examination findings, and diagnosis..."
                />
              </div>

              {/* 2. Prescribed Medications Table & Add Medicine Tool */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-muted-foreground uppercase flex items-center gap-1.5">
                    <Pill className="h-4 w-4 text-emerald-700" /> २. निर्धारित औषधियां (Prescribed Medications / Rx):
                  </label>
                  <span className="text-2xs font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                    {doctorPrescriptions.length} दवाइयां दर्ज
                  </span>
                </div>

                {/* Table of Prescriptions */}
                <div className="overflow-x-auto rounded-2xl border bg-slate-50/50 dark:bg-slate-900/50">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-muted-foreground uppercase font-extrabold border-b">
                      <tr>
                        <th className="p-3">क्र. (No)</th>
                        <th className="p-3">दवा का नाम (Medicine)</th>
                        <th className="p-3">मात्रा (Dose)</th>
                        <th className="p-3">सेवन समय (Frequency)</th>
                        <th className="p-3">अवधि (Duration)</th>
                        <th className="p-3">निर्देश (Instructions)</th>
                        <th className="p-3 text-right">हटाएं</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-semibold">
                      {doctorPrescriptions.map((rx, idx) => (
                        <tr key={idx} className="hover:bg-white dark:hover:bg-slate-800/60">
                          <td className="p-3 font-extrabold text-muted-foreground">{idx + 1}.</td>
                          <td className="p-3 font-extrabold text-foreground">{rx.name}</td>
                          <td className="p-3">{rx.dosage}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-extrabold">
                              {rx.frequency}
                            </span>
                          </td>
                          <td className="p-3">{rx.duration}</td>
                          <td className="p-3 text-muted-foreground">{rx.instructions}</td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => setDoctorPrescriptions(doctorPrescriptions.filter((_, i) => i !== idx))}
                              className="text-rose-600 hover:text-rose-800 font-extrabold px-2 py-1"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Add New Prescription Row */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
                  <input
                    type="text"
                    placeholder="दवा का नाम (e.g. Tab Ashwagandha)"
                    value={newRxName}
                    onChange={(e) => setNewRxName(e.target.value)}
                    className="p-2 rounded-xl border text-xs font-semibold bg-white dark:bg-slate-900 sm:col-span-2"
                  />
                  <input
                    type="text"
                    placeholder="खुराक (e.g. 500mg)"
                    value={newRxDose}
                    onChange={(e) => setNewRxDose(e.target.value)}
                    className="p-2 rounded-xl border text-xs font-semibold bg-white dark:bg-slate-900"
                  />
                  <select
                    value={newRxFreq}
                    onChange={(e) => setNewRxFreq(e.target.value)}
                    className="p-2 rounded-xl border text-xs font-semibold bg-white dark:bg-slate-900"
                  >
                    <option value="1-0-1 (BD)">1-0-1 (सुबह-शाम)</option>
                    <option value="1-0-0 (OD)">1-0-0 (सुबह)</option>
                    <option value="0-0-1 (HS)">0-0-1 (रात)</option>
                    <option value="1-1-1 (TDS)">1-1-1 (तीन बार)</option>
                    <option value="1 SOS">1 SOS (आवश्यकतानुसार)</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      if (!newRxName.trim()) return;
                      setDoctorPrescriptions([
                        ...doctorPrescriptions,
                        {
                          name: newRxName.trim(),
                          dosage: newRxDose.trim() || "1 Tab/Dose",
                          frequency: newRxFreq,
                          duration: newRxDuration,
                          instructions: "After meals with warm water",
                        },
                      ]);
                      setNewRxName("");
                      setNewRxDose("");
                    }}
                    className="min-h-[36px] px-3 rounded-xl bg-ayush-green text-white font-extrabold text-xs hover:bg-emerald-700"
                  >
                    + दवा जोड़ें (Add Rx)
                  </button>
                </div>
              </div>

              {/* 3. Investigations, Diet & Follow-up Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-muted-foreground uppercase flex items-center gap-1">
                    <Activity className="h-3.5 w-3.5 text-emerald-700" /> ३. आवश्यक जांचें (Advised Investigations):
                  </label>
                  <textarea
                    rows={2}
                    value={doctorInvestigations}
                    onChange={(e) => setDoctorInvestigations(e.target.value)}
                    className="w-full p-3 rounded-xl border text-xs font-semibold bg-background"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-muted-foreground uppercase flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-emerald-700" /> ४. पुनरावलोकन / अगला परामर्श (Follow-up):
                  </label>
                  <textarea
                    rows={2}
                    value={doctorFollowUp}
                    onChange={(e) => setDoctorFollowUp(e.target.value)}
                    className="w-full p-3 rounded-xl border text-xs font-semibold bg-background"
                  />
                </div>
              </div>

              {/* 4. Pathya-Apathya Diet & Lifestyle Advice */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-extrabold text-muted-foreground uppercase flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-700" /> ५. पथ्य-अपथ्य व आहार-विहार निर्देश (Diet & Lifestyle Guidance):
                </label>
                <textarea
                  rows={2}
                  value={doctorDietAdvice}
                  onChange={(e) => setDoctorDietAdvice(e.target.value)}
                  className="w-full p-3 rounded-xl border text-xs font-semibold bg-background"
                />
              </div>
            </Card>
          </div>
        )}

        {/* Tab 5: Documents with AI Confidence Scores & Doctor Inline Corrections */}
        {activeTab === "DOCS" && (
          <Card className="p-6 sm:p-8 rounded-3xl border-2 border-input space-y-6 bg-card shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-4">
              <div>
                <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  <span>अपलोड किए गए नुस्खे व पर्चे (Prescription OCR & Medical Extraction)</span>
                </h3>
                <p className="text-xs text-muted-foreground font-semibold">
                  Handwritten & printed OPD record extractions with confidence scores and physician verification controls.
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-full border border-emerald-300">
                {caseData?.documents?.length || 0} दस्तावेज़ उपलब्ध
              </span>
            </div>

            {(!caseData?.documents || caseData.documents.length === 0) && (
              <div className="p-8 text-center text-muted-foreground text-sm font-medium">
                कोई संलग्न दस्तावेज़ उपलब्ध नहीं है (No attached medical documents).
              </div>
            )}

            {caseData?.documents?.map((doc: any, i: number) => (
              <div key={i} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                      📄
                    </div>
                    <div>
                      <span className="text-sm font-black text-foreground block">{doc.fileName}</span>
                      <span className="text-[11px] text-muted-foreground font-semibold">
                        अपलोड: {new Date(doc.uploadedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                      {doc.type}
                    </span>
                    {doc.temporaryAccessUrl && (
                      <a
                        href={doc.temporaryAccessUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-extrabold text-indigo-600 hover:text-indigo-800 underline px-2 py-1"
                      >
                        मूल फ़ाइल देखें (View Original)
                      </a>
                    )}
                  </div>
                </div>

                {/* Extracted Medications with Confidence & Inline Edit */}
                {doc.medications && doc.medications.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-extrabold text-muted-foreground uppercase flex items-center gap-1.5">
                      <Pill className="h-4 w-4 text-emerald-700" /> पहचानी गई दवाइयां (Medications) व AI विश्वसनीयता स्कोर:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {doc.medications.map((m: any, idx: number) => {
                        const conf = m.confidence ?? 0.88;
                        const confPercent = Math.round(conf * 100);
                        const isHigh = conf >= 0.85;
                        const isMedium = conf >= 0.6 && conf < 0.85;

                        return (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border-2 border-input space-y-2 shadow-2xs"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-0.5">
                                <span className="font-extrabold text-foreground text-xs block">{m.name}</span>
                                <span className="text-muted-foreground font-medium text-[11px]">
                                  {m.dosage} {m.frequency && `• ${m.frequency}`} {m.duration && `• ${m.duration}`}
                                </span>
                              </div>
                              <span
                                className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                                  isHigh
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                    : isMedium
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                    : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                }`}
                                title={`Extraction confidence: ${confPercent}%`}
                              >
                                {confPercent}% {isHigh ? "विश्वसनीय" : isMedium ? "मध्यम" : "कम"}
                              </span>
                            </div>

                            {/* Physician Verification Alert & Quick Correction Button */}
                            {(!isHigh || m.isVerifiedByDoctor) && (
                              <div className="pt-2 border-t flex items-center justify-between gap-2">
                                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                                  {m.isVerifiedByDoctor ? "✓ चिकित्सक द्वारा सत्यापित" : "⚠ चिकित्सक सत्यापन अपेक्षित"}
                                </span>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const corrected = window.prompt("चिकित्सक संशोधन दर्ज करें (Edit medication name):", m.name);
                                    if (corrected && corrected !== m.name) {
                                      try {
                                        await fetch("/api/doctor/document/correct", {
                                          method: "POST",
                                          headers: {
                                            "Content-Type": "application/json",
                                            "x-user-id": user?.id || "doc-8842-demo",
                                          },
                                          body: JSON.stringify({
                                            documentId: doc.id,
                                            entityId: m.id,
                                            originalValue: m.name,
                                            correctedValue: corrected,
                                            entityType: "MEDICATION",
                                          }),
                                        });
                                        m.name = corrected;
                                        m.isVerifiedByDoctor = true;
                                        m.confidence = 1.0;
                                        setActionSuccess(`दवा का नाम '${corrected}' सफलतापूर्वक संशोधित किया गया`);
                                      } catch (err) {
                                        alert("संशोधन सहेजने में त्रुटि हुई");
                                      }
                                    }
                                  }}
                                  className="text-[11px] font-extrabold text-indigo-600 hover:text-indigo-800 underline px-2 py-0.5"
                                >
                                  संशोधन करें (Edit)
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Extracted Labs with Confidence */}
                {doc.labResults && doc.labResults.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-extrabold text-muted-foreground uppercase flex items-center gap-1.5">
                      <Activity className="h-4 w-4 text-emerald-700" /> निकाली गई जांच रिपोर्ट (Lab Values):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {doc.labResults.map((l: any, idx: number) => {
                        const conf = l.confidence ?? 0.9;
                        const confPercent = Math.round(conf * 100);
                        return (
                          <div key={idx} className="p-3 rounded-xl bg-white dark:bg-slate-800 border text-xs flex justify-between items-center shadow-2xs">
                            <div>
                              <span className="font-extrabold text-foreground block">{l.testName}</span>
                              <span className="text-muted-foreground font-semibold text-[11px]">
                                {l.value} {l.unit} ({l.referenceRange})
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {l.flag === "HIGH" && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800">
                                  HIGH
                                </span>
                              )}
                              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-muted-foreground rounded">
                                {confPercent}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </Card>
        )}
      </div>

      {/* Official Government / Hospital OPD Prescription Slip (Rendered for Print / Export) */}
      <div id="official-opd-prescription" className="hidden print:block p-8 bg-white text-slate-900 space-y-5 max-w-4xl mx-auto border-2 border-slate-300 font-sans text-xs leading-normal">
        {/* Top Formal Hospital Letterhead Banner */}
        <div className="border-b-2 border-emerald-800 pb-3">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-3xl">🌿</span>
                <div>
                  <h1 className="text-xl font-black tracking-tight text-emerald-950 uppercase">
                    {doctorAuth.hospital ? doctorAuth.hospital : "AYURSETU CLINICAL HEALTHCARE DESK"}
                  </h1>
                  <p className="text-2xs font-bold text-slate-600 uppercase tracking-wide">
                    {doctorAuth.hospital
                      ? "Centre of Excellence in Ayush Clinical Care & Integrated Medicine"
                      : "Independent Clinical Practice & Tele-Consultation"}
                  </p>
                </div>
              </div>
              <p className="text-3xs text-slate-500 font-semibold">
                Ministry of Ayush, Govt. of India • Ayushman Bharat Digital Mission (ABDM) Integrated Health Facility
              </p>
            </div>

            <div className="text-right border-l pl-4 border-slate-300 space-y-0.5 min-w-[200px]">
              <span className="text-3xs font-extrabold px-2.5 py-0.5 bg-emerald-100 text-emerald-950 rounded border border-emerald-300 inline-block uppercase">
                OUTPATIENT DEPARTMENT (OPD) SLIP
              </span>
              <div className="font-mono font-bold text-xs text-slate-800">OPD Token: #AIIA-104</div>
              <div className="text-3xs text-slate-600 font-semibold">Date & Time: {new Date().toLocaleString("en-IN")}</div>
              <div className="text-3xs text-slate-600 font-semibold">Encounter ID: <span className="font-mono">{sessionId}</span></div>
            </div>
          </div>
        </div>

        {/* 2-Column Grid: Patient Demographics & Attending Physician */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50/80 border rounded-xl">
          {/* Patient Details */}
          <div className="space-y-1 pr-2 border-r border-slate-200">
            <span className="text-3xs font-black uppercase text-emerald-900 tracking-wider block border-b pb-0.5">
              1. PATIENT DEMOGRAPHICS & PHR
            </span>
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-2xs">
              <div><span className="text-slate-500 font-semibold">Name:</span> <strong className="text-slate-900">{patient.firstName} {patient.lastName}</strong></div>
              <div><span className="text-slate-500 font-semibold">Age/Gender:</span> <strong className="text-slate-900">{patient.age}Y / {patient.gender}</strong></div>
              <div><span className="text-slate-500 font-semibold">ABHA Number:</span> <span className="font-mono font-bold text-slate-900">{patient.abhaId}</span></div>
              <div><span className="text-slate-500 font-semibold">Blood Group:</span> <strong className="text-slate-900">{patient.bloodGroup}</strong></div>
              <div><span className="text-slate-500 font-semibold">Prakriti:</span> <strong className="text-slate-900">{caseData?.ayurveda?.prakriti || "Vata-Kapha"}</strong></div>
              <div><span className="text-slate-500 font-semibold">Triage Level:</span> <strong className="text-rose-700">{caseData?.encounter?.triagePriority || "EMERGENCY"}</strong></div>
            </div>
          </div>

          {/* Attending Physician & Hospital Info */}
          <div className="space-y-1 pl-2">
            <span className="text-3xs font-black uppercase text-emerald-900 tracking-wider block border-b pb-0.5">
              2. ATTENDING PHYSICIAN & FACILITY
            </span>
            <div className="space-y-0.5 text-2xs">
              <div><span className="text-slate-500 font-semibold">Doctor Name:</span> <strong className="text-slate-900">{doctorAuth.name}</strong></div>
              <div><span className="text-slate-500 font-semibold">Medical Reg No:</span> <span className="font-mono font-bold text-emerald-950">{doctorAuth.regNumber}</span></div>
              <div><span className="text-slate-500 font-semibold">Designation:</span> <span className="text-slate-800 font-medium">{doctorAuth.specialty}</span></div>
              <div>
                <span className="text-slate-500 font-semibold">Hospital / Clinic:</span>{" "}
                <strong className="text-emerald-900">
                  {doctorAuth.hospital ? doctorAuth.hospital : "Independent / Private Practice"}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Clinical Assessment & Diagnosis Section */}
        <div className="space-y-1 border p-3 rounded-xl bg-white">
          <div className="flex justify-between items-center border-b pb-1">
            <span className="text-3xs font-black uppercase text-emerald-900 tracking-wider">
              3. CLINICAL SUMMARY & PROVISIONAL DIAGNOSIS
            </span>
            <span className="text-3xs font-mono font-bold text-slate-600">ICD-11: BA41.Z • NAMASTE: AYU-HR-003</span>
          </div>
          <div className="text-2xs text-slate-800 space-y-1 pt-0.5">
            <p><strong>Chief Complaint:</strong> {caseData?.encounter?.chiefComplaint || "Retrosternal chest heaviness & joint stiffness"}</p>
            <p><strong>Physician Examination & Notes:</strong> {doctorRxNotes}</p>
          </div>
        </div>

        {/* Prescription (℞) Table */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between border-b pb-1">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-serif font-black text-emerald-950">℞</span>
              <span className="text-3xs font-black uppercase text-emerald-950 tracking-wider">
                4. PRESCRIBED MEDICATIONS & REGIMEN
              </span>
            </div>
            <span className="text-3xs text-slate-500 font-semibold">Take medications strictly as directed with warm water</span>
          </div>

          <table className="w-full text-2xs border border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b text-3xs uppercase">
                <th className="p-1.5 text-left w-8">#</th>
                <th className="p-1.5 text-left">Medicine Name (Brand/Generic/Ayurvedic)</th>
                <th className="p-1.5 text-left w-20">Dose</th>
                <th className="p-1.5 text-left w-28">Frequency (Timing)</th>
                <th className="p-1.5 text-left w-20">Duration</th>
                <th className="p-1.5 text-left">Special Instructions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {doctorPrescriptions.map((rx, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="p-1.5 font-bold text-slate-500">{idx + 1}.</td>
                  <td className="p-1.5 font-bold text-slate-900">{rx.name}</td>
                  <td className="p-1.5 font-medium">{rx.dosage}</td>
                  <td className="p-1.5 font-bold text-emerald-900 bg-emerald-50/50">{rx.frequency}</td>
                  <td className="p-1.5 font-medium">{rx.duration}</td>
                  <td className="p-1.5 text-slate-700">{rx.instructions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 2-Column: Pathya-Apathya Diet & Advised Investigations */}
        <div className="grid grid-cols-2 gap-3 text-2xs">
          <div className="p-2.5 bg-emerald-50/40 border border-emerald-200 rounded-xl space-y-0.5">
            <span className="text-3xs font-black uppercase text-emerald-950 block border-b border-emerald-200 pb-0.5">
              5. PATHYA & APATHYA (DIETARY & LIFESTYLE ADVICE)
            </span>
            <p className="text-slate-800 pt-0.5">{doctorDietAdvice}</p>
          </div>

          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-0.5">
            <span className="text-3xs font-black uppercase text-slate-900 block border-b border-slate-200 pb-0.5">
              6. INVESTIGATIONS & NEXT FOLLOW-UP
            </span>
            <p className="text-slate-800 pt-0.5"><strong>Lab / Tests:</strong> {doctorInvestigations}</p>
            <p className="text-slate-800"><strong>Follow-Up:</strong> {doctorFollowUp}</p>
          </div>
        </div>

        {/* Official Footer: Digital Signature & Legal ABDM Security Notice */}
        <div className="pt-4 border-t-2 border-slate-300 flex justify-between items-end">
          <div className="space-y-0.5 text-3xs text-slate-500">
            <p>• Valid digital prescription generated via <strong>AyurSetu / MediMind AI OPD System</strong></p>
            <p>• Certified compliant with <strong>Ministry of Ayush EHR & ABDM FHIR R4 Standards</strong></p>
            <p>• For emergency escalation or telemedicine queries, call National Ayush Helpline: <strong>1075</strong></p>
          </div>

          <div className="text-right space-y-0.5">
            <div className="font-serif italic font-bold text-sm text-emerald-950">{doctorAuth.name}</div>
            <div className="text-2xs font-bold text-slate-900">{doctorAuth.name}</div>
            <div className="text-3xs font-mono font-bold text-slate-700">Reg: {doctorAuth.regNumber}</div>
            <div className="text-3xs text-slate-600">{doctorAuth.specialty}</div>
            {doctorAuth.hospital && <div className="text-3xs font-semibold text-emerald-900">{doctorAuth.hospital}</div>}
            <span className="inline-block text-3xs font-extrabold px-2 py-0.5 bg-emerald-100 text-emerald-950 rounded border border-emerald-300 mt-1">
              ✓ Digitally Signed & OPD Sealed
            </span>
          </div>
        </div>
      </div>

      {/* Doctor Login & Registration Modal */}
      {showDoctorLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card border-3 border-emerald-400 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="space-y-1 text-center">
              <span className="text-3xl">👨‍⚕️</span>
              <h3 className="text-xl font-extrabold text-foreground">चिकित्सक साइन-इन व सत्यापन</h3>
              <p className="text-xs text-muted-foreground font-semibold">
                Doctor Verification, Medical Registration & Hospital Affiliation
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-muted-foreground uppercase">डॉक्टर का पूरा नाम (Doctor Name):</label>
                <input
                  type="text"
                  value={tempDoctorName}
                  onChange={(e) => setTempDoctorName(e.target.value)}
                  placeholder="e.g. Dr. Arvind K. Sharma (MD, BAMS)"
                  className="w-full p-3 rounded-xl border text-sm font-semibold bg-background"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-muted-foreground uppercase">मेडिकल पंजीकरण सं (Registration No):</label>
                <input
                  type="text"
                  value={tempDoctorReg}
                  onChange={(e) => setTempDoctorReg(e.target.value)}
                  placeholder="e.g. AYUSH-REG-DL-2024-9842"
                  className="w-full p-3 rounded-xl border font-mono text-sm font-semibold bg-background"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-muted-foreground uppercase">विशेषज्ञता / पद (Designation):</label>
                <input
                  type="text"
                  value={tempSpecialty}
                  onChange={(e) => setTempSpecialty(e.target.value)}
                  placeholder="e.g. Senior Vaidya & Consultant Physician"
                  className="w-full p-3 rounded-xl border text-sm font-semibold bg-background"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-muted-foreground uppercase">
                  अस्पताल / क्लिनिक / फर्म का नाम (Hospital / Clinic / Firm Name):
                </label>
                <input
                  type="text"
                  value={tempHospital}
                  onChange={(e) => setTempHospital(e.target.value)}
                  placeholder="Leave blank if private / independent practitioner"
                  className="w-full p-3 rounded-xl border text-sm font-semibold bg-background"
                />
                <p className="text-3xs text-muted-foreground">
                  (यदि आप किसी अस्पताल से जुड़े नहीं हैं तो इसे खाली छोड़ दें, यह पर्चे पर उसी अनुसार दिखेगा)
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDoctorLoginModal(false)}
                className="flex-1 py-3 rounded-xl border text-xs font-bold"
              >
                रद्द करें (Cancel)
              </button>
              <button
                type="button"
                onClick={() => {
                  setDoctorAuth({
                    isSignedIn: true,
                    name: tempDoctorName,
                    regNumber: tempDoctorReg,
                    specialty: tempSpecialty,
                    hospital: tempHospital.trim(),
                  });
                  setShowDoctorLoginModal(false);
                  setActionSuccess("चिकित्सक क्रेडेंशियल व अस्पताल का नाम अद्यतित (Doctor Profile Updated)");
                }}
                className="flex-1 py-3 rounded-xl bg-ayush-green text-white text-xs font-extrabold shadow-md hover:bg-emerald-700"
              >
                सत्यापित करें (Save & Sign-In)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t shadow-2xl z-40">
        <div className="container max-w-7xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground">स्थिति:</span>
            <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
              {caseData?.summary?.status || "DRAFT"} (v{caseData?.summary?.version || 1})
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab("PRESCRIPTION")}
              className="min-h-[48px] px-5 rounded-2xl border-2 border-emerald-300 font-bold text-xs inline-flex items-center gap-2 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
            >
              <Pill className="h-4 w-4 text-emerald-700" />
              <span>पर्ची लिखें (Write Rx)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.print();
                }
              }}
              className="min-h-[48px] px-4 rounded-2xl border-2 border-emerald-600 bg-ayush-green text-white font-extrabold text-xs inline-flex items-center gap-2 shadow-sm hover:bg-emerald-700"
            >
              <FileText className="h-4 w-4" />
              <span>सरकारी OPD पर्ची प्रिंट / Export PDF</span>
            </button>

              <ExtraLargeButton
                variant="primary"
                size="default"
                icon={<ShieldCheck className="h-5 w-5" />}
                onClick={handleAccept}
                disabled={loading}
              >
                स्वीकृत व हस्ताक्षर करें (Accept & Sign)
              </ExtraLargeButton>
            </div>
          </div>
        </div>
      </div>
    );
  }



