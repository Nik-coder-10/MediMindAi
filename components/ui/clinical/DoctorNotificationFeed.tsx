"use client";

import React, { useState, useEffect } from "react";
import { Bell, AlertTriangle, CheckCircle2, ShieldAlert, Volume2, VolumeX, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ClinicalNotification } from "@/app/api/doctor/notifications/route";

export function DoctorNotificationFeed() {
  const [notifications, setNotifications] = useState<ClinicalNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const unreadCount = notifications.filter((n) => !n.acknowledged).length;

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch("/api/doctor/notifications");
        const json = await res.json();
        if (json.data?.notifications) {
          setNotifications(json.data.notifications);
        }
      } catch {
        // Fallback
      }
    }

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 8000);
    return () => clearInterval(interval);
  }, []);

  const acknowledge = async (id: string) => {
    try {
      await fetch("/api/doctor/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, acknowledged: true } : n))
      );
    } catch {
      // Fallback
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-2xl bg-card border hover:bg-muted/50 transition-colors flex items-center gap-2 text-xs font-bold"
        aria-label="Clinical Notifications"
      >
        <Bell className="h-4 w-4 text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-rose-600 text-white font-extrabold text-2xs animate-pulse">
            {unreadCount}
          </span>
        )}
        <span className="hidden sm:inline">सूचनाएं ({unreadCount})</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-card border-2 border-input rounded-3xl shadow-2xl z-50 p-4 space-y-3"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="text-xs font-extrabold uppercase text-foreground">
                क्लिनिकल अलर्ट व शिफ्ट सूचनाएं
              </h4>
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="text-muted-foreground hover:text-foreground text-xs flex items-center gap-1"
              >
                {soundEnabled ? <Volume2 className="h-3.5 w-3.5 text-emerald-600" /> : <VolumeX className="h-3.5 w-3.5" />}
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-4 text-xs text-muted-foreground">कोई नई सूचना नहीं है</div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-2xl border text-xs space-y-1.5 transition-all ${
                      n.urgency === "EMERGENCY"
                        ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900"
                        : "bg-muted/40 border-input"
                    } ${n.acknowledged ? "opacity-60" : "font-semibold"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-foreground">{n.title}</span>
                      <span className="text-2xs text-muted-foreground font-mono">{n.timestamp}</span>
                    </div>
                    <p className="text-2xs text-muted-foreground">{n.message}</p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="font-mono text-2xs font-bold text-foreground">{n.token}</span>
                      {!n.acknowledged ? (
                        <button
                          type="button"
                          onClick={() => acknowledge(n.id)}
                          className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white text-2xs font-extrabold hover:bg-emerald-700 transition-colors inline-flex items-center gap-1"
                        >
                          <Check className="h-3 w-3" /> देखा (Acknowledge)
                        </button>
                      ) : (
                        <span className="text-2xs text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> देखा गया (Seen)
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
