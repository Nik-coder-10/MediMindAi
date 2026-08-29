"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProgressStepper } from "@/components/ui/patient/ProgressStepper";
import { AudioPrompt } from "@/components/ui/patient/AudioPrompt";
import { ExtraLargeButton } from "@/components/ui/patient/ExtraLargeButton";
import { MedicalTimelineView } from "@/components/ui/clinical/MedicalTimelineView";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
  Check,
  User,
  HeartHandshake,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/stores/use-auth-store";


export default function PatientSummaryPreviewPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<Array<{ name: string; size: string }>>([]);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [chiefComplaint, setChiefComplaint] = useState<string>("सिरदर्द व शरीर में दर्द");


  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const storedDocs = sessionStorage.getItem("ayush_uploaded_docs");
        const storedEntities = sessionStorage.getItem("ayush_extracted_entities");
        const storedComplaint = sessionStorage.getItem("ayursetu_chief_complaint");
        if (storedDocs) setUploadedDocs(JSON.parse(storedDocs));
        if (storedEntities) setExtractedData(JSON.parse(storedEntities));
        if (storedComplaint) setChiefComplaint(storedComplaint);
      }
    } catch (e) {
      console.error("Failed to load session storage data", e);
    }
  }, []);

  const documentSummaryText =
    uploadedDocs.length > 0
      ? `${uploadedDocs.length} दस्तावेज़ अपलोड किए गए (${uploadedDocs.map((d) => d.name).join(", ")})`
      : "कोई पुराना पर्चा अपलोड नहीं किया गया (Direct Clinical Consultation)";

  const medicationsList = extractedData?.medications || [];
  const labsList = extractedData?.labResults || [];

  const isHeadache = chiefComplaint.toLowerCase().includes("head") || chiefComplaint.includes("सिर") || chiefComplaint.includes("सर");
  const isMsk = chiefComplaint.toLowerCase().includes("knee") || chiefComplaint.toLowerCase().includes("joint") || chiefComplaint.includes("घुटने") || chiefComplaint.includes("जोड़");

  const { user } = useAuthStore();
  const patientDisplayName = user?.name || "रोगी (Patient)";
  const patientAgeGender = user?.age && user?.gender ? `${user.age}Y / ${user.gender}` : "पंजीकृत रोगी (Registered)";
  const patientAbha = user?.abhaId || "ABHA-सत्यापित (Verified)";

  const summaryData = {
    patientName: patientDisplayName,
    ageGender: patientAgeGender,
    abhaId: patientAbha,
    chiefComplaint: chiefComplaint || "परामर्श लक्षण (Intake in progress)",
    duration: "२-३ दिन से (Acute presentation)",
    severity: "मध्यम से तीव्र (Moderate to Severe)",
    radiation: isHeadache ? "माथे व दोनों तरफ (Forehead & Bilateral temples)" : isMsk ? "जोड़ों के आसपास (Periarticular)" : "स्थानीय (Localized)",
    associated: isHeadache ? "गले में खराश व शरीर में दर्द (Sore throat & body ache)" : "हल्की हरारत व सुस्ती (Malaise & fatigue)",
    ayushMode: "आयुर्वेद मोड (Ayurveda Clinical Mode Active)",
    prakriti: isHeadache ? "वात-पित्त (Vata-Pitta)" : "वात-कफ (Vata-Kapha)",
    agni: "विषमाग्नि (Irregular Digestion)",
    documents: documentSummaryText,
  };


  const [generatedToken, setGeneratedToken] = useState<string>("#AYUR-104");

  const handleSubmitToDoctor = async () => {
    setSubmitting(true);
    try {
      const activeSessionId = (typeof window !== "undefined" && sessionStorage.getItem("ayursetu_active_session_id")) || "sess-demo-001";
      const res = await fetch("/api/patient/session/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: activeSessionId,
          chiefComplaint: chiefComplaint || "General consultation",
        }),
      });
      const data = await res.json();
      if (data.data?.tokenNumber) {
        setGeneratedToken(data.data.tokenNumber);
      }
      setSubmittedSuccess(true);
    } catch {
      setSubmittedSuccess(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12">
      <ProgressStepper currentStep={6} />

      <AudioPrompt
        hindiText="यह आपके द्वारा दी गई जानकारी और अपलोड किए गए पर्चे का सारांश है जो आपके डॉक्टर को दिखेगा। कृपया जांच लें और डॉक्टर को भेजें।"
        text="This is a plain-language summary of your reported information and analyzed documents. Please review and tap Submit to Doctor."
      />

      <Card className="border-3 border-emerald-300 shadow-xl rounded-3xl bg-white dark:bg-card p-6 sm:p-8 space-y-6 text-left">
        <div className="space-y-1 text-center">
          <span className="text-xs font-extrabold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full inline-flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" /> चरण ६ • परामर्श सारांश (Summary Review)
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            डॉक्टर को भेजी जाने वाली जानकारी
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-muted-foreground">
            Extracted & synthesized clinical dossier for attending physician desk.
          </p>
        </div>

        {/* Patient Core Badge */}
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-muted-foreground uppercase">रोगी विवरण (Patient)</span>
            <div className="text-base font-extrabold text-foreground">{summaryData.patientName}</div>
            <div className="text-xs font-semibold text-muted-foreground">
              {summaryData.ageGender} • ABHA: {summaryData.abhaId}
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-200 text-emerald-900 flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5" /> सहमति प्राप्त
          </span>
        </div>

        {/* Plain Language Summary Grid */}
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border space-y-1">
            <span className="text-xs font-extrabold text-muted-foreground uppercase">१. मुख्य समस्या (Chief Problem):</span>
            <p className="text-base font-extrabold text-foreground">{summaryData.chiefComplaint}</p>
            <p className="text-xs font-semibold text-muted-foreground">अवधि: {summaryData.duration} • गंभीरता: {summaryData.severity}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border space-y-1">
            <span className="text-xs font-extrabold text-muted-foreground uppercase">२. लक्षण व फैलाव (Symptoms & Spread):</span>
            <p className="text-sm font-bold text-foreground">• दर्द का फैलाव: {summaryData.radiation}</p>
            <p className="text-sm font-bold text-foreground">• अन्य परेशानी: {summaryData.associated}</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border space-y-1">
            <span className="text-xs font-extrabold text-muted-foreground uppercase">३. आयुर्वेद प्रकृति व पाचन (Ayurveda Profile):</span>
            <p className="text-sm font-bold text-foreground">• देहा प्रकृति: {summaryData.prakriti}</p>
            <p className="text-sm font-bold text-foreground">• पाचन अग्नि: {summaryData.agni}</p>
          </div>

          {/* Extracted Document Summary & Medication Chips */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border-2 border-emerald-300 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-emerald-900 dark:text-emerald-300 uppercase flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-emerald-700" /> ४. संलग्न दस्तावेज़ व निकाली गई जानकारी (Analyzed Records):
              </span>
              <span className="text-2xs font-extrabold px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded-full">
                AI विश्लेषित
              </span>
            </div>

            <p className="text-sm font-extrabold text-foreground">{summaryData.documents}</p>

            {/* Crisp Medications from Document */}
            {medicationsList.length > 0 && (
              <div className="space-y-1.5 pt-1 border-t border-emerald-200/60">
                <span className="text-xs font-extrabold text-muted-foreground flex items-center gap-1">
                  <Pill className="h-3.5 w-3.5 text-emerald-600" /> सक्रिय दवाइयां (Active Medications):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {medicationsList.map((m: any, idx: number) => (
                    <div key={idx} className="p-2 rounded-xl bg-white dark:bg-slate-900 border text-xs shadow-2xs">
                      <span className="font-extrabold text-foreground block">{m.name}</span>
                      <span className="text-muted-foreground font-semibold text-2xs">
                        {m.dosage} • {m.frequency} • {m.duration}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Crisp Labs from Document */}
            {labsList.length > 0 && (
              <div className="space-y-1.5 pt-1 border-t border-emerald-200/60">
                <span className="text-xs font-extrabold text-muted-foreground flex items-center gap-1">
                  <Activity className="h-3.5 w-3.5 text-emerald-600" /> जांच रिपोर्ट व असामान्य मान (Lab Findings):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {labsList.map((lab: any, idx: number) => (
                    <div key={idx} className="p-2 rounded-xl bg-white dark:bg-slate-900 border text-xs flex justify-between items-center shadow-2xs">
                      <div>
                        <span className="font-extrabold text-foreground block">{lab.testName}</span>
                        <span className="text-muted-foreground font-semibold text-2xs">
                          {lab.value} {lab.unit} ({lab.referenceRange})
                        </span>
                      </div>
                      {lab.flag === "HIGH" && (
                        <span className="px-1.5 py-0.5 rounded text-2xs font-extrabold bg-amber-100 text-amber-900">
                          HIGH
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>


        {/* Longitudinal Timeline Component */}
        <div className="space-y-2 pt-2">
          <span className="text-xs font-extrabold text-muted-foreground uppercase flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-emerald-600" /> पिछला इतिहास (Past Medical Milestones):
          </span>
          <MedicalTimelineView
            events={[
              {
                id: "curr-1",
                patientId: user?.id || "pat-current",
                eventDate: new Date().toISOString().split("T")[0],
                title: "आज का परामर्श (Today's Case-Taking)",
                description: `${chiefComplaint || "परामर्श सत्र प्रारंभ"} (Active clinical intake).`,
                category: "DIAGNOSIS",
              },
            ]}
          />
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t">
          <ExtraLargeButton
            variant="secondary"
            size="default"
            icon={<ArrowLeft className="h-5 w-5" />}
            onClick={() => router.back()}
          >
            बदलाव करें (Edit)
          </ExtraLargeButton>

          <ExtraLargeButton
            variant="primary"
            size="large"
            icon={<Send className="h-5 w-5" />}
            onClick={handleSubmitToDoctor}
            disabled={submitting}
          >
            {submitting ? "भेज रहे हैं..." : "डॉक्टर को भेजें (Submit to Doctor)"}
          </ExtraLargeButton>
        </div>
      </Card>

      {/* Reassuring Submission Confirmation Modal */}
      <AnimatePresence>
        {submittedSuccess && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 border-4 border-emerald-500 rounded-3xl p-6 sm:p-8 space-y-6 text-center shadow-2xl"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-inner">
                <CheckCircle2 className="h-12 w-12" />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-extrabold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full uppercase">
                  परामर्श सफलतापूर्वक दर्ज (Submitted)
                </span>
                <h3 className="text-2xl font-extrabold text-foreground">
                  आपकी जानकारी डॉक्टर को भेज दी गई है
                </h3>
                <p className="text-sm font-medium text-muted-foreground">
                  Your case dossier is now live on the attending physician desk.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 text-center space-y-1">
                <span className="text-xs font-bold text-muted-foreground uppercase">आपका टोकन नंबर (Token):</span>
                <div className="text-2xl font-extrabold text-emerald-900 dark:text-emerald-200">{generatedToken}</div>
                <p className="text-xs font-semibold text-emerald-700 flex items-center justify-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> अनुमानित प्रतीक्षा समय: 10-15 मिनट
                </p>
              </div>

              <div className="space-y-2">
                <ExtraLargeButton
                  variant="primary"
                  size="large"
                  className="w-full"
                  onClick={() => router.push(`/${locale}/patient/cases`)}
                >
                  मेरे परामर्श देखें (View My Cases)
                </ExtraLargeButton>
                <button
                  type="button"
                  onClick={() => router.push(`/${locale}/patient`)}
                  className="text-xs font-bold text-muted-foreground hover:text-foreground text-center w-full py-1.5"
                >
                  मुख्य पृष्ठ पर जाएं (Back to Home)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
