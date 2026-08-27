"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ShieldCheck, ArrowLeft, Lock, FileText, RefreshCw, Filter } from "lucide-react";

export default function AdminAuditLogPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadLogs() {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/audit");
        const json = await res.json();
        if (json.data?.logs) {
          setLogs(json.data.logs);
        }
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

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
            <span className="text-xs font-extrabold px-3 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 rounded-full border border-emerald-300">
              <ShieldCheck className="h-3 w-3 inline mr-1" /> DPDP 2023 Audit Trail
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-1">
            सिस्टम सुरक्षा व ऑडिट लॉग्स (System Audit & Event Logs)
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">
            Tamper-evident, timestamped record of consents, summary sign-offs, and FHIR exports.
          </p>
        </div>
      </div>

      {/* Audit Log Table */}
      <Card className="p-6 rounded-3xl border-2 border-input bg-card shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
            <Lock className="h-4 w-4 text-emerald-600" />
            <span>इवेंट ऑडिट ट्रेल (Immutable Audit Trail)</span>
          </h3>
          <span className="text-xs font-bold text-muted-foreground">Showing latest events</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium">
            <thead className="bg-muted/50 text-muted-foreground uppercase font-extrabold border-b">
              <tr>
                <th className="p-3">इवेंट ID</th>
                <th className="p-3">कार्रवाई (Action)</th>
                <th className="p-3">उपयोगकर्ता / भूमिका</th>
                <th className="p-3">संसाधन (Resource)</th>
                <th className="p-3">विवरण (Details)</th>
                <th className="p-3">IP पता</th>
                <th className="p-3">समय (Timestamp)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.map((log: any, i: number) => (
                <tr key={i} className="hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-mono font-bold text-foreground">{log.id}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full font-extrabold text-2xs ${
                        log.action.includes("REVOKE")
                          ? "bg-rose-100 text-rose-800"
                          : log.action.includes("ACCEPTED") || log.action.includes("GRANTED")
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 font-semibold">{log.userId}</td>
                  <td className="p-3 font-mono">{log.resource}</td>
                  <td className="p-3 text-muted-foreground">{JSON.stringify(log.details || {})}</td>
                  <td className="p-3 font-mono text-2xs">{log.ipAddress || "127.0.0.1"}</td>
                  <td className="p-3 text-muted-foreground font-semibold">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
