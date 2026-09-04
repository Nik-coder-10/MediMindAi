"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Volume2,
  VolumeX,
  Check,
  ExternalLink,
  Flame,
  Sparkles,
  RefreshCw,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ClinicalNotificationItem } from "@/lib/services/notification.service";
import { useAuthStore } from "@/stores/use-auth-store";

interface DoctorNotificationFeedProps {
  locale?: string;
}

export function DoctorNotificationFeed({ locale = "hi" }: DoctorNotificationFeedProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<ClinicalNotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const previousCriticalIdsRef = useRef<Set<string>>(new Set());

  const unreadCount = notifications.filter((n) => n.status !== "ACKNOWLEDGED").length;
  const criticalCount = notifications.filter(
    (n) => n.status !== "ACKNOWLEDGED" && (n.severity === "CRITICAL" || n.severity === "HIGH")
  ).length;

  // Web Audio Synthesizer for Emergency Chime (no external MP3 asset dependency)
  const playEmergencyChime = useCallback(() => {
    if (!soundEnabled || typeof window === "undefined") return;

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;

      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        audioCtxRef.current = new AudioCtxClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // Two-tone high alert chime (880Hz -> 1174Hz)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(1174.66, now + 0.15);

      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(440, now);
      osc2.frequency.exponentialRampToValueAtTime(587.33, now + 0.15);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.3, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.5);
      osc2.stop(now + 0.5);
    } catch (e) {
      console.warn("Audio chime playback notice:", e);
    }
  }, [soundEnabled]);

  // Fetch initial / polling snapshot
  const fetchNotifications = useCallback(async () => {
    try {
      const activeDoctorId = user?.id || "doc-8842-demo";
      const res = await fetch("/api/doctor/notifications", {
        headers: { "x-user-id": activeDoctorId },
      });
      const json = await res.json();
      if (json.data?.notifications) {
        const list: ClinicalNotificationItem[] = json.data.notifications;
        setNotifications(list);

        // Detect new unacknowledged critical alerts to sound chime
        const unackCritical = list.filter(
          (n) => n.status !== "ACKNOWLEDGED" && (n.severity === "CRITICAL" || n.severity === "HIGH")
        );

        let hasNewCritical = false;
        unackCritical.forEach((n) => {
          if (!previousCriticalIdsRef.current.has(n.id)) {
            hasNewCritical = true;
            previousCriticalIdsRef.current.add(n.id);
          }
        });

        if (hasNewCritical) {
          playEmergencyChime();
        }
      }
    } catch {
      // Fallback resilience
    }
  }, [user?.id, playEmergencyChime]);

  // Real-time Delivery via SSE + Polling Fallback
  useEffect(() => {
    if (!user || (user.role !== "DOCTOR" && user.role !== "ADMIN")) {
      return;
    }

    fetchNotifications();

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/doctor/notifications/sse");

      eventSource.addEventListener("init", (event) => {
        try {
          const initData: ClinicalNotificationItem[] = JSON.parse(event.data);
          setNotifications(initData);
        } catch (e) {}
      });

      eventSource.addEventListener("notification", (event) => {
        try {
          const newNotif: ClinicalNotificationItem = JSON.parse(event.data);
          setNotifications((prev) => {
            const filtered = prev.filter((p) => p.id !== newNotif.id);
            return [newNotif, ...filtered];
          });

          if (newNotif.severity === "CRITICAL" || newNotif.severity === "HIGH") {
            playEmergencyChime();
          }
        } catch (e) {}
      });

      eventSource.onerror = () => {
        // SSE disconnected, fallback to active polling interval
        if (eventSource) {
          eventSource.close();
        }
      };
    } catch (e) {
      // Fallback
    }

    const interval = setInterval(fetchNotifications, 5000);

    return () => {
      clearInterval(interval);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [fetchNotifications, playEmergencyChime]);

  // Acknowledge Single Notification
  const acknowledge = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const activeDoctorId = user?.id || "doc-8842-demo";
      await fetch(`/api/doctor/notifications/${id}/acknowledge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": activeDoctorId,
        },
      });

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id
            ? {
                ...n,
                status: "ACKNOWLEDGED",
                acknowledgedAt: new Date().toISOString(),
                acknowledgedBy: user?.name || "Attending Vaidya",
              }
            : n
        )
      );
    } catch {
      // Fallback
    }
  };

  // Mark All Read
  const handleMarkAllRead = async () => {
    try {
      const activeDoctorId = user?.id || "doc-8842-demo";
      await fetch("/api/doctor/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": activeDoctorId,
        },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.status === "UNREAD" ? { ...n, status: "READ" } : n))
      );
    } catch (e) {}
  };

  // Open Case Dossier
  const handleOpenCase = (sessionId?: string) => {
    setIsOpen(false);
    if (sessionId) {
      router.push(`/${locale}/doctor/case/${sessionId}`);
    } else {
      router.push(`/${locale}/doctor`);
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "CRITICAL":
        return {
          label: "आपातकालीन (Critical)",
          classes: "bg-rose-600 text-white border-rose-400 animate-pulse",
          icon: <Flame className="h-3 w-3" />,
        };
      case "HIGH":
        return {
          label: "उच्च (High Priority)",
          classes: "bg-amber-500 text-white border-amber-300",
          icon: <AlertTriangle className="h-3 w-3" />,
        };
      case "MEDIUM":
        return {
          label: "मध्यम (Medium)",
          classes: "bg-blue-600 text-white border-blue-400",
          icon: <ShieldAlert className="h-3 w-3" />,
        };
      default:
        return {
          label: "सामान्य (Routine)",
          classes: "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300",
          icon: <Sparkles className="h-3 w-3" />,
        };
    }
  };

  // Role Guard: Only display and poll clinical notifications for Doctor and Admin logins
  if (!user || (user.role !== "DOCTOR" && user.role !== "ADMIN")) {
    return null;
  }

  return (
    <div className="relative">
      {/* Bell Button Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 sm:px-3 sm:py-1.5 rounded-xl border transition-all flex items-center gap-2 text-xs font-extrabold min-h-[36px] ${
          criticalCount > 0
            ? "bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-800 dark:text-rose-300 shadow-sm"
            : "bg-card border-border hover:bg-muted/60 text-foreground"
        }`}
        aria-label="Doctor Notifications"
        title="Clinical Alerts & Notifications"
      >
        <div className="relative">
          <Bell className={`h-4 w-4 ${criticalCount > 0 ? "text-rose-600 animate-bounce" : "text-foreground"}`} />
          {unreadCount > 0 && (
            <span
              className={`absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full font-black text-2xs shadow-xs ${
                criticalCount > 0 ? "bg-rose-600 text-white animate-pulse" : "bg-indigo-600 text-white"
              }`}
            >
              {unreadCount}
            </span>
          )}
        </div>
        <span className="hidden md:inline font-bold">
          सूचनाएं {unreadCount > 0 ? `(${unreadCount})` : ""}
        </span>
      </button>

      {/* Popover Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-[340px] sm:w-[420px] bg-card border-2 border-border/80 rounded-3xl shadow-2xl z-50 p-4 space-y-3 backdrop-blur-md"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-foreground">
                    क्लिनिकल अलर्ट व शिफ्ट सूचनाएं
                  </h4>
                  <p className="text-2xs text-muted-foreground font-semibold">
                    {unreadCount} नई / अपूर्ण सूचनाएं
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  title={soundEnabled ? "आवाज बंद करें (Mute Audio Chime)" : "आवाज चालू करें (Unmute Audio Chime)"}
                  className="p-1.5 rounded-lg border hover:bg-muted text-muted-foreground hover:text-foreground text-xs"
                >
                  {soundEnabled ? (
                    <Volume2 className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <VolumeX className="h-3.5 w-3.5 text-rose-500" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground space-y-1">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto" />
                  <p className="font-bold">सभी अलर्ट देखे जा चुके हैं</p>
                  <p className="text-2xs">कोई लंबित आपातकालीन सूचना नहीं है।</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const sevBadge = getSeverityBadge(n.severity);
                  const isAck = n.status === "ACKNOWLEDGED";

                  return (
                    <div
                      key={n.id}
                      className={`p-3.5 rounded-2xl border transition-all space-y-2 ${
                        n.severity === "CRITICAL"
                          ? "bg-rose-50/80 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 shadow-xs"
                          : n.severity === "HIGH"
                          ? "bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800"
                          : "bg-muted/30 border-border/70"
                      } ${isAck ? "opacity-60 bg-muted/20" : ""}`}
                    >
                      {/* Top Row: Severity + Time */}
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-2xs font-extrabold px-2 py-0.5 rounded-md border flex items-center gap-1 ${sevBadge.classes}`}
                        >
                          {sevBadge.icon}
                          {sevBadge.label}
                        </span>
                        <span className="text-2xs font-mono text-muted-foreground font-semibold">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      {/* Title & Message */}
                      <div className="space-y-0.5">
                        <h5 className="text-xs font-black text-foreground">{n.title}</h5>
                        <p className="text-2xs text-muted-foreground font-medium leading-relaxed">
                          {n.message}
                        </p>
                      </div>

                      {/* Patient & Token Metadata */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/40 text-2xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{n.patientName}</span>
                          {n.tokenNumber && (
                            <span className="px-1.5 py-0.5 rounded bg-background border font-mono font-extrabold text-foreground">
                              {n.tokenNumber}
                            </span>
                          )}
                        </div>

                        {/* Action Buttons: Acknowledge & Open Case */}
                        <div className="flex items-center gap-1.5">
                          {!isAck ? (
                            <button
                              type="button"
                              onClick={(e) => acknowledge(n.id, e)}
                              className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-2xs flex items-center gap-1 shadow-2xs transition-colors"
                            >
                              <Check className="h-3 w-3" /> देखा (Acknowledge)
                            </button>
                          ) : (
                            <span className="text-2xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> प्रमाणित
                            </span>
                          )}

                          {n.sessionId && (
                            <button
                              type="button"
                              onClick={() => handleOpenCase(n.sessionId)}
                              className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-2xs flex items-center gap-1 shadow-2xs transition-colors"
                            >
                              केस खोलें (Open)
                              <ExternalLink className="h-2.5 w-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Quick Controls */}
            {notifications.length > 0 && (
              <div className="flex items-center justify-between pt-2 border-t text-2xs text-muted-foreground">
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="font-bold hover:text-foreground underline"
                >
                  सभी को पढ़ा हुआ चिह्नित करें (Mark Read)
                </button>
                <button
                  type="button"
                  onClick={fetchNotifications}
                  className="font-bold hover:text-foreground flex items-center gap-1"
                >
                  <RefreshCw className="h-2.5 w-2.5" /> ताज़ा करें
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
