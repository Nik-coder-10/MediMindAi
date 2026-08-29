"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import {
  Stethoscope,

  AlertTriangle,
  Clock,
  User,
  ShieldAlert,
  ArrowRight,
  Filter,
  Search,
  CheckCircle2,
  Flower2,
  RefreshCw,
  LogIn,
  Lock,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/use-auth-store";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function DoctorDashboardQueuePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const router = useRouter();
  const { isAuthenticated, user, loginAsDoctor } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [queue, setQueue] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDoctor = isAuthenticated && (user?.role === "DOCTOR" || user?.role === "ADMIN");

  const fetchQueue = React.useCallback(async () => {
    setLoading(true);
    try {
      const activeDoctorId = user?.id || "doc-8842-demo";
      const res = await fetch("/api/doctor/dashboard", {
        headers: {
          "x-user-id": activeDoctorId,
        },
      });
      const data = await res.json();
      if (data.data?.queue) {
        setQueue(data.data.queue);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (mounted && isDoctor) {
      fetchQueue();
    }
  }, [mounted, isDoctor, fetchQueue]);

  if (!mounted) {
    return <div className="min-h-[80vh] flex items-center justify-center p-4" />;
  }

  // Doctor Authentication Gate
  if (!isDoctor) {

    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 sm:p-8 rounded-3xl border-2 border-blue-400 space-y-5 text-center shadow-xl bg-card">
          <div className="w-14 h-14 bg-blue-100 dark:bg-blue-950 text-blue-700 rounded-full flex items-center justify-center mx-auto text-2xl">
            👨‍⚕️
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-black text-foreground">चिकित्सक लॉगिन आवश्यक (Doctor Login Required)</h2>
            <p className="text-xs text-muted-foreground font-semibold">
              The clinical triage queue and patient consultations are restricted to verified medical practitioners and Vaidyas.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <Button
              className="w-full font-extrabold min-h-[46px] flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white"
              onClick={() => router.push(`/${locale}/login?role=doctor`)}
            >
              <LogIn className="h-4 w-4" />
              <span>Login as Doctor / Vaidya</span>
            </Button>

            <Button
              variant="outline"
              className="w-full text-xs font-bold border-blue-300 bg-blue-50/50 dark:bg-blue-950/20"
              onClick={() => {
                loginAsDoctor({
                  name: "Dr. Arvind K. Sharma (MD, BAMS)",
                  doctorRegNumber: "AYUSH-REG-DL-2024-9842",
                  hospitalName: "All India Institute of Ayurveda (AIIA), New Delhi",
                  specialization: "Senior Vaidya & Consultant Physician",
                });
              }}
            >
              <span>⚡ Quick Demo Login (Dr. Arvind K. Sharma • AIIA)</span>
            </Button>

            <div className="pt-2 border-t text-2xs text-muted-foreground">
              <span>Looking to start a case as a patient? </span>
              <button
                type="button"
                onClick={() => router.push(`/${locale}/patient`)}
                className="text-emerald-700 font-bold underline"
              >
                Go to Patient Portal →
              </button>
            </div>
          </div>
        </Card>
      </div>
    );
  }


  const filteredQueue = queue.filter((item) => {
    if (filter === "EMERGENCY" && item.triagePriority !== "EMERGENCY") return false;
    if (filter === "URGENT" && item.triagePriority !== "URGENT") return false;
    if (searchQuery) {
      const name = `${item.patient.firstName} ${item.patient.lastName}`.toLowerCase();
      const abha = (item.patient.user?.abhaId || "").toLowerCase();
      return name.includes(searchQuery.toLowerCase()) || abha.includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "EMERGENCY":
        return "bg-rose-600 text-white animate-pulse border-rose-300";
      case "URGENT":
        return "bg-amber-500 text-white border-amber-300";
      default:
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
    }
  };

  return (
    <div className="container max-w-7xl py-8 space-y-6">
      {/* Top Header & Statistics */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <span className="text-xs font-extrabold px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-full inline-flex items-center gap-1.5 border border-emerald-300">
            <Stethoscope className="h-3.5 w-3.5" /> AIIA Kayachikitsa & Triage Desk
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-1">
            चिकित्सक परामर्श कतार (Clinical Triage Queue)
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">
            Real-time patient triage queue prioritized by clinical urgency and red-flag alerts.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchQueue}
          disabled={loading}
          className="min-h-[44px] px-4 rounded-xl border border-input bg-card hover:bg-muted font-bold text-xs inline-flex items-center gap-2 shadow-2xs"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span>ताज़ा करें (Refresh Queue)</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setFilter("ALL")}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-extrabold border transition-all ${
              filter === "ALL"
                ? "bg-ayush-green text-white border-ayush-green shadow-xs"
                : "bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            सभी रोगी (All Patients • {queue.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("EMERGENCY")}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-extrabold border transition-all ${
              filter === "EMERGENCY"
                ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            🚨 आपातकालीन (Emergency • {queue.filter((q) => q.triagePriority === "EMERGENCY").length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("URGENT")}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-extrabold border transition-all ${
              filter === "URGENT"
                ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                : "bg-amber-50 text-amber-800 border-amber-200"
            }`}
          >
            ⚡ प्राथमिकता (Urgent • {queue.filter((q) => q.triagePriority === "URGENT").length})
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="नाम या ABHA ID से खोजें..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border border-input bg-card focus:border-ayush-green"
          />
        </div>
      </div>

      {/* Patient Triage Cards Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredQueue.length === 0 && !loading && (
          <Card className="p-12 text-center rounded-3xl border-2 border-dashed border-input space-y-3 bg-muted/20">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center mx-auto text-2xl">
              ✓
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-foreground">कोई प्रतीक्षारत रोगी नहीं है (No Patients in Queue)</h3>
              <p className="text-xs text-muted-foreground font-semibold">
                All triage cases have been attended or no new consultations are currently waiting.
              </p>
            </div>
          </Card>
        )}

        {filteredQueue.map((item, idx) => {
          const isEmergency = item.triagePriority === "EMERGENCY";
          const patientName = `${item.patient.firstName} ${item.patient.lastName}`;
          const abhaId = item.patient.user?.abhaId || "ABHA-PENDING";

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Link href={`/${locale}/doctor/case/${item.id}`} className="block group">
                <Card
                  className={`p-5 rounded-2xl border-2 transition-all shadow-sm hover:shadow-md ${
                    isEmergency
                      ? "border-rose-400 bg-rose-50/40 dark:bg-rose-950/20 hover:border-rose-600"
                      : "border-input bg-card hover:border-emerald-500"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    {/* Patient Core Info */}
                    <div className="space-y-1.5 flex-1 min-w-[260px]">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${getPriorityBadge(
                            item.triagePriority
                          )}`}
                        >
                          {item.triagePriority}
                        </span>

                        <span className="text-xs font-bold text-muted-foreground">
                          ABHA: {abhaId}
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full">
                          {item.language.toUpperCase()}
                        </span>
                      </div>

                      <h3 className="text-lg font-extrabold text-foreground group-hover:text-emerald-700 transition-colors">
                        {patientName} • {item.patient.gender} ({item.patient.bloodGroup || "O+"})
                      </h3>

                      <p className="text-xs sm:text-sm font-semibold text-foreground">
                        <span className="text-muted-foreground font-medium">लक्षण (Chief Complaint): </span>
                        {item.chiefComplaints?.[0]?.symptomName || "Clinical intake in progress"}
                      </p>
                    </div>

                    {/* Red Flag & Waiting Time Badges */}
                    <div className="text-right space-y-2">
                      <span className="text-xs font-semibold text-muted-foreground flex items-center justify-end gap-1">
                        <Clock className="h-3.5 w-3.5" /> प्रतीक्षा: 15 मिनट (Waiting)
                      </span>

                      {item.redFlagEvents?.length > 0 && (
                        <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-rose-700 bg-rose-100 px-3 py-1 rounded-full border border-rose-300">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>{item.redFlagEvents[0].description}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="flex items-center justify-between pt-3 mt-3 border-t text-xs font-bold text-emerald-800 dark:text-emerald-400">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> AI क्लिनिकल सारांश तैयार (AI Summary Ready)
                    </span>
                    <span className="inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span>केस खोलें (Review Case)</span>
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
