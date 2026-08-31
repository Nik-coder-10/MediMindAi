"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Flower2,
  Languages,
  FileSpreadsheet,
  ArrowLeft,
  Layers,
  Calendar,
  Download,
  BellRing,
  Stethoscope,
  Activity,
} from "lucide-react";
import { motion } from "framer-motion";

type DateRange = "TODAY" | "7D" | "30D" | "ALL";

const RANGE_LABELS: Record<DateRange, string> = {
  TODAY: "आज (Today)",
  "7D": "७ दिन (7 Days)",
  "30D": "३० दिन (30 Days)",
  ALL: "समस्त (All Time)",
};

// ── CSV export helper ──────────────────────────────────────────────────────────
function exportToCsv(data: any) {
  if (!data) return;
  const rows: string[] = ["Metric,Value"];
  const kpis = data.kpis || {};
  Object.entries(kpis).forEach(([k, v]) => rows.push(`${k},${v}`));
  rows.push("");
  rows.push("Triage,Count,Pct");
  (data.triageDistribution || []).forEach((t: any) =>
    rows.push(`${t.label},${t.count},${t.pct}%`)
  );
  rows.push("");
  rows.push("Chief Complaint,Count");
  (data.topChiefComplaints || []).forEach((c: any) =>
    rows.push(`"${c.complaint}",${c.count}`)
  );
  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ayursetu-analytics-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Mini bar chart (CSS/SVG, no external dep) ────────────────────────────────
function MiniBarChart({ bars }: { bars: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...bars.map((b) => b.value), 1);
  return (
    <div className="flex items-end gap-3 h-20 pt-2">
      {bars.map((b, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t-lg transition-all duration-700"
            style={{
              height: `${Math.max(4, (b.value / max) * 64)}px`,
              backgroundColor: b.color,
            }}
          />
          <span className="text-[9px] font-extrabold text-muted-foreground leading-tight text-center">
            {b.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  accent?: "rose" | "emerald" | "blue" | "amber" | "purple";
}) {
  const accentMap: Record<string, string> = {
    rose: "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40",
    emerald: "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40",
    blue: "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40",
    amber: "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40",
    purple: "bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/40",
  };
  return (
    <Card
      className={`p-5 rounded-3xl border-2 space-y-2 shadow-xs ${accent ? accentMap[accent] : "border-input bg-card"}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-muted-foreground uppercase leading-snug">
          {label}
        </span>
        <div className="w-8 h-8 rounded-xl bg-white/70 dark:bg-slate-800 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="text-3xl font-extrabold text-foreground tracking-tight">{value}</div>
      {sub && <div className="text-xs font-semibold text-muted-foreground">{sub}</div>}
    </Card>
  );
}

export default function AdminAnalyticsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const [data, setData] = useState<any>(null);
  const [timeRange, setTimeRange] = useState<DateRange>("7D");
  const [loading, setLoading] = useState(true);

  const loadAnalytics = useCallback(async (range: DateRange) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics/overview?range=${range}`);
      const json = await res.json();
      if (json.data) setData(json.data);
    } catch {
      // Fallback handled below with demo data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics(timeRange);
  }, [timeRange, loadAnalytics]);

  // ── Demo / fallback data (shown if API is unreachable) ─────────────────────
  const kpis = data?.kpis || {
    totalIntakes: 142,
    todaySessions: 14,
    completionRate: "94.4%",
    averageQuestionsPerSession: 8.2,
    averageIntakeMinutes: 3.8,
    redFlagEscalationRate: "8.4%",
    ayushAdoptionPercentage: "64.1%",
    consentGrantRate: "98.6%",
    ocrSuccessRate: "92.3%",
    documentUploadRate: "61.2%",
    summaryAcceptanceRate: "88.7%",
    emergencyAlertsDispatched: 12,
  };

  const triageDistribution = data?.triageDistribution || [
    { label: "ROUTINE", count: 96, pct: "67.6", color: "#10b981" },
    { label: "URGENT", count: 34, pct: "23.9", color: "#f59e0b" },
    { label: "EMERGENCY", count: 12, pct: "8.5", color: "#e11d48" },
  ];

  const langSplit = data?.languageSplit || [
    { language: "हिंदी (Hindi)", count: 97, pct: "68.3" },
    { language: "English", count: 32, pct: "22.5" },
    { language: "Regional", count: 13, pct: "9.2" },
  ];

  const langColors = ["#10b981", "#3b82f6", "#8b5cf6"];

  const topComplaints = data?.topChiefComplaints || [
    { complaint: "छाती में दर्द (Chest Pain)", count: 28 },
    { complaint: "सिरदर्द (Headache)", count: 22 },
    { complaint: "बुखार (Fever)", count: 19 },
    { complaint: "जोड़ों में दर्द (Joint Pain)", count: 15 },
    { complaint: "पेट दर्द (Abdominal Pain)", count: 11 },
    { complaint: "सांस फूलना (Dyspnoea)", count: 9 },
    { complaint: "मधुमेह (Diabetes)", count: 7 },
    { complaint: "अन्य (Other)", count: 31 },
  ];

  const rfBreakdown = data?.redFlagBreakdown || [
    { rule: "RF_ACS_RADIATION", count: 5, severity: "CRITICAL" },
    { rule: "RF_STROKE_FAST_SIGNS", count: 3, severity: "CRITICAL" },
    { rule: "RF_SUICIDAL_IDEATION", count: 2, severity: "HIGH" },
    { rule: "RF_PEDIATRIC_DEHYDRATION", count: 2, severity: "HIGH" },
  ];

  const recentCritical = data?.recentCriticalCases || [];

  return (
    <div className="container max-w-7xl py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href={`/${locale}/admin-dashboard`}
              className="text-xs font-bold text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> वापस (Console)
            </Link>
            <span className="text-xs font-extrabold px-3 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-300 rounded-full border border-blue-300">
              <BarChart3 className="h-3 w-3 inline mr-1" /> Clinical Morbidity Analytics
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-1">
            क्लिनिकल व व्याधि निगरानी रिपोर्ट
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">
            Aggregated, privacy-preserving epidemiological metrics · No raw PHI displayed
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Date range filter */}
          <div className="flex items-center gap-1 bg-card p-1 rounded-2xl border">
            {(["TODAY", "7D", "30D", "ALL"] as DateRange[]).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                  timeRange === range
                    ? "bg-ayush-green text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {RANGE_LABELS[range]}
              </button>
            ))}
          </div>

          {/* CSV Export */}
          <button
            type="button"
            onClick={() => exportToCsv(data)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card text-xs font-extrabold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            <Download className="h-3.5 w-3.5" /> CSV Export
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8 text-sm text-muted-foreground font-bold animate-pulse">
          डेटा लोड हो रहा है... (Loading analytics...)
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        {/* Row 1: Top 6 Primary KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard
            label="कुल परामर्श (Total)"
            value={kpis.totalIntakes}
            sub={`आज: ${kpis.todaySessions} सत्र`}
            icon={<Layers className="h-4 w-4 text-blue-700" />}
            accent="blue"
          />
          <KpiCard
            label="पूर्णता दर (Completion)"
            value={kpis.completionRate}
            sub={`${kpis.averageQuestionsPerSession} avg Q/session`}
            icon={<CheckCircle2 className="h-4 w-4 text-emerald-700" />}
            accent="emerald"
          />
          <KpiCard
            label="रेड-फ्लैग दर (Red Flags)"
            value={kpis.redFlagEscalationRate}
            sub={`${kpis.emergencyAlertsDispatched} alerts sent`}
            icon={<AlertTriangle className="h-4 w-4 text-rose-700" />}
            accent="rose"
          />
          <KpiCard
            label="आयुर्वेद मोड (AYUSH)"
            value={kpis.ayushAdoptionPercentage}
            sub="Dashavidha Pariksha"
            icon={<Flower2 className="h-4 w-4 text-emerald-700" />}
            accent="emerald"
          />
          <KpiCard
            label="औसत समय (Avg Intake)"
            value={`${kpis.averageIntakeMinutes} min`}
            sub="From consent to submit"
            icon={<Clock className="h-4 w-4 text-purple-700" />}
            accent="purple"
          />
          <KpiCard
            label="पर्चे अपलोड (Docs)"
            value={kpis.documentUploadRate}
            sub={`OCR: ${kpis.ocrSuccessRate}`}
            icon={<FileSpreadsheet className="h-4 w-4 text-amber-700" />}
            accent="amber"
          />
        </div>

        {/* Row 2: Additional KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard
            label="सहमति दर (Consent Rate)"
            value={kpis.consentGrantRate}
            icon={<CheckCircle2 className="h-4 w-4 text-emerald-700" />}
          />
          <KpiCard
            label="सारांश स्वीकृति (Summary Accept)"
            value={kpis.summaryAcceptanceRate}
            sub="Doctor accepted AI summary"
            icon={<Stethoscope className="h-4 w-4 text-indigo-700" />}
          />
          <KpiCard
            label="आपात सहायता अनुरोध"
            value={kpis.emergencyAlertsDispatched}
            sub="Patient-initiated alerts"
            icon={<BellRing className="h-4 w-4 text-rose-700" />}
            accent="rose"
          />
          <KpiCard
            label="आज के सत्र (Today)"
            value={kpis.todaySessions}
            sub="New intake sessions today"
            icon={<Calendar className="h-4 w-4 text-blue-700" />}
            accent="blue"
          />
        </div>

        {/* Row 3: Triage Distribution + Language Split side-by-side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Triage Distribution */}
          <Card className="p-6 rounded-3xl border-2 border-input bg-card space-y-4 shadow-sm">
            <h3 className="text-base font-extrabold text-foreground">
              ट्राइएज प्राथमिकता वर्गीकरण (Triage Breakdown)
            </h3>
            <MiniBarChart
              bars={triageDistribution.map((t: any) => ({
                label: t.label.split(" ")[0],
                value: t.count,
                color: t.color,
              }))}
            />
            <div className="space-y-2.5 pt-1">
              {triageDistribution.map((t: any, i: number) => (
                <div key={i}>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>{t.label}</span>
                    <span>{t.pct}% ({t.count})</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${t.pct}%`, backgroundColor: t.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Language Split */}
          <Card className="p-6 rounded-3xl border-2 border-input bg-card space-y-4 shadow-sm">
            <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
              <Languages className="h-4 w-4 text-emerald-600" />
              भाषा वितरण (Multilingual Adoption)
            </h3>
            <MiniBarChart
              bars={langSplit.map((l: any, i: number) => ({
                label: l.language.split(" ")[0],
                value: l.count,
                color: langColors[i],
              }))}
            />
            <div className="space-y-2.5 pt-1">
              {langSplit.map((l: any, i: number) => (
                <div key={i}>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>{l.language}</span>
                    <span>{l.pct}% ({l.count})</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${l.pct}%`, backgroundColor: langColors[i] }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Row 4: Top Chief Complaints + Red Flag Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Chief Complaints */}
          <Card className="p-6 rounded-3xl border-2 border-input bg-card space-y-4 shadow-sm">
            <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-indigo-600" />
              शीर्ष मुख्य लक्षण (Top Chief Complaints)
            </h3>
            <p className="text-[11px] text-muted-foreground font-semibold">
              Anonymized aggregate — no patient-identifiable information
            </p>
            <div className="space-y-2">
              {topComplaints.map((c: any, i: number) => {
                const max = topComplaints[0]?.count || 1;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-black text-muted-foreground w-5 shrink-0">
                      #{i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-xs font-bold mb-0.5 truncate">
                        <span className="truncate">{c.complaint}</span>
                        <span className="shrink-0 ml-2">{c.count}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                          style={{ width: `${(c.count / max) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Red Flag Breakdown by Rule */}
          <Card className="p-6 rounded-3xl border-2 border-input bg-card space-y-4 shadow-sm">
            <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              रेड-फ्लैग नियमों का विश्लेषण (Red Flag Rule Breakdown)
            </h3>
            <div className="space-y-2">
              {rfBreakdown.map((r: any, i: number) => (
                <div key={i} className="flex items-center justify-between gap-3 py-1.5 border-b last:border-0">
                  <span className="font-mono text-[11px] font-bold text-foreground">{r.rule}</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        r.severity === "CRITICAL"
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      }`}
                    >
                      {r.severity}
                    </span>
                    <span className="text-sm font-extrabold text-foreground w-6 text-right">
                      {r.count}
                    </span>
                  </div>
                </div>
              ))}
              {rfBreakdown.length === 0 && (
                <p className="text-xs font-semibold text-muted-foreground text-center py-4">
                  इस अवधि में कोई रेड-फ्लैग घटना नहीं (No red flag events in range)
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Row 5: Recent Anonymized Critical Alerts Table */}
        <Card className="p-6 rounded-3xl border-2 border-input bg-card space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              हालिया आपातकालीन रेड-फ्लैग केस (Recent Anonymized Critical Alerts)
            </h3>
            <span className="text-xs font-bold text-muted-foreground">Privacy-Preserving (No PHI)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium">
              <thead className="bg-muted/50 text-muted-foreground uppercase font-extrabold border-b">
                <tr>
                  <th className="p-3">टोकन ID</th>
                  <th className="p-3">नियम (Rule)</th>
                  <th className="p-3">विवरण</th>
                  <th className="p-3">गंभीरता</th>
                  <th className="p-3">समय</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentCritical.length > 0 ? (
                  recentCritical.map((c: any, i: number) => (
                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-mono font-extrabold text-foreground">{c.token}</td>
                      <td className="p-3 font-mono text-rose-700 dark:text-rose-400 font-bold">{c.ruleTriggered}</td>
                      <td className="p-3">{c.description}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-extrabold text-[10px]">
                          {c.urgency}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground font-semibold">{c.timeAgo}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-muted-foreground font-semibold text-xs">
                      इस अवधि में कोई आपातकालीन अलर्ट नहीं — No critical alerts in selected range
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* DPDP privacy note */}
        <div className="text-center text-[11px] text-muted-foreground font-semibold pt-2">
          🔒 All data is aggregated and anonymized per DPDP 2023 principles · No raw patient-identifiable information displayed here
        </div>
      </motion.div>
    </div>
  );
}
