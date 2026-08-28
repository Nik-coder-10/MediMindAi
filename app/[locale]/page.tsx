import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Stethoscope,
  User,
  ShieldCheck,
  Sparkles,
  Mic,
  FileText,
  ArrowRight,
  HeartPulse,
  Award,
  Activity,
  Zap,
  CheckCircle2,
  Lock,
  ChevronRight,
} from "lucide-react";

export default function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const stats = [
    { value: "< 4 Min", label: "Avg Intake Time", icon: "⚡", color: "from-indigo-500 to-indigo-600" },
    { value: "ABDM", label: "FHIR R4 Compliant", icon: "🛡️", color: "from-teal-500 to-teal-600" },
    { value: "Tridosha", label: "Auto Prakriti Analysis", icon: "🎯", color: "from-amber-500 to-amber-600" },
    { value: "Red-Flags", label: "Zero-Miss Triage", icon: "🚨", color: "from-red-500 to-red-600" },
  ];

  const bentoCards = [
    {
      span: "md:col-span-2",
      icon: <HeartPulse className="h-6 w-6" />,
      iconBg: "bg-gradient-to-br from-teal-500 to-teal-700",
      title: "Classical Dashavidha & Ashtavidha Pariksha Engine",
      desc: "Structured clinical intake assessing Dushya, Desha, Bala, Kala, Anala (Agni), Prakriti, Vayas, Satva, Satmya, and Ahara with ICD-11 & NAMASTE dual-coding synchronization.",
      extra: (
        <div className="p-4 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-white/80 dark:border-white/08 space-y-2.5">
          <div className="flex justify-between items-center text-[11px] font-bold">
            <span className="text-foreground">Live Doshic Distribution</span>
            <span className="font-mono text-teal-700 dark:text-teal-400">V:45% · P:35% · K:20%</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex">
            <div className="h-full bg-indigo-500 rounded-l-full" style={{ width: "45%" }} />
            <div className="h-full bg-amber-500" style={{ width: "35%" }} />
            <div className="h-full bg-teal-500 rounded-r-full" style={{ width: "20%" }} />
          </div>
          <div className="flex justify-between text-[9px] font-extrabold text-muted-foreground uppercase tracking-wide">
            <span className="text-indigo-600">■ वात (Vata)</span>
            <span className="text-amber-600">■ पित्त (Pitta)</span>
            <span className="text-teal-600">■ कफ (Kapha)</span>
          </div>
        </div>
      ),
    },
    {
      span: "md:col-span-1",
      icon: <Mic className="h-6 w-6" />,
      iconBg: "bg-gradient-to-br from-amber-500 to-amber-600",
      title: "Multilingual Indian TTS & Voice Triage",
      desc: "Empowering elderly, rural, and low-literacy patients with natural Hindi & Indian English audio read-outs and voice recording.",
      extra: (
        <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/30 flex items-center gap-2.5">
          <span className="text-xl">🔊</span>
          <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200">
            Bilingual Voice Prompts on Every Question Node
          </span>
        </div>
      ),
    },
    {
      span: "md:col-span-1",
      icon: <FileText className="h-6 w-6" />,
      iconBg: "bg-gradient-to-br from-indigo-500 to-indigo-700",
      title: "Document OCR & Lab Slip Parsing",
      desc: "Upload historical prescriptions and lab results to extract medicines, HbA1c, and abnormal biomarkers into the doctor's dossier.",
      extra: (
        <div className="px-3.5 py-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/30 font-mono text-[10px] font-bold text-indigo-900 dark:text-indigo-200">
          Parsed: Yogaraj Guggulu · ESR: 38 mm/hr · HbA1c: 6.8%
        </div>
      ),
    },
    {
      span: "md:col-span-2",
      icon: <Award className="h-6 w-6" />,
      iconBg: "bg-gradient-to-br from-indigo-600 to-indigo-800",
      title: "Institutional OPD Prescription & ABDM Linkage",
      desc: "Export standard Ministry of Ayush & AIIA-formatted OPD prescription sheets with doctor registration, hospital affiliation, and Pathya-Apathya lifestyle advice.",
      extra: (
        <div className="grid grid-cols-3 gap-2.5 text-[11px]">
          {[
            { label: "Doctor Verification", value: "CCIM / State Board", color: "text-foreground" },
            { label: "Prescription Export", value: "1-Click PDF / Print", color: "text-teal-700 dark:text-teal-400" },
            { label: "National Registry", value: "ABHA PHR Linked", color: "text-foreground" },
          ].map((item) => (
            <div
              key={item.label}
              className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-white/80 dark:border-white/06"
            >
              <span className="text-muted-foreground text-[9px] font-extrabold uppercase tracking-wider block mb-0.5">
                {item.label}
              </span>
              <span className={`font-bold ${item.color}`}>{item.value}</span>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="relative min-h-screen hero-mesh pb-24 space-y-20 overflow-hidden">
      {/* Ambient orbs */}
      <div className="absolute top-0 left-[15%] w-[600px] h-[600px] rounded-full bg-indigo-400/10 blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-[20%] right-[5%] w-[500px] h-[500px] rounded-full bg-teal-400/10 blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-[10%] left-[10%] w-[400px] h-[400px] rounded-full bg-indigo-300/8 blur-[100px] pointer-events-none -z-10" />

      {/* ── Hero ── */}
      <section className="container max-w-7xl pt-14 text-center space-y-8">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-[11px] font-bold text-indigo-800 dark:text-indigo-200 border border-indigo-200/60 dark:border-indigo-700/30 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
          </span>
          SIH 2026 Problem ID 26047 · Next-Gen Ayush Clinical Case-Taking Engine
        </div>

        {/* Headline */}
        <div className="space-y-5 max-w-4xl mx-auto">
          <h1 className="text-[42px] sm:text-[62px] lg:text-[72px] font-black tracking-tight text-foreground leading-[1.08]">
            Empowering{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-teal-500 to-teal-400">
              Ayush Healthcare
            </span>{" "}
            with AI Precision
          </h1>
          <p className="text-[16px] sm:text-[18px] text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
            Standardized classical Ashtavidha Pariksha, multilingual voice intake in Hindi &amp; English,
            instant prescription OCR, and ABDM interoperability — built for national scale.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
          <Link
            href={`/${locale}/patient`}
            className="inline-flex items-center gap-2.5 h-14 px-8 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white text-[15px] font-extrabold shadow-premium hover:shadow-indigo-glow transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <Mic className="h-5 w-5" />
            रोगी परामर्श (Patient Intake)
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href={`/${locale}/doctor`}
            className="inline-flex items-center gap-2.5 h-14 px-7 rounded-2xl glass border border-white/80 dark:border-white/10 text-foreground text-[15px] font-extrabold hover:shadow-glass-lg transition-all duration-300 hover:-translate-y-0.5"
          >
            <Stethoscope className="h-5 w-5 text-teal-600" />
            चिकित्सक डेस्क (Doctor Desk)
          </Link>

          <Link
            href={`/${locale}/admin-dashboard`}
            className="inline-flex items-center gap-2 h-14 px-5 rounded-2xl text-[14px] font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <Lock className="h-4 w-4" />
            Admin Console
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto pt-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="glass-card rounded-2xl p-3.5 flex items-center gap-3 text-left border border-white/70 dark:border-white/06"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-base shadow-sm shrink-0`}>
                {stat.icon}
              </div>
              <div>
                <div className="text-[14px] font-black text-foreground leading-tight">{stat.value}</div>
                <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide leading-snug mt-0.5">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bento Grid ── */}
      <section className="container max-w-7xl space-y-8">
        <div className="text-center space-y-2.5 max-w-2xl mx-auto">
          <span className="editorial-label text-teal-700 dark:text-teal-400">
            Core Technological Pillars
          </span>
          <h2 className="text-[30px] sm:text-[38px] font-black text-foreground tracking-tight">
            Designed for Clinicians,<br className="hidden sm:block" /> Built for Patients
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {bentoCards.map((card, i) => (
            <div
              key={i}
              className={`${card.span} glass-card rounded-3xl p-7 bento-hover border border-white/70 dark:border-white/06 space-y-5 flex flex-col justify-between`}
            >
              <div className="space-y-3">
                <div className={`w-12 h-12 rounded-2xl ${card.iconBg} text-white flex items-center justify-center shadow-md`}>
                  {card.icon}
                </div>
                <h3 className="text-[18px] font-black text-foreground leading-snug">
                  {card.title}
                </h3>
                <p className="text-[13px] text-muted-foreground font-medium leading-relaxed">
                  {card.desc}
                </p>
              </div>
              {card.extra}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="container max-w-7xl">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 sm:p-12">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 blur-[60px] pointer-events-none" />
          <div className="absolute bottom-0 left-[10%] w-48 h-48 rounded-full bg-teal-400/10 blur-[60px] pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2.5 text-center md:text-left max-w-xl">
              <h3 className="text-[24px] sm:text-[30px] font-black text-white leading-tight">
                Ready to experience modern Ayush clinical intelligence?
              </h3>
              <p className="text-[14px] text-indigo-200 font-medium leading-relaxed">
                Start as a patient for voice-guided intake, or access the clinical queue as an authenticated physician.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href={`/${locale}/patient`}
                className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-white text-indigo-700 text-[14px] font-extrabold shadow-lg hover:shadow-premium transition-all hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <Activity className="h-4 w-4" />
                Start Case Intake
              </Link>
              <Link
                href={`/${locale}/login`}
                className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-white/10 border border-white/20 text-white text-[14px] font-extrabold hover:bg-white/20 transition-all"
              >
                Portal Login
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
