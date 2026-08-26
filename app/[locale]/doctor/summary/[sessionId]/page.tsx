"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ExtraLargeButton } from "@/components/ui/patient/ExtraLargeButton";
import {
  FileText,
  CheckCircle2,
  XCircle,
  Edit3,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Eye,
  Loader2,
  Stethoscope,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DoctorSummaryReviewPage({
  params,
}: {
  params: { locale: string; sessionId?: string };
}) {
  const sessionId = params.sessionId || "sess-demo-001";
  const [summaryData, setSummaryData] = useState<any>(null);
  const [editedMarkdown, setEditedMarkdown] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadSummary() {
      setLoading(true);
      try {
        const res = await fetch(`/api/doctor/summary/${sessionId}`);
        const data = await res.json();
        if (data.data?.aiGeneratedMarkdown) {
          setSummaryData(data.data);
          setEditedMarkdown(data.data.doctorEditedMarkdown || data.data.aiGeneratedMarkdown);
        } else {
          // Trigger automatic generation if not found
          const genRes = await fetch(`/api/doctor/summary/generate/${sessionId}`, { method: "POST" });
          const genData = await genRes.json();
          setSummaryData(genData.data);
          setEditedMarkdown(genData.data.aiGeneratedMarkdown);
        }
      } catch {
        // Mock fallback
      } finally {
        setLoading(false);
      }
    }
    loadSummary();
  }, [sessionId]);

  const handleAccept = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/doctor/summary/${sessionId}/accept`, { method: "POST" });
      const data = await res.json();
      setSummaryData(data.data);
      setActionSuccess("क्लिनिकल सारांश स्वीकृत व हस्ताक्षरित (Summary Signed Off)");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/doctor/summary/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorEditedMarkdown: editedMarkdown,
          status: "REVISED",
        }),
      });
      const data = await res.json();
      setSummaryData(data.data);
      setIsEditing(false);
      setActionSuccess("चिकित्सक संशोधन सहेजे गए (Physician Edits Saved)");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/doctor/summary/${sessionId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Incomplete clinical details reported." }),
      });
      const data = await res.json();
      setSummaryData(data.data);
      setActionSuccess("सारांश अस्वीकृत (Summary Rejected for Re-evaluation)");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <span className="text-xs font-extrabold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full inline-flex items-center gap-1.5">
            <Stethoscope className="h-3.5 w-3.5" /> वैद्य / डॉक्टर समीक्षा डेस्क (Clinical Review)
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-1">
            क्लिनिकल सारांश सत्यापन (Physician Intake Summary)
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">
            Review AI-synthesized intake notes, edit clinical observations, and sign off for EMR export.
          </p>
        </div>

        {/* Status Badge */}
        {summaryData && (
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
                summaryData.status === "ACCEPTED"
                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                  : summaryData.status === "REJECTED"
                  ? "bg-rose-100 text-rose-800 border-rose-300"
                  : "bg-amber-100 text-amber-800 border-amber-300"
              }`}
            >
              स्थिति: {summaryData.status} (v{summaryData.version})
            </span>
          </div>
        )}
      </div>

      {/* Success Notification Banner */}
      <AnimatePresence>
        {actionSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 rounded-2xl bg-emerald-100 border-2 border-emerald-400 text-emerald-900 font-extrabold text-sm flex items-center justify-between"
          >
            <span>{actionSuccess}</span>
            <button
              onClick={() => setActionSuccess(null)}
              className="text-xs underline hover:no-underline"
            >
              बंद करें
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Body: Dual Mode (Markdown Display vs Live Editor) */}
      <Card className="border-3 border-emerald-200 shadow-xl rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-600" />
            <span className="font-extrabold text-base text-foreground">
              {isEditing ? "संशोधन मोड (Editing Mode)" : "सारांश पूर्वावलोकन (Summary View)"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="text-xs font-bold text-emerald-800 hover:text-emerald-950 inline-flex items-center gap-1 min-h-[40px] px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50"
          >
            {isEditing ? <Eye className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
            <span>{isEditing ? "पूर्वावलोकन देखें (Preview)" : "संशोधित करें (Edit Note)"}</span>
          </button>
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <textarea
              rows={18}
              value={editedMarkdown}
              onChange={(e) => setEditedMarkdown(e.target.value)}
              className="w-full p-4 font-mono text-sm rounded-2xl border-2 border-input focus:border-ayush-green bg-slate-50 dark:bg-slate-900"
            />
            <div className="flex justify-end gap-3">
              <ExtraLargeButton variant="secondary" size="default" onClick={() => setIsEditing(false)}>
                रद्द करें (Cancel)
              </ExtraLargeButton>
              <ExtraLargeButton variant="primary" size="default" onClick={handleSaveEdit}>
                सहेजें (Save Changes)
              </ExtraLargeButton>
            </div>
          </div>
        ) : (
          <div className="prose dark:prose-invert max-w-none text-foreground text-sm sm:text-base leading-relaxed bg-slate-50/50 dark:bg-slate-900/50 p-6 rounded-2xl border">
            <pre className="whitespace-pre-wrap font-sans text-sm">{editedMarkdown || summaryData?.aiGeneratedMarkdown}</pre>
          </div>
        )}

        {/* Doctor Decision Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t">
          <button
            type="button"
            onClick={handleReject}
            disabled={loading}
            className="min-h-[56px] px-6 rounded-2xl border-2 border-rose-300 text-rose-700 hover:bg-rose-50 font-extrabold text-sm inline-flex items-center gap-2"
          >
            <XCircle className="h-5 w-5" />
            <span>अस्वीकार करें (Reject)</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="min-h-[56px] px-6 rounded-2xl border-2 border-input text-foreground font-bold text-sm inline-flex items-center gap-2 hover:bg-muted"
            >
              <Edit3 className="h-5 w-5" />
              <span>संशोधन (Edit)</span>
            </button>

            <ExtraLargeButton
              variant="primary"
              size="large"
              icon={<ShieldCheck className="h-6 w-6" />}
              onClick={handleAccept}
              disabled={loading}
            >
              स्वीकृत व हस्ताक्षर करें (Accept & Sign)
            </ExtraLargeButton>
          </div>
        </div>
      </Card>
    </div>
  );
}
