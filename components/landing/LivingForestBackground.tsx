"use client";

import React from "react";
import Image from "next/image";

export function LivingForestBackground({
  className = "",
  isFixed = false,
}: {
  className?: string;
  isFixed?: boolean;
}) {
  return (
    <div
      className={`${
        isFixed ? "fixed inset-0 h-screen" : "absolute inset-0"
      } overflow-hidden pointer-events-none z-0 select-none ${className}`}
      aria-hidden="true"
    >
      {/* ─── LAYER 1: CINEMATIC AYURVEDIC FOREST ENVIRONMENT ─── */}
      <div className="absolute inset-0 -top-8 h-[115%] w-full overflow-hidden opacity-20 dark:opacity-20 transition-opacity duration-700 pointer-events-none">
        <Image
          src="/images/ayurvedic-forest-hero.jpg"
          alt="Ayurvedic Forest Environment"
          fill
          priority
          sizes="100vw"
          className="object-cover object-top scale-105 blur-[2px] transform-gpu"
        />
      </div>

      {/* ─── LAYER 2: BOTANICAL VIGNETTES & MORNING LIGHT MIST ─── */}
      {/* Deep botanical emerald framing at the outer perimeter */}
      <div className="absolute inset-0 bg-radial-[ellipse_90%_75%_at_50%_35%] from-white/95 via-emerald-50/50 to-botanical-950/25 dark:from-forest-950/80 dark:via-forest-950/90 dark:to-forest-950 transition-colors duration-500" />

      {/* Soft atmospheric deep forest glows in corners */}
      <div className="absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full bg-botanical-700/15 dark:bg-botanical-800/25 blur-[140px]" />
      <div className="absolute -top-20 -right-32 w-[500px] h-[500px] rounded-full bg-emerald-600/12 dark:bg-emerald-900/20 blur-[130px]" />
      <div className="absolute bottom-0 -left-20 w-[450px] h-[450px] rounded-full bg-botanical-800/10 dark:bg-botanical-900/30 blur-[120px]" />
      <div className="absolute bottom-10 -right-20 w-[480px] h-[480px] rounded-full bg-amber-500/10 dark:bg-amber-600/12 blur-[130px]" />

      {/* ─── LAYER 3: MORNING SUNLIGHT GOD RAYS (FILTERING FROM TOP-RIGHT) ─── */}
      <div className="absolute -top-10 right-0 w-[550px] sm:w-[680px] h-[750px] opacity-45 dark:opacity-25 animate-sunbeam pointer-events-none">
        <svg
          viewBox="0 0 680 750"
          fill="none"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="sunbeam-grad-1" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.22" />
              <stop offset="45%" stopColor="#10B981" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="sunbeam-grad-2" x1="100%" y1="10%" x2="10%" y2="100%">
              <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.16" />
              <stop offset="55%" stopColor="#34D399" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#34D399" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points="680,0 620,0 240,750 350,750" fill="url(#sunbeam-grad-1)" />
          <polygon points="560,0 500,0 90,750 180,750" fill="url(#sunbeam-grad-2)" />
        </svg>
      </div>

      {/* ─── LAYER 4: CORNER BOTANICAL FOLIAGE (PERIPHERY ONLY, NEVER OVER HEADING) ─── */}

      {/* TOP-LEFT: Neem (Azadirachta indica) Branch Arch — Tucked safely in upper-left corner */}
      <div className="hidden sm:block absolute -top-12 -left-12 w-[320px] md:w-[380px] lg:w-[440px] h-[300px] opacity-60 dark:opacity-35 animate-forest-sway-left drop-shadow-sm">
        <svg
          viewBox="0 0 440 300"
          fill="none"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Stem curves downwards along the left edge away from center */}
          <path
            d="M-20,-10 C60,40 120,95 180,165 C210,205 230,245 245,280"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            className="text-botanical-900 dark:text-botanical-500"
          />
          <path
            d="M100,75 C140,120 170,175 195,225"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="text-botanical-800 dark:text-botanical-600"
          />

          {/* Leaflets pointing outwards */}
          {[
            { cx: 50, cy: 35, r: -45, scale: 1.1 },
            { cx: 80, cy: 62, r: 35, scale: 1.2 },
            { cx: 110, cy: 88, r: -50, scale: 1.25 },
            { cx: 145, cy: 125, r: 40, scale: 1.3 },
            { cx: 175, cy: 165, r: -40, scale: 1.2 },
            { cx: 205, cy: 205, r: 35, scale: 1.15 },
            { cx: 228, cy: 245, r: -30, scale: 1.05 },
            { cx: 244, cy: 278, r: 25, scale: 0.85 },
            // Sub-branch leaflets
            { cx: 130, cy: 110, r: 55, scale: 1.0 },
            { cx: 155, cy: 150, r: -55, scale: 1.05 },
            { cx: 180, cy: 195, r: 50, scale: 0.95 },
          ].map((leaf, idx) => (
            <g
              key={idx}
              transform={`translate(${leaf.cx}, ${leaf.cy}) rotate(${leaf.r}) scale(${leaf.scale * 0.7})`}
            >
              <path
                d="M0,0 C-8,-24 -2,-54 0,-68 C2,-54 8,-24 0,0 Z"
                fill="currentColor"
                className={
                  idx % 2 === 0
                    ? "text-botanical-700 dark:text-botanical-400"
                    : "text-emerald-800 dark:text-emerald-500"
                }
              />
              <path
                d="M0,0 L0,-62"
                stroke="currentColor"
                strokeWidth="0.8"
                className="text-botanical-950/30 dark:text-botanical-200/30"
              />
            </g>
          ))}
        </svg>
      </div>

      {/* TOP-RIGHT: Canopy Branch Arch — Tucked safely in upper-right corner */}
      <div className="hidden sm:block absolute -top-12 -right-12 w-[320px] md:w-[380px] lg:w-[440px] h-[300px] opacity-55 dark:opacity-30 animate-forest-sway-right drop-shadow-sm">
        <svg
          viewBox="0 0 440 300"
          fill="none"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Stem curves downwards along the right edge away from center */}
          <path
            d="M460,-10 C380,40 320,95 260,165 C230,205 210,245 195,280"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            className="text-botanical-900 dark:text-botanical-500"
          />
          <path
            d="M340,75 C300,120 270,175 245,225"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="text-botanical-800 dark:text-botanical-600"
          />

          {[
            { cx: 390, cy: 35, r: 45, scale: 1.1 },
            { cx: 360, cy: 62, r: -35, scale: 1.2 },
            { cx: 330, cy: 88, r: 50, scale: 1.25 },
            { cx: 295, cy: 125, r: -40, scale: 1.3 },
            { cx: 265, cy: 165, r: 40, scale: 1.2 },
            { cx: 235, cy: 205, r: -35, scale: 1.15 },
            { cx: 212, cy: 245, r: 30, scale: 1.05 },
            { cx: 196, cy: 278, r: -25, scale: 0.85 },
            // Sub-branch
            { cx: 310, cy: 110, r: -55, scale: 1.0 },
            { cx: 285, cy: 150, r: 55, scale: 1.05 },
            { cx: 260, cy: 195, r: -50, scale: 0.95 },
          ].map((leaf, idx) => (
            <g
              key={idx}
              transform={`translate(${leaf.cx}, ${leaf.cy}) rotate(${leaf.r}) scale(${leaf.scale * 0.7})`}
            >
              <path
                d="M0,0 C-8,-24 -1,-54 0,-68 C2,-54 8,-24 0,0 Z"
                fill="currentColor"
                className={
                  idx % 2 === 0
                    ? "text-botanical-800 dark:text-botanical-400"
                    : "text-emerald-800 dark:text-emerald-500"
                }
              />
              <path
                d="M0,0 L0,-62"
                stroke="currentColor"
                strokeWidth="0.8"
                className="text-botanical-950/30 dark:text-botanical-200/30"
              />
            </g>
          ))}
        </svg>
      </div>

      {/* LEFT FLANK: Tulsi (Ocimum sanctum) Shrub Silhouettes (Desktop/Tablet edge) */}
      <div className="hidden md:block absolute top-[36%] -left-12 w-[220px] lg:w-[260px] h-[440px] opacity-35 dark:opacity-20 animate-forest-sway-gentle">
        <svg
          viewBox="0 0 260 440"
          fill="none"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20,440 C55,345 70,230 55,115 C50,80 35,40 20,5"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
            className="text-botanical-950 dark:text-botanical-600"
          />
          {[
            { cx: 52, cy: 360, scale: 1.15, r: -45 },
            { cx: 58, cy: 355, scale: 1.15, r: 40 },
            { cx: 64, cy: 280, scale: 1.2, r: -50 },
            { cx: 68, cy: 275, scale: 1.2, r: 45 },
            { cx: 61, cy: 205, scale: 1.15, r: -40 },
            { cx: 63, cy: 200, scale: 1.15, r: 35 },
            { cx: 52, cy: 135, scale: 1.0, r: -45 },
            { cx: 54, cy: 130, scale: 1.0, r: 40 },
          ].map((leaf, i) => (
            <g
              key={i}
              transform={`translate(${leaf.cx}, ${leaf.cy}) rotate(${leaf.r}) scale(${leaf.scale * 0.8})`}
            >
              <path
                d="M0,0 C-14,-15 -18,-35 0,-50 C18,-35 14,-15 0,0 Z"
                fill="currentColor"
                className="text-botanical-800 dark:text-botanical-400"
              />
            </g>
          ))}
          <circle cx="20" cy="12" r="3" fill="currentColor" className="text-amber-500" />
          <circle cx="22" cy="22" r="3.5" fill="currentColor" className="text-amber-500" />
          <circle cx="19" cy="32" r="4" fill="currentColor" className="text-amber-500" />
        </svg>
      </div>

      {/* RIGHT FLANK: Ashwagandha & Peepal Foliage framing (Desktop/Tablet edge) */}
      <div className="hidden md:block absolute top-[40%] -right-12 w-[220px] lg:w-[260px] h-[440px] opacity-35 dark:opacity-20 animate-forest-sway-gentle">
        <svg
          viewBox="0 0 260 440"
          fill="none"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M240,440 C205,345 190,230 205,115 C210,80 225,40 240,5"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
            className="text-botanical-950 dark:text-botanical-600"
          />
          {[
            { cx: 208, cy: 360, scale: 1.15, r: -40 },
            { cx: 202, cy: 365, scale: 1.15, r: 45 },
            { cx: 196, cy: 280, scale: 1.2, r: -45 },
            { cx: 200, cy: 285, scale: 1.2, r: 50 },
            { cx: 199, cy: 205, scale: 1.15, r: -35 },
            { cx: 201, cy: 210, scale: 1.15, r: 40 },
            { cx: 208, cy: 135, scale: 1.0, r: -40 },
            { cx: 210, cy: 140, scale: 1.0, r: 45 },
          ].map((leaf, i) => (
            <g
              key={i}
              transform={`translate(${leaf.cx}, ${leaf.cy}) rotate(${leaf.r}) scale(${leaf.scale * 0.8})`}
            >
              <path
                d="M0,0 C-15,-18 -20,-40 0,-56 C20,-40 15,-18 0,0 Z"
                fill="currentColor"
                className="text-emerald-800 dark:text-emerald-500"
              />
            </g>
          ))}
        </svg>
      </div>

      {/* ─── LAYER 5: DRIFTING AYURVEDIC HERBAL LEAVES (OUTER EDGES ONLY) ─── */}
      <div className="hidden sm:block absolute top-20 left-[8%] w-5 h-8 animate-leaf-drift-1 opacity-0 pointer-events-none">
        <svg viewBox="0 0 20 32" fill="none" className="w-full h-full">
          <path
            d="M10,0 C2,9 1,22 10,32 C19,22 18,9 10,0 Z"
            fill="currentColor"
            className="text-botanical-700/70 dark:text-botanical-400/70"
          />
        </svg>
      </div>

      <div
        className="hidden sm:block absolute top-28 right-[10%] w-5 h-8 animate-leaf-drift-2 opacity-0 pointer-events-none"
        style={{ animationDelay: "5s" }}
      >
        <svg viewBox="0 0 20 32" fill="none" className="w-full h-full">
          <path
            d="M10,0 C2,9 1,22 10,32 C19,22 18,9 10,0 Z"
            fill="currentColor"
            className="text-emerald-700/65 dark:text-emerald-400/65"
          />
        </svg>
      </div>

      {/* ─── LAYER 6: PRANA / HERBAL POLLEN MICRO PARTICLES ─── */}
      {[
        { left: "12%", top: "25%", delay: "0s", duration: "8s", size: "w-1.5 h-1.5" },
        { left: "15%", top: "60%", delay: "2.5s", duration: "9s", size: "w-1 h-1" },
        { left: "86%", top: "22%", delay: "1.2s", duration: "7.5s", size: "w-2 h-2" },
        { left: "84%", top: "68%", delay: "4s", duration: "8.5s", size: "w-1.5 h-1.5" },
        { left: "8%", top: "45%", delay: "3s", duration: "6.5s", size: "w-1 h-1" },
        { left: "92%", top: "40%", delay: "5.5s", duration: "9.5s", size: "w-1.5 h-1.5" },
        { left: "22%", top: "18%", delay: "2s", duration: "7s", size: "w-1 h-1" },
        { left: "80%", top: "80%", delay: "3.8s", duration: "8s", size: "w-1.5 h-1.5" },
      ].map((pt, idx) => (
        <div
          key={idx}
          className={`absolute ${pt.size} rounded-full bg-gradient-to-tr from-amber-400 to-emerald-300 blur-[0.5px] animate-prana pointer-events-none`}
          style={{
            left: pt.left,
            top: pt.top,
            animationDelay: pt.delay,
            animationDuration: pt.duration,
          }}
        />
      ))}

      {/* ─── LAYER 7: CENTRAL PROTECTED READABILITY CLEARING ─── */}
      {/* Broad soft mist mask behind the heading and CTAs ensuring 100% text contrast and readability */}
      <div className="absolute top-[4%] left-1/2 -translate-x-1/2 w-[94%] max-w-5xl h-[620px] rounded-full bg-radial-[ellipse_at_center] from-white/95 via-white/80 to-transparent dark:from-forest-950/95 dark:via-forest-950/80 dark:to-transparent blur-3xl pointer-events-none" />
    </div>
  );
}
