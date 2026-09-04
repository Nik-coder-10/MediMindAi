"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import {
  Activity,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  PlusCircle,
  Stethoscope,
  ShieldCheck,
  FileText,
  Calendar,
  Search,
  Filter,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/use-auth-store";

interface PatientCaseSummary {
  id: string;
  tokenNumber: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "WAITING_FOR_DOCTOR" | "COMPLETED" | "CANCELLED";
  triagePriority: "ROUTINE" | "URGENT" | "EMERGENCY";
  startedAt: string;
  updatedAt: string;
  completedAt: string | null;
  chiefComplaint: string;
  redFlagCount: number;
  hasSummary: boolean;
  summaryStatus: string | null;
  doctorName: string | null;
}

export default function PatientCasesDashboardPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [cases, setCases] = useState<PatientCaseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const isHindi = locale === "hi" || locale === "raj";
  const isRaj = locale === "raj";

  const fetchCases = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const activeUserId =
        user?.id ||
        (typeof window !== "undefined" ? localStorage.getItem("ayursetu_user_id") || sessionStorage.getItem("ayursetu_user_id") : null) ||
        "pat-104-demo";
      const res = await fetch("/api/patient/cases", {
        headers: {
          "x-user-id": activeUserId,
        },
      });
      const data = await res.json();
      if (res.ok && data.data?.cases) {
        setCases(data.data.cases);
      } else {
        setError(data.error?.message || "Failed to load patient cases.");
      }
    } catch (err: any) {
      setError("Network or server error while loading your consultation cases.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "WAITING_FOR_DOCTOR":
        return {
          labelHi: "कतार में (Waiting for Doctor)",
          labelEn: "Waiting for Doctor",
          classes: "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300",
        };
      case "COMPLETED":
        return {
          labelHi: "डॉक्टर द्वारा हस्ताक्षरित (Completed / Reviewed)",
          labelEn: "Reviewed by Physician",
          classes: "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300",
        };
      case "IN_PROGRESS":
        return {
          labelHi: "परामर्श जारी (In Progress)",
          labelEn: "In Progress",
          classes: "bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-950/40 dark:text-indigo-300",
        };
      default:
        return {
          labelHi: status,
          labelEn: status,
          classes: "bg-slate-100 text-slate-800 border-slate-300",
        };
    }
  };

  const filteredCases = cases.filter((c) => {
    if (filter === "WAITING" && c.status !== "WAITING_FOR_DOCTOR") return false;
    if (filter === "COMPLETED" && c.status !== "COMPLETED") return false;
    if (filter === "IN_PROGRESS" && c.status !== "IN_PROGRESS") return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const complaintMatch = (c.chiefComplaint || "").toLowerCase().includes(query);
      const tokenMatch = (c.tokenNumber || "").toLowerCase().includes(query);
      return complaintMatch || tokenMatch;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <span className="text-[11px] font-extrabold px-3 py-1 bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 rounded-full inline-flex items-center gap-1.5 border border-indigo-200">
            <Activity className="h-3.5 w-3.5" />
            {isHindi ? "डिजिटल स्वास्थ्य रिकॉर्ड (ABDM)" : "Digital Health Records (ABDM)"}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground mt-1">
            {isHindi ? "मेरे परामर्श व केस रिकॉर्ड" : "My Clinical Consultations"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">
            {isHindi
              ? "आपके सभी पिछले व सक्रिय परामर्श, पर्चियां और डॉक्टर समीक्षा रिपोर्ट।"
              : "All your active and historical clinical case files, tokens, and physician review summaries."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchCases}
            disabled={loading}
            className="min-h-[42px] px-3.5 rounded-xl border border-border bg-card hover:bg-muted font-bold text-xs inline-flex items-center gap-1.5 shadow-2xs transition-all"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>{isHindi ? "ताज़ा करें" : "Refresh"}</span>
          </button>

          <Link
            href={`/${locale}/patient`}
            className="min-h-[42px] px-4 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
          >
            <PlusCircle className="h-4 w-4" />
            <span>{isHindi ? "नया परामर्श शुरू करें" : "Start New Case"}</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setFilter("ALL")}
            className={`min-h-[38px] px-3.5 py-1 rounded-full text-xs font-bold border transition-all ${
              filter === "ALL"
                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                : "bg-card text-muted-foreground hover:text-foreground border-border"
            }`}
          >
            {isHindi ? "सभी केस" : "All Cases"} ({cases.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("WAITING")}
            className={`min-h-[38px] px-3.5 py-1 rounded-full text-xs font-bold border transition-all ${
              filter === "WAITING"
                ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                : "bg-card text-muted-foreground hover:text-foreground border-border"
            }`}
          >
            {isHindi ? "प्रतीक्षारत" : "Waiting for Doctor"} (
            {cases.filter((c) => c.status === "WAITING_FOR_DOCTOR").length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("COMPLETED")}
            className={`min-h-[38px] px-3.5 py-1 rounded-full text-xs font-bold border transition-all ${
              filter === "COMPLETED"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                : "bg-card text-muted-foreground hover:text-foreground border-border"
            }`}
          >
            {isHindi ? "पूर्ण" : "Completed"} ({cases.filter((c) => c.status === "COMPLETED").length})
          </button>
        </div>

        <div className="relative min-w-[200px] flex-1 sm:flex-initial">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder={isHindi ? "लक्षण या टोकन से खोजें..." : "Search by complaint or token..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs font-semibold rounded-xl border border-input bg-card focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <Card key={n} className="p-5 rounded-2xl border-2 animate-pulse space-y-3 bg-muted/40">
              <div className="flex justify-between items-center">
                <div className="h-5 bg-muted rounded w-24" />
                <div className="h-5 bg-muted rounded w-32" />
              </div>
              <div className="h-6 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <Card className="p-8 text-center rounded-3xl border-2 border-rose-300 bg-rose-50/40 dark:bg-rose-950/20 space-y-3">
          <AlertTriangle className="h-10 w-10 text-rose-600 mx-auto" />
          <h3 className="text-base font-extrabold text-rose-950 dark:text-rose-200">
            {isHindi ? "केस लोड करने में त्रुटि" : "Error Loading Consultations"}
          </h3>
          <p className="text-xs text-rose-800 dark:text-rose-300 font-medium">{error}</p>
          <button
            type="button"
            onClick={fetchCases}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>{isHindi ? "पुनः प्रयास करें" : "Retry"}</span>
          </button>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && filteredCases.length === 0 && (
        <Card className="p-12 text-center rounded-3xl border-2 border-dashed border-border bg-card/60 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center mx-auto">
            <FileText className="h-8 w-8" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-lg font-black text-foreground">
              {isHindi ? "कोई परामर्श रिकॉर्ड नहीं मिला" : "No Cases Found"}
            </h3>
            <p className="text-xs text-muted-foreground font-medium">
              {isHindi
                ? "आपने अभी तक कोई नैदानिक परामर्श सत्र शुरू नहीं किया है। परामर्श आरंभ करने के लिए नीचे दिए गए बटन को दबाएं।"
                : "You have not initiated any clinical consultation sessions yet. Start your adaptive case-taking below."}
            </p>
          </div>
          <Link
            href={`/${locale}/patient`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white text-xs font-bold shadow-md hover:shadow-indigo-glow transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            <span>{isHindi ? "पहला परामर्श शुरू करें" : "Start Your First Consultation"}</span>
          </Link>
        </Card>
      )}

      {/* Cases List */}
      {!loading && !error && filteredCases.length > 0 && (
        <div className="space-y-3.5">
          {filteredCases.map((item, idx) => {
            const badge = getStatusBadge(item.status);
            const formattedDate = new Date(item.startedAt).toLocaleDateString(
              locale === "hi" ? "hi-IN" : "en-IN",
              {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }
            );

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <Link href={`/${locale}/patient/cases/${item.id}`} className="block group">
                  <Card className="p-5 rounded-2xl border-2 border-border/80 bg-card hover:border-indigo-400 hover:shadow-md transition-all">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      {/* Left: Token & Complaint */}
                      <div className="space-y-2 flex-1 min-w-[240px]">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-300 font-mono">
                            {item.tokenNumber}
                          </span>

                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badge.classes}`}
                          >
                            {isHindi ? badge.labelHi : badge.labelEn}
                          </span>

                          {item.triagePriority === "EMERGENCY" && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-600 text-white animate-pulse">
                              EMERGENCY
                            </span>
                          )}
                        </div>

                        <div>
                          <h3 className="text-[16px] font-extrabold text-foreground group-hover:text-indigo-600 transition-colors">
                            {item.chiefComplaint}
                          </h3>
                          <p className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5 mt-0.5">
                            <Clock className="h-3 w-3" />
                            <span>{formattedDate}</span>
                            {item.doctorName && (
                              <>
                                <span>•</span>
                                <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                                  {item.doctorName}
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Right Action */}
                      <div className="flex items-center gap-2 shrink-0 self-center">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                          <span>{isHindi ? "केस विवरण देखें" : "View Case Details"}</span>
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
