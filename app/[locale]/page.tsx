import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Stethoscope, User, ShieldCheck, Sparkles, Mic, FileText, Database } from "lucide-react";

export default function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return (
    <div className="container py-12 space-y-12">
      {/* Hero section */}
      <section className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <span>🌿</span> SIH 2026 Problem ID 26047 • Ministry of Ayush / AIIA
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
          Ayush Patient <span className="text-ayush-green">Case-Taking</span> & Prakriti System
        </h1>
        <p className="text-muted-foreground text-lg">
          A high-performance, accessible, ABDM-ready platform integrating Ashtavidha & Dashavidha Pariksha, AI Prakriti inference, and multilingual voice case records.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <Button variant="ayush" size="lg" asChild>
            <Link href={`/${locale}/doctor/consultation`}>Doctor Consultation</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href={`/${locale}/patient/patient-dashboard`}>Patient PHR Portal</Link>
          </Button>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-all border-emerald-100">
          <CardHeader>
            <Stethoscope className="h-8 w-8 text-ayush-green mb-2" />
            <CardTitle>Ayush Pariksha Protocols</CardTitle>
            <CardDescription>
              Standardized Ashtavidha & Dashavidha Pariksha data capture with NAMASTE/ICD-11 mapping.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-xs font-semibold text-muted-foreground">Pulse • Tongue • Eyes • Agni • Koshta</span>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-emerald-100">
          <CardHeader>
            <Sparkles className="h-8 w-8 text-amber-500 mb-2" />
            <CardTitle>AI & Multi-Modal Layer</CardTitle>
            <CardDescription>
              Voice ASR input (Hindi/Regional), document prescription OCR, and Prakriti inference service.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-xs font-semibold text-muted-foreground">Whisper • Tesseract / DocAI • LLM Engine</span>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-emerald-100">
          <CardHeader>
            <ShieldCheck className="h-8 w-8 text-blue-600 mb-2" />
            <CardTitle>ABDM & FHIR Compliance</CardTitle>
            <CardDescription>
              ABHA ID verification, Consent Artefact management, and Ayush FHIR Bundle generation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-xs font-semibold text-muted-foreground">ABHA • Consent Manager • Ayush FHIR</span>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
