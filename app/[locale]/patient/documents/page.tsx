"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ProgressStepper } from "@/components/ui/patient/ProgressStepper";
import { AudioPrompt } from "@/components/ui/patient/AudioPrompt";
import { DocumentScanCard } from "@/components/ui/patient/DocumentScanCard";
import { ExtraLargeButton } from "@/components/ui/patient/ExtraLargeButton";
import { ArrowLeft, ArrowRight, SkipForward } from "lucide-react";

export default function PatientDocumentsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const router = useRouter();
  const [hasUploadedFile, setHasUploadedFile] = useState(false);

  return (
    <div className="space-y-6">
      <ProgressStepper currentStep={5} />

      <AudioPrompt
        hindiText="यदि आपके पास पहले की कोई डॉक्टर की पर्ची या जांच रिपोर्ट है, तो उसकी फोटो खींचें।"
        text="If you have any prior doctor prescriptions or blood test reports, take a photo or upload it."
      />

      <DocumentScanCard
        title="पुरानी पर्ची या जांच रिपोर्ट की फोटो लें"
        description="Take photo of doctor prescription, discharge slip, or blood tests"
        onFileSelected={() => setHasUploadedFile(true)}
      />

      {/* Navigation & Optional Skip Button */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
        <ExtraLargeButton
          variant="secondary"
          size="default"
          className="w-full sm:w-auto"
          icon={<ArrowLeft className="h-5 w-5" />}
          onClick={() => router.back()}
        >
          पीछे (Back)
        </ExtraLargeButton>

        <div className="flex gap-3 w-full sm:w-auto">
          {!hasUploadedFile && (
            <ExtraLargeButton
              variant="secondary"
              size="default"
              className="w-full sm:w-auto text-muted-foreground"
              icon={<SkipForward className="h-5 w-5" />}
              onClick={() => router.push(`/${locale}/patient/summary-preview`)}
            >
              पर्ची नहीं है (Skip)
            </ExtraLargeButton>
          )}

          <ExtraLargeButton
            variant="primary"
            size="large"
            className="w-full sm:w-auto"
            icon={<ArrowRight className="h-6 w-6" />}
            onClick={() => router.push(`/${locale}/patient/summary-preview`)}
          >
            सारांश देखें (View Summary)
          </ExtraLargeButton>
        </div>
      </div>
    </div>
  );
}
