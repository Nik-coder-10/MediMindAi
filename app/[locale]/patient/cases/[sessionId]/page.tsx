"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Pill,
  Activity,
  ShieldCheck,
  Stethoscope,
  Sparkles,
  Calendar,
  User,
  Loader2,
  Share2,
  Printer,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/use-auth-store";

export default function PatientIndividualCaseDetailsPage({
  params,
}: {
  params: { locale: string; sessionId: string };
}) {
  const router = useRouter();
  const { locale, sessionId } = params;
  const isHindi = locale === "hi";

  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"SUMMARY" | "ANSWERS" | "DOCS" | "TIMELINE">("SUMMARY");

  const { user } = useAuthStore();

  useEffect(() => {
    async function loadCaseDetails() {
      setLoading(true);
      setError(null);
      try {
        const activeUserId = user?.id || "pat-104-demo";
        const res = await fetch(`/api/patient/cases/${sessionId}`, {
          headers: {
            "x-user-id": activeUserId,
          },
        });
        const data = await res.json();
        if (res.ok && data.data) {
          setCaseData(data.data);
        } else {
          setError(data.error?.message || "Failed to load case details.");
        }
      } catch (err: any) {
        setError("Network error while fetching case dossier.");
      } finally {
        setLoading(false);
      }
    }
    loadCaseDetails();
  }, [sessionId, user?.id]);

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mx-auto" />
        <p className="text-sm font-bold text-muted-foreground">
          {isHindi ? "केस विवरण लोड हो रहा है..." : "Loading consultation details..."}
        </p>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <Card className="max-w-md mx-auto p-8 text-center rounded-3xl border-2 border-rose-300 bg-rose-50/40 dark:bg-rose-950/20 space-y-4">
        <AlertTriangle className="h-10 w-10 text-rose-600 mx-auto" />
        <div className="space-y-1">
          <h3 className="text-base font-extrabold text-rose-950 dark:text-rose-200">
            {isHindi ? "परामर्श लोड नहीं हो सका" : "Unable to Access Case"}
          </h3>
          <p className="text-xs text-rose-800 dark:text-rose-300 font-medium">
            {error || "This consultation does not exist or you do not have permission to view it."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push(`/${locale}/patient/cases`)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{isHindi ? "मेरे परामर्श पर वापस जाएं" : "Back to My Cases"}</span>
        </button>
      </Card>
    );
  }

  const primaryComplaint = caseData.chiefComplaints?.[0]?.symptomName || "Consultation Intake";
  const formattedDate = new Date(caseData.startedAt).toLocaleDateString(
    locale === "hi" ? "hi-IN" : "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/${locale}/patient/cases`}
          className="text-xs font-bold text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 min-h-[38px] px-3 rounded-lg border bg-card"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{isHindi ? "सभी केस देखें (Back)" : "Back to All Cases"}</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="text-xs font-bold text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 min-h-[38px] px-3 rounded-lg border bg-card"
          >
            <Printer className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isHindi ? "प्रिंट / PDF" : "Print Record"}</span>
          </button>
        </div>
      </div>

      {/* Case Header Card */}
      <Card className="p-6 rounded-3xl border-2 border-indigo-200 dark:border-indigo-900 bg-gradient-to-br from-white to-indigo-50/30 dark:from-slate-900 dark:to-slate-950 shadow-sm space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1 min-w-[260px]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black px-3 py-1 rounded-lg bg-indigo-600 text-white font-mono shadow-xs">
                {caseData.tokenNumber}
              </span>
              <span className="text-[11px] font-extrabold px-3 py-0.5 rounded-full border bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300">
                {caseData.status === "WAITING_FOR_DOCTOR"
                  ? isHindi ? "कतार में (Waiting for Doctor)" : "Waiting for Doctor"
                  : caseData.status === "COMPLETED"
                  ? isHindi ? "डॉक्टर द्वारा हस्ताक्षरित (Completed)" : "Reviewed by Doctor"
                  : isHindi ? "सक्रिय (In Progress)" : "In Progress"}
              </span>
              {caseData.triagePriority === "EMERGENCY" && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-600 text-white">
                  EMERGENCY
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-foreground">{primaryComplaint}</h1>

            <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>परामर्श समय: {formattedDate}</span>
              <span>•</span>
              <span>ABHA: {caseData.patient.abhaId}</span>
            </p>
          </div>

          {/* Doctor Info Pill */}
          <div className="p-3.5 rounded-2xl bg-card border text-right space-y-0.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase block">
              {isHindi ? "उपस्थित चिकित्सक" : "Attending Physician"}
            </span>
            <div className="text-xs font-black text-foreground">
              {caseData.doctor?.name || (isHindi ? "AIIA कायचिकित्सा डेस्क" : "AIIA Kayachikitsa Desk")}
            </div>
            <span className="text-[10px] text-muted-foreground font-medium block">
              {caseData.doctor?.hospital || "All India Institute of Ayurveda (AIIA)"}
            </span>
          </div>
        </div>

        {/* Red Flag Notice */}
        {caseData.redFlags?.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-950 dark:text-rose-200 flex items-start gap-2.5">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="text-xs font-black uppercase">
                {isHindi ? "सुरक्षा चेतावनी (Safety Advisory):" : "Safety Alert Notice:"}
              </span>
              {caseData.redFlags.map((rf: any, i: number) => (
                <p key={i} className="text-xs font-semibold">
                  • {rf.description}
                </p>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b pb-2">
        {[
          { id: "SUMMARY", label: isHindi ? "क्लिनिकल सारांश (Summary)" : "Clinical Summary", icon: <FileText className="h-4 w-4" /> },
          { id: "ANSWERS", label: isHindi ? "प्रश्नोत्तरी उत्तर (Q&A)" : "Intake Answers", icon: <Activity className="h-4 w-4" /> },
          { id: "DOCS", label: isHindi ? "अपलोड की गई पर्चियां (Documents)" : "Uploaded Records", icon: <Pill className="h-4 w-4" /> },
          { id: "TIMELINE", label: isHindi ? "इतिहास (Timeline)" : "Longitudinal History", icon: <Calendar className="h-4 w-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all ${
              activeTab === tab.id
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-card text-muted-foreground hover:text-foreground border border-border"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab: Summary */}
      {activeTab === "SUMMARY" && (
        <div className="space-y-4">
          {caseData.summary ? (
            <Card className="p-6 rounded-3xl border space-y-4 bg-card">
              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {caseData.summary.isDoctorReviewed
                    ? isHindi ? "डॉक्टर द्वारा सत्यापित व हस्ताक्षरित" : "Physician Signed Off"
                    : isHindi ? "AI विश्लेषित सारांश (प्रतीक्षारत समीक्षा)" : "AI Generated (Pending Sign-off)"}
                </span>
                <span className="text-[11px] text-muted-foreground font-semibold">
                  अंतिम अपडेट: {new Date(caseData.summary.updatedAt).toLocaleDateString()}
                </span>
              </div>

              <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap font-mono text-foreground bg-muted/20 p-5 rounded-2xl border">
                {caseData.summary.markdown}
              </div>
            </Card>
          ) : (
            <Card className="p-10 text-center rounded-3xl border-2 border-dashed space-y-2 bg-muted/20">
              <Sparkles className="h-8 w-8 text-amber-500 mx-auto" />
              <h3 className="text-base font-bold text-foreground">
                {isHindi ? "सारांश तैयार हो रहा है" : "Clinical Summary Being Prepared"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isHindi
                  ? "डॉक्टर द्वारा केस समीक्षा के उपरांत पूर्ण नैदानिक पर्चा यहाँ उपलब्ध होगा।"
                  : "The official clinical case summary will appear here once synthesized and reviewed."}
              </p>
            </Card>
          )}
        </div>
      )}

      {/* Tab: Answers */}
      {activeTab === "ANSWERS" && (
        <Card className="p-6 rounded-3xl border space-y-4 bg-card">
          <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider">
            {isHindi ? "परामर्श के दौरान पूछे गए प्रश्न व आपके उत्तर" : "Intake Questionnaire Responses"}
          </h3>

          {caseData.answers?.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {isHindi ? "कोई प्रश्नोत्तर दर्ज नहीं हैं।" : "No persistent Q&A records found for this session."}
            </p>
          ) : (
            <div className="space-y-3">
              {caseData.answers.map((ans: any, idx: number) => (
                <div key={idx} className="p-4 rounded-2xl bg-muted/30 border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-indigo-600">
                      Q{idx + 1} · {ans.nodeCode}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(ans.answeredAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <p className="text-sm font-bold text-foreground">
                    {isHindi && ans.questionTextHindi ? ans.questionTextHindi : ans.questionText}
                  </p>

                  <div className="p-2.5 rounded-xl bg-background border text-xs font-extrabold text-indigo-950 dark:text-indigo-200">
                    उत्तर: {typeof ans.answerValue === "object" ? JSON.stringify(ans.answerValue) : String(ans.answerValue)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab: Documents & OCR */}
      {activeTab === "DOCS" && (
        <Card className="p-6 rounded-3xl border space-y-4 bg-card">
          <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider">
            {isHindi ? "संलग्न पर्चियां व निकाली गई जानकारी" : "Uploaded Prescriptions & Analyzed Data"}
          </h3>

          {caseData.documents?.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {isHindi ? "इस केस में कोई पर्चा अपलोड नहीं किया गया था।" : "No medical records attached to this encounter."}
            </p>
          ) : (
            <div className="space-y-4">
              {caseData.documents.map((doc: any, i: number) => (
                <div key={i} className="p-4 rounded-2xl bg-muted/30 border space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-indigo-600" />
                      <div>
                        <span className="text-xs font-black text-foreground block">{doc.fileName}</span>
                        <span className="text-[10px] text-muted-foreground">{doc.type}</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                      OCR विश्लेषित
                    </span>
                  </div>

                  {/* Medications */}
                  {doc.medications?.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                        <Pill className="h-3 w-3 text-indigo-600" /> पहचानी गई दवाइयां (Medications):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {doc.medications.map((m: any, mi: number) => (
                          <div key={mi} className="p-2 rounded-xl bg-background border text-xs">
                            <span className="font-bold block text-foreground">{m.name}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {m.dosage} • {m.frequency} • {m.duration}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Labs */}
                  {doc.labs?.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                        <Activity className="h-3 w-3 text-indigo-600" /> जांच मान (Lab Findings):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {doc.labs.map((l: any, li: number) => (
                          <div key={li} className="p-2 rounded-xl bg-background border text-xs flex justify-between">
                            <span className="font-bold text-foreground">{l.testName}</span>
                            <span className="font-mono font-bold text-indigo-700">
                              {l.value} {l.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab: Timeline */}
      {activeTab === "TIMELINE" && (
        <Card className="p-6 rounded-3xl border space-y-4 bg-card">
          <h3 className="text-sm font-extrabold text-foreground uppercase tracking-wider">
            {isHindi ? "रोगी का पिछला इतिहास" : "Longitudinal Clinical Timeline"}
          </h3>

          {caseData.timeline?.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {isHindi ? "कोई पूर्व माइलस्टोन उपलब्ध नहीं है।" : "No past milestone events recorded."}
            </p>
          ) : (
            <div className="space-y-3">
              {caseData.timeline.map((event: any, idx: number) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-muted/20 border flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">{event.title}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">({event.eventDate})</span>
                    </div>
                    {event.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
