"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AudioPrompt } from "@/components/ui/patient/AudioPrompt";
import { ExtraLargeButton } from "@/components/ui/patient/ExtraLargeButton";
import { IconButton } from "@/components/ui/patient/IconButton";
import { Card, CardContent } from "@/components/ui/card";
import { PlayCircle, ShieldCheck, FileText, Stethoscope, ArrowRight, UserCheck } from "lucide-react";

export default function PatientHomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const router = useRouter();

  return (
    <div className="space-y-8">
      {/* Audio-First Greeting */}
      <AudioPrompt
        hindiText="नमस्ते! अपना नया चिकित्सीय परामर्श शुरू करने के लिए नीचे हरा बटन दबाएं।"
        text="Hello! Tap the green button below to start your clinical consultation."
      />

      {/* Hero Action Launcher */}
      <Card className="border-3 border-ayush-emerald/30 shadow-lg bg-gradient-to-br from-white via-ayush-mint/20 to-emerald-50/40 dark:from-slate-900 dark:to-emerald-950/20 rounded-3xl p-6 sm:p-8 text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-ayush-green text-white flex items-center justify-center text-4xl shadow-xl">
          🏥
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            नया परामर्श शुरू करें
          </h1>
          <p className="text-lg font-medium text-muted-foreground">
            Start New Ayush Case-Taking Consultation
          </p>
        </div>

        <div className="pt-2 max-w-md mx-auto">
          <ExtraLargeButton
            variant="primary"
            size="giant"
            className="w-full"
            icon={<ArrowRight className="h-7 w-7" />}
            onClick={() => router.push(`/${locale}/patient/language`)}
          >
            शुरू करें (Start Now)
          </ExtraLargeButton>
        </div>
      </Card>

      {/* Direct Feature Access Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <IconButton
          icon={<ShieldCheck className="h-8 w-8 text-emerald-700" />}
          label="सहमति कार्ड"
          sublabel="Consent Form"
          onClick={() => router.push(`/${locale}/patient/consent`)}
        />
        <IconButton
          icon={<Stethoscope className="h-8 w-8 text-blue-700" />}
          label="लक्षण बताएं"
          sublabel="Complaints"
          onClick={() => router.push(`/${locale}/patient/complaint`)}
        />
        <IconButton
          icon={<FileText className="h-8 w-8 text-amber-700" />}
          label="पर्ची अपलोड"
          sublabel="Scan Documents"
          onClick={() => router.push(`/${locale}/patient/documents`)}
        />
        <IconButton
          icon={<UserCheck className="h-8 w-8 text-purple-700" />}
          label="केस सारांश"
          sublabel="Case Summary"
          onClick={() => router.push(`/${locale}/patient/summary-preview`)}
        />
      </div>
    </div>
  );
}
