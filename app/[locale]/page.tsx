import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Stethoscope,
  User,
  ShieldCheck,
  Sparkles,
  Mic,
  FileText,
  Database,
  ArrowRight,
  HeartPulse,
  Award,
  Activity,
  Zap,
  Globe2,
  CheckCircle2,
  Lock,
  Layers,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

export default function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return (
    <div className="relative min-h-screen hero-mesh pb-20 space-y-16 overflow-hidden">
      {/* Background Decorative Ambient Orbs */}
      <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-emerald-300/20 blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-[30%] right-[10%] w-[450px] h-[450px] rounded-full bg-sky-300/20 blur-[100px] pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="container max-w-7xl pt-12 space-y-8 text-center">

        {/* Floating Capsule Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-xs font-bold liquid-glass text-emerald-950 dark:text-emerald-200 shadow-sm border animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Next-Gen Smart Ayush Clinical Case-Taking & Triage Engine</span>
        </div>

        {/* Hero Title */}
        <div className="space-y-4 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-foreground leading-[1.1]">
            Empowering <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600">Ayush Healthcare</span> with AI & Dashavidha Precision
          </h1>
          <p className="text-base sm:text-xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
            Standardized classical Ashtavidha Pariksha, multilingual voice intake in Hindi & English, instant prescription OCR intelligence, and ABDM interoperability.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Button variant="ayush" size="lg" asChild className="h-14 px-8 rounded-2xl text-base font-extrabold shadow-xl hover:scale-105 transition-all">
            <Link href={`/${locale}/patient`} className="flex items-center gap-2.5">
              <Mic className="h-5 w-5" />
              <span>रोगी परामर्श (Start Patient Intake)</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>

          <Button variant="outline" size="lg" asChild className="h-14 px-7 rounded-2xl text-base font-extrabold border-2 shadow-sm hover:scale-105 transition-all bg-card/80 backdrop-blur-md">
            <Link href={`/${locale}/doctor`} className="flex items-center gap-2.5">
              <Stethoscope className="h-5 w-5 text-emerald-600" />
              <span>चिकित्सक डेस्क (Doctor Desk)</span>
            </Link>
          </Button>

          <Button variant="ghost" size="lg" asChild className="h-14 px-5 rounded-2xl text-sm font-bold text-muted-foreground hover:text-foreground">
            <Link href={`/${locale}/admin-dashboard`} className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span>व्यवस्थापक नियंत्रण (Admin Console)</span>
            </Link>
          </Button>
        </div>

        {/* Live Clinical Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto pt-6 text-left">
          <div className="p-3.5 rounded-2xl glass-card border flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 flex items-center justify-center text-lg font-bold">
              ⚡
            </div>
            <div>
              <div className="text-base font-black text-foreground">&lt; 4 Min</div>
              <div className="text-3xs font-bold text-muted-foreground uppercase">Average Intake Time</div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl glass-card border flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-700 flex items-center justify-center text-lg font-bold">
              🛡️
            </div>
            <div>
              <div className="text-base font-black text-foreground">100% ABDM</div>
              <div className="text-3xs font-bold text-muted-foreground uppercase">FHIR R4 Compliant</div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl glass-card border flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 flex items-center justify-center text-lg font-bold">
              🎯
            </div>
            <div>
              <div className="text-base font-black text-foreground">Tridosha</div>
              <div className="text-3xs font-bold text-muted-foreground uppercase">Automated Prakriti</div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl glass-card border flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-700 flex items-center justify-center text-lg font-bold">
              🚨
            </div>
            <div>
              <div className="text-base font-black text-foreground">Red-Flags</div>
              <div className="text-3xs font-bold text-muted-foreground uppercase">Zero-Miss Safety Triage</div>
            </div>
          </div>
        </div>
      </section>

      {/* Apple-Inspired Bento Grid Architecture */}
      <section className="container max-w-7xl space-y-6 pt-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
            Core Technological Pillars
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Designed for Clinicians, Built for Patients
          </h2>
        </div>

        {/* Bento Grid 2x3 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Large Bento Feature (Span 2) */}
          <div className="md:col-span-2 p-8 rounded-3xl glass-card bento-hover border space-y-5 relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-3 max-w-xl">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg">
                <HeartPulse className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-black text-foreground">
                Classical Dashavidha & Ashtavidha Pariksha Engine
              </h3>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                Structured clinical intake assessing Dushya, Desha, Bala, Kala, Anala (Agni), Prakriti, Vayas, Satva, Satmya, and Ahara with ICD-11 & NAMASTE dual-coding synchronization.
              </p>
            </div>

            {/* Visual Doshic Ratio Bar Preview */}
            <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border space-y-3">
              <div className="flex justify-between items-center text-xs font-extrabold">
                <span className="text-foreground">Live Doshic Distribution (Tridosha Vikriti Radar)</span>
                <span className="font-mono text-emerald-700 font-black">V:45% • P:35% • K:20%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex">
                <div className="h-full bg-blue-500" style={{ width: "45%" }} title="Vata" />
                <div className="h-full bg-amber-500" style={{ width: "35%" }} title="Pitta" />
                <div className="h-full bg-emerald-500" style={{ width: "20%" }} title="Kapha" />
              </div>
              <div className="flex justify-between text-3xs font-extrabold text-muted-foreground uppercase">
                <span className="text-blue-600">■ वात (Vata - 45%)</span>
                <span className="text-amber-600">■ पित्त (Pitta - 35%)</span>
                <span className="text-emerald-600">■ कफ (Kapha - 20%)</span>
              </div>
            </div>
          </div>

          {/* Card 2: Voice & Audio Accessibility (Span 1) */}
          <div className="p-8 rounded-3xl glass-card bento-hover border space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg">
                <Mic className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-extrabold text-foreground">
                Multilingual Indian TTS & Whisper Voice Triage
              </h3>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                Empowering elderly, rural, and low-literacy patients with natural Hindi and Indian English audio read-outs and voice recording.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 text-xs font-bold text-amber-950 dark:text-amber-200 flex items-center gap-2">
              <span className="text-lg">🔊</span>
              <span>Bilingual Voice Prompts on Every Question Node</span>
            </div>
          </div>

          {/* Card 3: Document OCR & Prescription Extraction (Span 1) */}
          <div className="p-8 rounded-3xl glass-card bento-hover border space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-lg">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-extrabold text-foreground">
                Document OCR & Lab Slip Parsing
              </h3>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                Upload historical prescriptions and lab results to automatically extract medicines, HbA1c, and abnormal biomarkers into the doctor's dossier.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 text-3xs font-mono font-bold text-sky-900 dark:text-sky-200">
              Parsed: Yogaraj Guggulu • ESR: 38 mm/hr • HbA1c: 6.8%
            </div>
          </div>

          {/* Card 4: Official OPD Slip & Digital Sign-off (Span 2) */}
          <div className="md:col-span-2 p-8 rounded-3xl glass-card bento-hover border space-y-5 flex flex-col justify-between">
            <div className="space-y-3 max-w-xl">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                <Award className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-black text-foreground">
                Institutional OPD Prescription Slip & ABDM Linkage
              </h3>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                Export standard Ministry of Ayush & AIIA-formatted OPD prescription sheets complete with doctor registration stamp, hospital affiliation column, and Pathya-Apathya lifestyle advice.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/70 border">
                <span className="text-muted-foreground text-3xs font-extrabold uppercase block">Doctor Verification</span>
                <span className="font-bold text-foreground">CCIM / State Board</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/70 border">
                <span className="text-muted-foreground text-3xs font-extrabold uppercase block">Prescription Export</span>
                <span className="font-bold text-emerald-700">1-Click PDF / Print</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/70 dark:bg-slate-900/70 border">
                <span className="text-muted-foreground text-3xs font-extrabold uppercase block">National Registry</span>
                <span className="font-bold text-foreground">ABHA PHR Linked</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role-Based Quick Access Callout */}
      <section className="container max-w-7xl pt-4">
        <div className="p-8 sm:p-10 rounded-3xl liquid-glass border-2 border-emerald-300 dark:border-emerald-700/60 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left max-w-xl">
            <h3 className="text-2xl sm:text-3xl font-black text-foreground">
              Ready to experience modern Ayush clinical intelligence?
            </h3>
            <p className="text-sm text-muted-foreground font-medium">
              Start as a patient to experience voice-guided intake, or access the clinical queue as an authenticated physician.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="ayush" size="lg" asChild className="h-12 px-6 rounded-xl font-extrabold shadow-md">
              <Link href={`/${locale}/patient`}>Start Case Intake</Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="h-12 px-6 rounded-xl font-extrabold border-2">
              <Link href={`/${locale}/login`}>Portal Login</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

