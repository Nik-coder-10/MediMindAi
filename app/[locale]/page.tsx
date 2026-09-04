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
import { LivingForestBackground } from "@/components/landing/LivingForestBackground";

export default function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const isHindi = locale === "hi";

  const stats = [
    {
      value: "< 4 Min",
      label: isHindi ? "औसत परामर्श समय" : "Avg Intake Time",
      icon: "⚡",
      color: "from-botanical-600 to-botanical-700",
    },
    {
      value: "ABDM",
      label: isHindi ? "FHIR R4 संगत" : "FHIR R4 Compliant",
      icon: "🛡️",
      color: "from-emerald-600 to-teal-600",
    },
    {
      value: isHindi ? "त्रिदोष" : "Tridosha",
      label: isHindi ? "स्वतः प्रकृति विश्लेषण" : "Auto Prakriti Analysis",
      icon: "🎯",
      color: "from-amber-600 to-amber-700",
    },
    {
      value: isHindi ? "रेड-फ्लैग्स" : "Red-Flags",
      label: isHindi ? "शून्य-चूक ट्राइएज" : "Zero-Miss Triage",
      icon: "🚨",
      color: "from-rose-600 to-rose-700",
    },
  ];

  const bentoCards = [
    {
      span: "md:col-span-2",
      icon: <HeartPulse className="h-6 w-6" />,
      iconBg: "bg-gradient-to-br from-botanical-600 to-botanical-800",
      title: isHindi
        ? "शास्त्रीय दशविध व अष्टविध परीक्षा इंजन"
        : "Classical Dashavidha & Ashtavidha Pariksha Engine",
      desc: isHindi
        ? "दूष्य, देश, बल, काल, अनल (अग्नि), प्रकृति, वय, सत्त्व, सात्म्य और आहार का संरचित नैदानिक मूल्यांकन — ICD-11 व नमस्ते (NAMASTE) कोड तुल्यकालन के साथ।"
        : "Structured clinical intake assessing Dushya, Desha, Bala, Kala, Anala (Agni), Prakriti, Vayas, Satva, Satmya, and Ahara with ICD-11 & NAMASTE dual-coding synchronization.",
      extra: (
        <div className="p-4 rounded-2xl bg-white/80 dark:bg-forest-card/80 border border-botanical-200/60 dark:border-botanical-800/40 space-y-2.5 shadow-2xs">
          <div className="flex justify-between items-center text-[11px] font-bold">
            <span className="text-foreground">
              {isHindi ? "लाइव त्रिदोष संतुलन वितरण" : "Live Doshic Distribution"}
            </span>
            <span className="font-mono text-botanical-700 dark:text-botanical-300">V:45% · P:35% · K:20%</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex">
            <div className="h-full bg-sky-600 rounded-l-full" style={{ width: "45%" }} />
            <div className="h-full bg-amber-500" style={{ width: "35%" }} />
            <div className="h-full bg-botanical-600 rounded-r-full" style={{ width: "20%" }} />
          </div>
          <div className="flex justify-between text-[9px] font-extrabold text-muted-foreground uppercase tracking-wider">
            <span className="text-sky-700 dark:text-sky-400">■ वात (Vata)</span>
            <span className="text-amber-700 dark:text-amber-400">■ पित्त (Pitta)</span>
            <span className="text-botanical-700 dark:text-botanical-400">■ कफ (Kapha)</span>
          </div>
        </div>
      ),
    },
    {
      span: "md:col-span-1",
      icon: <Mic className="h-6 w-6" />,
      iconBg: "bg-gradient-to-br from-amber-600 to-amber-700",
      title: isHindi
        ? "बहुभाषी भारतीय वॉयस व ट्राइएज प्रणाली"
        : "Multilingual Indian TTS & Voice Triage",
      desc: isHindi
        ? "बुजुर्ग, ग्रामीण एवं कम साक्षर रोगियों के लिए प्राकृतिक हिंदी एवं भारतीय अंग्रेजी में ऑडियो प्रश्नवाचन व वॉयस रिकॉर्डिंग।"
        : "Empowering elderly, rural, and low-literacy patients with natural Hindi & Indian English audio read-outs and voice recording.",
      extra: (
        <div className="p-3.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/40 flex items-center gap-2.5 shadow-2xs">
          <span className="text-xl">🔊</span>
          <span className="text-[11px] font-bold text-amber-950 dark:text-amber-200">
            {isHindi
              ? "प्रत्येक प्रश्न नोड पर द्विभाषी ऑडियो सहायता"
              : "Bilingual Voice Prompts on Every Question Node"}
          </span>
        </div>
      ),
    },
    {
      span: "md:col-span-1",
      icon: <FileText className="h-6 w-6" />,
      iconBg: "bg-gradient-to-br from-botanical-700 to-forest",
      title: isHindi
        ? "दस्तावेज ओसीआर एवं लैब रिपोर्ट विश्लेषण"
        : "Document OCR & Lab Slip Parsing",
      desc: isHindi
        ? "पुराने पर्चे और लैब जांच अपलोड करके दवाइयां, HbA1c, और असामान्य बायोमार्कर सीधे डॉक्टर के केस डोजियर में निकालें।"
        : "Upload historical prescriptions and lab results to extract medicines, HbA1c, and abnormal biomarkers into the doctor's dossier.",
      extra: (
        <div className="px-3.5 py-3 rounded-2xl bg-botanical-50/90 dark:bg-botanical-950/40 border border-botanical-200/70 dark:border-botanical-800/40 font-mono text-[10px] font-bold text-botanical-950 dark:text-botanical-200 shadow-2xs">
          {isHindi
            ? "विश्लेषित: योगराज गुग्गुलु · ESR: 38 mm/hr · HbA1c: 6.8%"
            : "Parsed: Yogaraj Guggulu · ESR: 38 mm/hr · HbA1c: 6.8%"}
        </div>
      ),
    },
    {
      span: "md:col-span-2",
      icon: <Award className="h-6 w-6" />,
      iconBg: "bg-gradient-to-br from-botanical-600 to-emerald-700",
      title: isHindi
        ? "संस्थागत ओपीडी पर्चा एवं आभा (ABDM) लिंकेज"
        : "Institutional OPD Prescription & ABDM Linkage",
      desc: isHindi
        ? "डॉक्टर पंजीकरण, अस्पताल संबद्धता, तथा पथ्य-अपथ्य जीवनशैली परामर्श युक्त मानक आयुष मंत्रालय व AIIA प्रारूप ओपीडी पर्चा निर्यात।"
        : "Export standard Ministry of Ayush & AIIA-formatted OPD prescription sheets with doctor registration, hospital affiliation, and Pathya-Apathya lifestyle advice.",
      extra: (
        <div className="grid grid-cols-3 gap-2.5 text-[11px]">
          {[
            {
              label: isHindi ? "चिकित्सक सत्यापन" : "Doctor Verification",
              value: isHindi ? "CCIM / राज्य बोर्ड" : "CCIM / State Board",
              color: "text-foreground",
            },
            {
              label: isHindi ? "पर्चा निर्यात" : "Prescription Export",
              value: isHindi ? "1-क्लिक PDF / प्रिंट" : "1-Click PDF / Print",
              color: "text-botanical-700 dark:text-botanical-400",
            },
            {
              label: isHindi ? "राष्ट्रीय रजिस्ट्री" : "National Registry",
              value: isHindi ? "आभा (ABHA) लिंक्ड" : "ABHA PHR Linked",
              color: "text-foreground",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="p-3 rounded-2xl bg-white/80 dark:bg-forest-card/80 border border-botanical-200/60 dark:border-botanical-800/30 shadow-2xs"
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
      {/* ── Hero ── */}
      <section className="container relative z-10 max-w-7xl pt-14 text-center space-y-8 animate-in fade-in-50 duration-700 slide-in-from-bottom-2">

        {/* Headline */}
        <div className="space-y-5 max-w-4xl mx-auto">
          <h1 className="text-[42px] sm:text-[62px] lg:text-[72px] font-black tracking-tight text-foreground leading-[1.08]">
            {isHindi ? (
              <>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-botanical-700 via-botanical-600 to-emerald-500">
                  आयुष स्वास्थ्य सेवा
                </span>{" "}
                को AI परिशुद्धता से सशक्त बनाना
              </>
            ) : (
              <>
                Empowering{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-botanical-700 via-botanical-600 to-emerald-500">
                  Ayush Healthcare
                </span>{" "}
                with AI Precision
              </>
            )}
          </h1>
          <p className="text-[16px] sm:text-[18px] text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
            {isHindi
              ? "मानकीकृत शास्त्रीय अष्टविध परीक्षा, हिंदी व अंग्रेजी में बहुभाषी वॉयस परामर्श, त्वरित पर्चा ओसीआर, एवं आयुष्मान भारत (ABDM) संगतता — राष्ट्रीय स्तर के लिए निर्मित।"
              : "Standardized classical Ashtavidha Pariksha, multilingual voice intake in Hindi & English, instant prescription OCR, and ABDM interoperability — built for national scale."}
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
          <Link
            href={`/${locale}/patient`}
            className="inline-flex items-center gap-2.5 h-14 px-8 rounded-2xl bg-gradient-botanical text-white text-[15px] font-extrabold shadow-glass-precision hover:shadow-botanical-glow transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <Mic className="h-5 w-5" />
            {isHindi ? "रोगी परामर्श (शुरू करें)" : "रोगी परामर्श (Patient Intake)"}
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href={`/${locale}/doctor`}
            className="inline-flex items-center gap-2.5 h-14 px-7 rounded-2xl glass-card border border-white/80 dark:border-white/10 text-foreground text-[15px] font-extrabold hover:shadow-glass-lg transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <Stethoscope className="h-5 w-5 text-botanical-600" />
            {isHindi ? "चिकित्सक डेस्क (Doctor Desk)" : "चिकित्सक डेस्क (Doctor Desk)"}
          </Link>

          <Link
            href={`/${locale}/admin-dashboard`}
            className="inline-flex items-center gap-2 h-14 px-5 rounded-2xl text-[14px] font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <Lock className="h-4 w-4" />
            {isHindi ? "व्यवस्थापक कंसोल" : "Admin Console"}
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto pt-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="glass-card rounded-2xl p-3.5 flex items-center gap-3 text-left border border-white/80 dark:border-white/06 shadow-glass-precision"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-base shadow-sm shrink-0 text-white`}>
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
          <span className="editorial-label text-botanical-700 dark:text-botanical-400">
            {isHindi ? "प्रमुख तकनीकी आधारस्तंभ" : "Core Technological Pillars"}
          </span>
          <h2 className="text-[30px] sm:text-[38px] font-black text-foreground tracking-tight">
            {isHindi ? (
              <>
                चिकित्सकों के लिए अभिकल्पित,<br className="hidden sm:block" /> रोगियों के लिए निर्मित
              </>
            ) : (
              <>
                Designed for Clinicians,<br className="hidden sm:block" /> Built for Patients
              </>
            )}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {bentoCards.map((card, i) => (
            <div
              key={i}
              className={`${card.span} glass-card rounded-3xl p-7 bento-hover border border-white/80 dark:border-white/06 space-y-5 flex flex-col justify-between shadow-glass-precision`}
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
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-botanical-700 via-botanical-800 to-forest p-8 sm:p-12 shadow-glass-precision">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 blur-[60px] pointer-events-none" />
          <div className="absolute bottom-0 left-[10%] w-48 h-48 rounded-full bg-botanical-400/10 blur-[60px] pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2.5 text-center md:text-left max-w-xl">
              <h3 className="text-[24px] sm:text-[30px] font-black text-white leading-tight">
                {isHindi
                  ? "आधुनिक आयुष नैदानिक बुद्धिमत्ता का अनुभव करने के लिए तैयार हैं?"
                  : "Ready to experience modern Ayush clinical intelligence?"}
              </h3>
              <p className="text-[14px] text-botanical-100 font-medium leading-relaxed">
                {isHindi
                  ? "वॉयस-निर्देशित केस-टेकिंग के लिए रोगी के रूप में शुरू करें, या चिकित्सक के रूप में लॉग इन करें।"
                  : "Start as a patient for voice-guided intake, or access the clinical queue as an authenticated physician."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href={`/${locale}/patient`}
                className="inline-flex items-center gap-2 h-12 px-6 rounded-2xl bg-white text-botanical-800 text-[14px] font-extrabold shadow-md hover:shadow-glass-precision transition-all hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <Activity className="h-4 w-4 text-botanical-700" />
                {isHindi ? "केस परामर्श शुरू करें" : "Start Case Intake"}
              </Link>
              <Link
                href={`/${locale}/login`}
                className="inline-flex items-center gap-2 h-12 px-6 rounded-2xl bg-white/10 border border-white/20 text-white text-[14px] font-extrabold hover:bg-white/20 transition-all active:scale-[0.98]"
              >
                {isHindi ? "पोर्टल लॉगिन" : "Portal Login"}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
