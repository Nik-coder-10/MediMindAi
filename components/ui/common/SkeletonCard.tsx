import React from "react";

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-3xl border-2 border-input bg-card p-6 space-y-4 animate-pulse ${className}`}
      aria-hidden="true"
    >
      <div className="flex items-center justify-between">
        <div className="h-5 w-28 bg-slate-200 dark:bg-slate-800 rounded-full" />
        <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded-lg" />
      </div>
      <div className="pt-2 flex justify-between">
        <div className="h-10 w-28 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="p-4 rounded-2xl bg-card border animate-pulse space-y-2" aria-hidden="true">
      <div className="flex justify-between items-center">
        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-md" />
        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
      </div>
      <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-md" />
    </div>
  );
}
