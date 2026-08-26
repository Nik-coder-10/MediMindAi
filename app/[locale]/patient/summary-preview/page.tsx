"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ProgressStepper } from "@/components/ui/patient/ProgressStepper";
import { AudioPrompt } from "@/components/ui/patient/AudioPrompt";
import { ExtraLargeButton } from "@/components/ui/patient/ExtraLargeButton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CheckCircle2, ShieldCheck, HeartPulse, Stethoscope, ArrowLeft, Send } from "lucide-react";

export default function PatientSummaryPreviewPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const router = useRouter();

  const summaryData = {
    patientName: "रमेश शर्मा (Ramesh Sharma)",
    abhaId: "14-5542-8921-3410",
    symptoms: ["घुटनों और कलाइयों में तेज दर्द (Severe Joint Pain)", "सुबह १ घंटे से ज्यादा जकड़न (Morning Stiffness)"],
    digestiveAgni: "मंदाग्नि एवं भारी भोजन के बाद दर्द वृद्धि (Sluggish Agni with Ama)",
    documents: "१ पर्ची जोड़ी गई (Prior Ayush Rx - Yogaraja Guggulu)",
    triageLevel: "प्राथमिकता: डॉक्टर परामर्श तैयार (Ready for Doctor Consultation)",
  };

  const handleFinalSubmit = () => {
    // Submit case to doctor queue and redirect to patient dashboard
    router.push(`/${locale}/patient/patient-dashboard`);
  };

  return (
    <div className="space-y-6">
      <ProgressStepper currentStep={6} />

      <AudioPrompt
        hindiText="आपके द्वारा दी गई जानकारी का सारांश तैयार है। डॉक्टर के पास भेजने के लिए 'केस जमा करें' दबाएं।"
        text="Your case summary is ready. Tap 'Submit Case to Doctor' to send it to the clinical queue."
      />

      <Card className="border-3 border-ayush-green shadow-lg rounded-3xl bg-white dark:bg-card overflow-hidden">
        <CardHeader className="bg-ayush-mint/60 dark:bg-emerald-950/30 border-b p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                <ShieldCheck className="h-4 w-4" /> ABHA आईडी सत्यापित
              </span>
              <CardTitle className="text-2xl font-extrabold text-foreground">
                {summaryData.patientName}
              </CardTitle>
            </div>
            <span className="text-xs font-mono font-bold bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border shadow-sm">
              ABHA: {summaryData.abhaId}
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 space-y-1">
            <span className="text-xs font-extrabold text-ayush-green uppercase">मुख्य लक्षण (Reported Complaints):</span>
            <ul className="list-disc list-inside text-base font-bold text-foreground">
              {summaryData.symptoms.map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 space-y-1">
            <span className="text-xs font-extrabold text-amber-800 dark:text-amber-200 uppercase">पाचन व अग्नि लक्षण (Agni & Metabolism):</span>
            <p className="text-sm font-semibold text-foreground">{summaryData.digestiveAgni}</p>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 space-y-1">
            <span className="text-xs font-extrabold text-blue-800 dark:text-blue-200 uppercase">संलग्न दस्तावेज (Attached Documents):</span>
            <p className="text-sm font-semibold text-foreground">{summaryData.documents}</p>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-4">
        <ExtraLargeButton
          variant="secondary"
          size="default"
          icon={<ArrowLeft className="h-5 w-5" />}
          onClick={() => router.back()}
        >
          पीछे (Back)
        </ExtraLargeButton>

        <ExtraLargeButton
          variant="success"
          size="giant"
          className="shadow-xl"
          icon={<Send className="h-6 w-6" />}
          onClick={handleFinalSubmit}
        >
          केस डॉक्टर को भेजें (Submit Case)
        </ExtraLargeButton>
      </div>
    </div>
  );
}
