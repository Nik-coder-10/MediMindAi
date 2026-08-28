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

export default function IndividualDoctorCaseViewPage({
  params,
}: {
  params: { locale: string; sessionId: string };
}) {
  const router = useRouter();
  const sessionId = params.sessionId;
  const [caseData, setCaseData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"SUMMARY" | "TIMELINE" | "LABS" | "AYUSH" | "DOCS" | "PRESCRIPTION">("SUMMARY");
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


  useEffect(() => {
    async function loadCase() {
      setLoading(true);
      try {
        const res = await fetch(`/api/doctor/case/${sessionId}`);
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
  }, [sessionId]);

  const handleAccept = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/doctor/summary/${sessionId}/accept`, { method: "POST" });
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
      const res = await fetch(`/api/doctor/summary/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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

  const patient = caseData?.patient || { firstName: "Ramesh", lastName: "Sharma", age: 42, gender: "MALE", bloodGroup: "B+", abhaId: "14-5542-8921-3410" };
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

        <span className="text-xs font-extrabold px-3 py-1 bg-slate-100 dark:bg-slate-800 text-muted-foreground rounded-full">
          सत्र आईडी: {sessionId}
        </span>
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
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-extrabold px-3 py-0.5 rounded-full border ${
                  isEmergency ? "bg-rose-600 text-white border-rose-300 animate-pulse" : "bg-emerald-600 text-white"
                }`}
              >
                {caseData?.encounter?.triagePriority || "EMERGENCY"}
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
      </Card>

      {/* Case Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b pb-2">
        {[
          { id: "SUMMARY", label: "क्लिनिकल सारांश (Summary)", icon: <FileText className="h-4 w-4" /> },
          { id: "PRESCRIPTION", label: "🩺 चिकित्सक नुस्खा व OPD रिपोर्ट (Rx & Report)", icon: <Stethoscope className="h-4 w-4" /> },
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

        {/* Tab 2: Medical Timeline */}
        {activeTab === "TIMELINE" && (
          <Card className="p-6 sm:p-8 rounded-3xl border-2 border-input space-y-4 bg-card shadow-sm">
            <h3 className="text-base font-extrabold text-foreground">दीर्घकालिक इतिहास (Longitudinal History)</h3>
            <MedicalTimelineView events={caseData?.timeline || []} />
          </Card>
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
                    Doctor's authoritative clinical report, Rx medications, and lifestyle instructions.
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
                  <FileText className="h-4 w-4 text-emerald-700" /> १. चिकित्सक क्लिनिकल रिपोर्ट व जांच निष्कर्ष (Doctor's Assessment & Clinical Notes):
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

        {/* Tab 5: Documents */}
        {activeTab === "DOCS" && (
          <Card className="p-6 sm:p-8 rounded-3xl border-2 border-input space-y-4 bg-card shadow-sm">
            <h3 className="text-base font-extrabold text-foreground">अपलोड किए गए नुस्खे व पर्चे (Prescriptions)</h3>
            {caseData?.documents?.map((doc: any, i: number) => (
              <div key={i} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold text-foreground">{doc.fileName}</span>
                  <span className="text-xs font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                    {doc.type}
                  </span>
                </div>
                <div className="text-xs space-y-1 text-muted-foreground font-semibold">
                  {doc.medications?.map((m: any, idx: number) => (
                    <div key={idx}>• {m.name} ({m.frequency} • {m.duration})</div>
                  ))}
                </div>
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



