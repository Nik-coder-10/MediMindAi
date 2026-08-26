"use client";

import React from "react";
import { TimelineEventDTO } from "@/lib/services/timeline.service";
import { Calendar, Pill, Activity, Stethoscope, AlertTriangle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

interface MedicalTimelineViewProps {
  events: TimelineEventDTO[];
  className?: string;
}

export function MedicalTimelineView({ events, className = "" }: MedicalTimelineViewProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "MEDICATION":
        return <Pill className="h-4 w-4 text-amber-600" />;
      case "LAB":
        return <Activity className="h-4 w-4 text-rose-600" />;
      case "DIAGNOSIS":
        return <Stethoscope className="h-4 w-4 text-emerald-600" />;
      default:
        return <Calendar className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="relative border-l-3 border-emerald-300 dark:border-emerald-800 ml-4 sm:ml-6 space-y-6">
        {events.map((evt, idx) => (
          <motion.div
            key={evt.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="relative pl-6 sm:pl-8 group"
          >
            {/* Timeline Node Icon Circle */}
            <div className="absolute -left-[14px] top-1.5 w-7 h-7 rounded-full bg-white dark:bg-slate-900 border-2 border-emerald-500 flex items-center justify-center shadow-md">
              {getCategoryIcon(evt.category)}
            </div>

            {/* Event Content Card */}
            <div className="p-4 rounded-2xl bg-white dark:bg-card border-2 border-input hover:border-emerald-400 shadow-sm transition-all space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {evt.eventDate}
                </span>

                {evt.isAbnormal && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 flex items-center gap-1 border border-rose-200">
                    <AlertTriangle className="h-3 w-3 text-rose-600" /> डॉक्टर समीक्षा हेतु (Abnormal)
                  </span>
                )}
              </div>

              <h4 className="text-base font-extrabold text-foreground leading-snug">{evt.title}</h4>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">{evt.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
