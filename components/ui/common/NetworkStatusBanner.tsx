"use client";

import React, { useState, useEffect } from "react";
import { WifiOff, Wifi, AlertCircle, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function NetworkStatusBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsOnline(false);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-amber-600 text-white px-4 py-2.5 text-xs sm:text-sm font-bold flex items-center justify-between shadow-md z-50 sticky top-0"
          role="status"
          aria-live="assertive"
        >
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <WifiOff className="h-4 w-4 flex-shrink-0 animate-pulse" />
            <span>
              नेटवर्क कनेक्शन धीमा या बंद है। आपका डेटा डिवाइस पर सुरक्षित है। (Offline / Poor Connection - Data Saved Locally)
            </span>
          </div>
        </motion.div>
      )}

      {showReconnected && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 shadow-md z-50 sticky top-0"
          role="status"
          aria-live="polite"
        >
          <Wifi className="h-4 w-4" />
          <span>इंटरनेट कनेक्शन पुनः स्थापित (Online Reconnected • Syncing changes)</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
