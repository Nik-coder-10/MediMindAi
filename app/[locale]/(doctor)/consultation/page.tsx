"use client";

import React from "react";
import { PrakritiAssessmentPanel } from "@/components/doctor/PrakritiAssessmentPanel";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";
import { Mic, MicOff, Save, Sparkles, Upload } from "lucide-react";

export default function DoctorConsultationPage() {
  const { isRecording, startRecording, stopRecording } = useVoiceRecorder();

  return (
    <div className="space-y-6">
      {/* Patient Search & Voice Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-4 border rounded-xl shadow-sm">
        <div className="flex-1 w-full flex gap-3">
          <Input placeholder="Enter Patient ABHA Number or Mobile..." className="max-w-md" />
          <Button variant="outline">Search Patient</Button>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={isRecording ? "destructive" : "outline"}
            onClick={isRecording ? () => stopRecording() : () => startRecording()}
            className="flex items-center gap-2"
          >
            {isRecording ? <MicOff className="h-4 w-4 animate-pulse" /> : <Mic className="h-4 w-4" />}
            <span>{isRecording ? "Recording Audio..." : "Voice Dictation"}</span>
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            <span>OCR Prescription</span>
          </Button>
        </div>
      </div>

      {/* Prakriti Overview */}
      <PrakritiAssessmentPanel />

      {/* Ashtavidha Pariksha Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ashtavidha Pariksha (अष्टविध परीक्षा)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Nadi (Pulse)</label>
              <Input placeholder="Vata / Pitta / Kapha Gati" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Jihwa (Tongue)</label>
              <Input placeholder="Saama / Niraama / Varnata" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Mutra (Urine)</label>
              <Input placeholder="Avila / Peeta / Prakrita" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Mala (Bowel)</label>
              <Input placeholder="Baddha / Drava / Saama" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Shabda (Voice)</label>
              <Input placeholder="Spashta / Guru / Ksheena" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Sparsha (Touch)</label>
              <Input placeholder="Sheeta / Ushna / Ruksha" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Drik (Eyes)</label>
              <Input placeholder="Prakrita / Haridra / Ruksha" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Akriti (Build)</label>
              <Input placeholder="Sthula / Madhyama / Krisha" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Bar */}
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline">Save Draft</Button>
        <Button variant="ayush" className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          <span>Finalize & Generate Ayush FHIR EHR</span>
        </Button>
      </div>
    </div>
  );
}
