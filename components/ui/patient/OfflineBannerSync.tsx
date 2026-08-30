"use client";

import React, { useState, useEffect } from "react";
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { SessionRecoveryStore } from "@/lib/offline/session-recovery.store";

export function OfflineBannerSync() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [justSynced, setJustSynced] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);

    const updateOnlineStatus = async () => {
      const online = navigator.onLine;
      setIsOnline(online);

      if (online) {
        // Attempt automatic background synchronization
        setIsSyncing(true);
        const { synced, remaining } = await SessionRecoveryStore.syncOfflineActions();
        setIsSyncing(false);
        setPendingCount(remaining);
        if (synced > 0) {
          setJustSynced(true);
          setTimeout(() => setJustSynced(false), 4000);
        }
      }
    };

    const updatePendingCount = async () => {
      const actions = await SessionRecoveryStore.getAllQueuedActions();
      setPendingCount(actions.length);
    };

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    updatePendingCount();
    const interval = setInterval(updatePendingCount, 5000);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
      clearInterval(interval);
    };
  }, []);

  if (isOnline && pendingCount === 0 && !justSynced) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 p-4 rounded-2xl border-2 shadow-xl backdrop-blur-md transition-all duration-300 ${
        !isOnline
          ? "bg-amber-500/95 text-slate-950 border-amber-600 dark:bg-amber-900/90 dark:text-amber-100"
          : justSynced
          ? "bg-emerald-600 text-white border-emerald-700"
          : "bg-slate-900 text-white border-slate-700"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-black/15 shrink-0">
          {!isOnline ? (
            <WifiOff className="h-5 w-5 animate-pulse text-amber-950 dark:text-amber-200" />
          ) : justSynced ? (
            <CheckCircle2 className="h-5 w-5 text-white" />
          ) : (
            <Wifi className="h-5 w-5 text-emerald-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-black uppercase tracking-wider">
            {!isOnline
              ? "ऑफ़लाइन मोड (Offline Mode)"
              : justSynced
              ? "डेटा सिंक सफल (Data Synced)"
              : "सिंक स्थिति (Sync Status)"}
          </p>
          <p className="text-[11px] font-semibold opacity-95">
            {!isOnline
              ? pendingCount > 0
                ? `${pendingCount} उत्तर सुरक्षित सहेजे गए हैं। नेटवर्क आने पर सिंक होगा।`
                : "आप ऑफ़लाइन हैं। आपके उत्तर डिवाइस में सुरक्षित रहेंगे।"
              : justSynced
              ? "सभी ऑफ़लाइन उत्तर सर्वर पर सुरक्षित भेज दिए गए हैं।"
              : `${pendingCount} उत्तर सिंक होने की प्रतीक्षा में...`}
          </p>
        </div>

        {isOnline && pendingCount > 0 && (
          <button
            type="button"
            onClick={async () => {
              setIsSyncing(true);
              const { synced, remaining } = await SessionRecoveryStore.syncOfflineActions();
              setIsSyncing(false);
              setPendingCount(remaining);
              if (synced > 0) {
                setJustSynced(true);
                setTimeout(() => setJustSynced(false), 3000);
              }
            }}
            disabled={isSyncing}
            className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            <span>सिंक</span>
          </button>
        )}
      </div>
    </div>
  );
}
