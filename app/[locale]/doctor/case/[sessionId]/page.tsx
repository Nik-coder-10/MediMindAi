"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ExtraLargeButton } from "@/components/ui/patient/ExtraLargeButton";
import { MedicalTimelineView } from "@/components/ui/clinical/MedicalTimelineView";
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
  const [activeTab, setActiveTab] = useState<"SUMMARY" | "TIMELINE" | "LABS" | "AYUSH" | "DOCS">("SUMMARY");
  const [editedMarkdown, setEditedMarkdown] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

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
          { id: "TIMELINE", label: "इतिहास (Timeline)", icon: <Calendar className="h-4 w-4" /> },
          { id: "LABS", label: "जांच रिपोर्ट (Abnormal Labs)", icon: <Activity className="h-4 w-4" /> },
          { id: "AYUSH", label: "आयुर्वेद दशविध (AYUSH)", icon: <Sparkles className="h-4 w-4" /> },
          { id: "DOCS", label: "दस्तावेज़ (Documents)", icon: <Pill className="h-4 w-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`min-h-[44px] px-4 rounded-2xl text-xs font-extrabold inline-flex items-center gap-2 transition-all ${
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
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-sm font-extrabold text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                {isEditing ? "संशोधन मोड (Editing Mode)" : "AI समर्थित क्लिनिकल सारांश (AI Draft)"}
              </span>

              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs font-bold px-3 py-1.5 rounded-lg border bg-emerald-50 text-emerald-800 inline-flex items-center gap-1"
              >
                {isEditing ? <Eye className="h-3.5 w-3.5" /> : <Edit3 className="h-3.5 w-3.5" />}
                <span>{isEditing ? "पूर्वावलोकन देखें" : "संशोधित करें (Edit)"}</span>
              </button>
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

        {/* Tab 4: Ayurveda Dashavidha */}
        {activeTab === "AYUSH" && (
          <Card className="p-6 sm:p-8 rounded-3xl border-2 border-input space-y-4 bg-card shadow-sm">
            <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <span>चरक संहिता दशविध परीक्षा परिणाम (Dashavidha Pariksha)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 space-y-1">
                <span className="text-xs font-bold text-muted-foreground uppercase">देहा प्रकृति</span>
                <p className="text-base font-extrabold text-emerald-950 dark:text-emerald-200">{caseData?.ayurveda?.prakriti}</p>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 space-y-1">
                <span className="text-xs font-bold text-muted-foreground uppercase">अग्नि स्थिति</span>
                <p className="text-base font-extrabold text-emerald-950 dark:text-emerald-200">{caseData?.ayurveda?.agni}</p>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 space-y-1">
                <span className="text-xs font-bold text-muted-foreground uppercase">कोष्ठ व मल</span>
                <p className="text-base font-extrabold text-emerald-950 dark:text-emerald-200">{caseData?.ayurveda?.koshtha}</p>
              </div>
            </div>
          </Card>
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
              onClick={() => setIsEditing(true)}
              className="min-h-[48px] px-5 rounded-2xl border-2 border-input font-bold text-xs inline-flex items-center gap-2 hover:bg-muted"
            >
              <Edit3 className="h-4 w-4" />
              <span>संशोधन (Edit)</span>
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
