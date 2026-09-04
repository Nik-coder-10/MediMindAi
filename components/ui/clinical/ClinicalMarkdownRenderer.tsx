"use client";

import React, { useMemo } from "react";
import {
  User,
  AlertTriangle,
  Stethoscope,
  FileText,
  Pill,
  Activity,
  FlaskConical,
  Calendar,
  Flower2,
  ClipboardList,
  ShieldCheck,
  Heart,
  Thermometer,
  Brain,
} from "lucide-react";

/* ─── Types ─── */
interface Section {
  heading: string;
  sectionNumber: string;
  content: ContentLine[];
}

interface ContentLine {
  type: "text" | "bold-pair" | "sub-heading" | "list-item" | "empty";
  label?: string;
  value?: string;
  raw: string;
  indent: number;
}

/* ─── Section Icon Mapper ─── */
function getSectionIcon(heading: string, sectionNumber: string) {
  const h = heading.toLowerCase();
  if (h.includes("demographic") || h.includes("encounter") || h.includes("patient"))
    return <User className="h-4.5 w-4.5" />;
  if (h.includes("triage") || h.includes("red flag") || h.includes("safety"))
    return <AlertTriangle className="h-4.5 w-4.5" />;
  if (h.includes("chief complaint") || h.includes("complaint"))
    return <Stethoscope className="h-4.5 w-4.5" />;
  if (h.includes("history") && h.includes("present"))
    return <FileText className="h-4.5 w-4.5" />;
  if (h.includes("medication") || h.includes("allerg"))
    return <Pill className="h-4.5 w-4.5" />;
  if (h.includes("investigation") || h.includes("lab") || h.includes("abnormal"))
    return <FlaskConical className="h-4.5 w-4.5" />;
  if (h.includes("timeline") || h.includes("longitudinal"))
    return <Calendar className="h-4.5 w-4.5" />;
  if (h.includes("ayush") || h.includes("dashavidha") || h.includes("pariksha") || h.includes("prakriti"))
    return <Flower2 className="h-4.5 w-4.5" />;
  if (h.includes("clinical note") || h.includes("physician") || h.includes("attention"))
    return <ClipboardList className="h-4.5 w-4.5" />;
  if (h.includes("vitals") || h.includes("vital"))
    return <Heart className="h-4.5 w-4.5" />;
  if (h.includes("general") || h.includes("assessment"))
    return <Brain className="h-4.5 w-4.5" />;
  return <ShieldCheck className="h-4.5 w-4.5" />;
}

function getSectionAccent(heading: string): string {
  const h = heading.toLowerCase();
  if (h.includes("triage") || h.includes("red flag") || h.includes("safety") || h.includes("emergency"))
    return "rose";
  if (h.includes("ayush") || h.includes("dashavidha") || h.includes("prakriti"))
    return "amber";
  if (h.includes("investigation") || h.includes("lab"))
    return "violet";
  if (h.includes("medication") || h.includes("allerg"))
    return "blue";
  if (h.includes("clinical note") || h.includes("physician") || h.includes("attention"))
    return "indigo";
  return "emerald";
}

/* ─── Parser ─── */
function parseMarkdown(raw: string): { title: string; subtitle: string; sections: Section[] } {
  const lines = raw.split("\n");
  let title = "";
  let subtitle = "";
  const sections: Section[] = [];
  let currentSection: Section | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines (but note them for content spacing)
    if (!trimmed || trimmed === "---") {
      if (currentSection) {
        currentSection.content.push({ type: "empty", raw: "", indent: 0 });
      }
      continue;
    }

    // H1 — Main document title
    if (/^#\s+/.test(trimmed) && !trimmed.startsWith("##")) {
      title = trimmed.replace(/^#\s*/, "").replace(/📋\s?/g, "").trim();
      continue;
    }

    // Italic subtitle line (e.g. *AI-Drafted Consultation Note...*)
    if (/^\*[^*]+\*$/.test(trimmed) && !title.includes(trimmed)) {
      subtitle = trimmed.replace(/^\*|\*$/g, "").trim();
      continue;
    }

    // H2 — Section headings
    if (/^##\s+/.test(trimmed)) {
      const headingText = trimmed.replace(/^##\s*/, "").trim();
      // Extract section number like "1." "2." etc.
      const numMatch = headingText.match(/^(\d+)\.\s*(.*)/);
      currentSection = {
        heading: numMatch ? numMatch[2].replace(/^[🚨📋💊🧪📅🌿📝🏥🔬⚕️✨]*\s*/, "").trim() : headingText.replace(/^[🚨📋💊🧪📅🌿📝🏥🔬⚕️✨]*\s*/, "").trim(),
        sectionNumber: numMatch ? numMatch[1] : String(sections.length + 1),
        content: [],
      };
      sections.push(currentSection);
      continue;
    }

    // H3 — Sub-heading within a section
    if (/^###\s+/.test(trimmed) && currentSection) {
      currentSection.content.push({
        type: "sub-heading",
        raw: trimmed.replace(/^###\s*/, "").trim(),
        indent: 0,
      });
      continue;
    }

    // If we have a current section, parse content lines
    if (currentSection) {
      const indent = line.search(/\S/) || 0;
      const cleanLine = trimmed.replace(/^[-•*]\s*/, "");

      // Check if it's a "**Label**: Value" pattern
      const boldPairMatch = cleanLine.match(/^\*\*(.+?)\*\*:\s*(.*)/);
      if (boldPairMatch) {
        currentSection.content.push({
          type: "bold-pair",
          label: boldPairMatch[1].trim(),
          value: boldPairMatch[2].replace(/\*\*/g, "").trim(),
          raw: cleanLine,
          indent: indent >= 4 ? 1 : 0,
        });
        continue;
      }

      // Regular list item (starts with - or •)
      if (/^[-•*]\s/.test(trimmed)) {
        currentSection.content.push({
          type: "list-item",
          raw: cleanLine.replace(/\*\*/g, ""),
          indent: indent >= 4 ? 1 : 0,
        });
        continue;
      }

      // Regular text
      currentSection.content.push({
        type: "text",
        raw: cleanLine.replace(/\*\*/g, ""),
        indent: indent >= 4 ? 1 : 0,
      });
    }
  }

  // Clean trailing empties from each section
  sections.forEach((s) => {
    while (s.content.length > 0 && s.content[s.content.length - 1].type === "empty") {
      s.content.pop();
    }
  });

  return { title, subtitle, sections };
}

/* ─── Accent Color Classes ─── */
const accentColors: Record<string, { bg: string; border: string; icon: string; badge: string; dot: string }> = {
  emerald: {
    bg: "bg-emerald-50/70 dark:bg-emerald-950/20",
    border: "border-emerald-200/80 dark:border-emerald-800/40",
    icon: "text-emerald-600 dark:text-emerald-400",
    badge: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    dot: "bg-emerald-500",
  },
  rose: {
    bg: "bg-rose-50/70 dark:bg-rose-950/20",
    border: "border-rose-200/80 dark:border-rose-800/40",
    icon: "text-rose-600 dark:text-rose-400",
    badge: "bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    dot: "bg-rose-500",
  },
  amber: {
    bg: "bg-amber-50/70 dark:bg-amber-950/20",
    border: "border-amber-200/80 dark:border-amber-800/40",
    icon: "text-amber-600 dark:text-amber-400",
    badge: "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    dot: "bg-amber-500",
  },
  violet: {
    bg: "bg-violet-50/70 dark:bg-violet-950/20",
    border: "border-violet-200/80 dark:border-violet-800/40",
    icon: "text-violet-600 dark:text-violet-400",
    badge: "bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-300 border-violet-200 dark:border-violet-800",
    dot: "bg-violet-500",
  },
  blue: {
    bg: "bg-blue-50/70 dark:bg-blue-950/20",
    border: "border-blue-200/80 dark:border-blue-800/40",
    icon: "text-blue-600 dark:text-blue-400",
    badge: "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    dot: "bg-blue-500",
  },
  indigo: {
    bg: "bg-indigo-50/70 dark:bg-indigo-950/20",
    border: "border-indigo-200/80 dark:border-indigo-800/40",
    icon: "text-indigo-600 dark:text-indigo-400",
    badge: "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
    dot: "bg-indigo-500",
  },
};

/* ─── Main Component ─── */
export function ClinicalMarkdownRenderer({
  markdown,
  compact = false,
}: {
  markdown: string;
  compact?: boolean;
}) {
  const { title, subtitle, sections } = useMemo(() => parseMarkdown(markdown || ""), [markdown]);

  if (!markdown || sections.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-xs font-semibold">
        No clinical summary content available.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Document Header */}
      {title && (
        <div className="pb-3 border-b border-border/60">
          <h2 className={`${compact ? "text-base" : "text-lg"} font-black text-foreground tracking-tight flex items-center gap-2`}>
            <FileText className={`${compact ? "h-4 w-4" : "h-5 w-5"} text-emerald-600`} />
            {title}
          </h2>
          {subtitle && (
            <p className="text-[11px] text-muted-foreground font-semibold mt-0.5 italic">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Sections */}
      <div className={`grid gap-3 ${compact ? "" : "sm:gap-4"}`}>
        {sections.map((section, idx) => {
          const accent = getSectionAccent(section.heading);
          const colors = accentColors[accent] || accentColors.emerald;
          const icon = getSectionIcon(section.heading, section.sectionNumber);

          // Filter out empty-only content
          const contentItems = section.content.filter((c) => c.type !== "empty");
          if (contentItems.length === 0) return null;

          return (
            <div
              key={idx}
              className={`rounded-2xl border ${colors.border} overflow-hidden transition-all duration-200 hover:shadow-sm`}
            >
              {/* Section Header */}
              <div className={`px-4 ${compact ? "py-2.5" : "py-3"} ${colors.bg} flex items-center gap-2.5 border-b ${colors.border}`}>
                <div className={`${compact ? "p-1.5" : "p-2"} rounded-xl bg-white dark:bg-slate-900 shadow-xs border ${colors.border}`}>
                  <span className={colors.icon}>{icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`${compact ? "text-xs" : "text-[13px]"} font-extrabold text-foreground tracking-tight leading-tight`}>
                    {section.heading}
                  </h3>
                </div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${colors.badge} shrink-0`}>
                  §{section.sectionNumber}
                </span>
              </div>

              {/* Section Content */}
              <div className={`${compact ? "px-4 py-3" : "px-5 py-4"} bg-white dark:bg-card space-y-1.5`}>
                {contentItems.map((item, lineIdx) => {
                  if (item.type === "sub-heading") {
                    return (
                      <h4
                        key={lineIdx}
                        className="text-xs font-extrabold text-foreground uppercase tracking-wider pt-2 pb-0.5 border-b border-border/40 mb-1"
                      >
                        {item.raw}
                      </h4>
                    );
                  }

                  if (item.type === "bold-pair") {
                    return (
                      <div
                        key={lineIdx}
                        className={`flex items-start gap-2 ${compact ? "text-[11px]" : "text-xs"} ${item.indent ? "ml-5" : ""}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} shrink-0 mt-1.5`} />
                        <span className="font-bold text-muted-foreground shrink-0 min-w-[100px]">
                          {item.label}:
                        </span>
                        <span className="font-semibold text-foreground flex-1">
                          {item.value || "—"}
                        </span>
                      </div>
                    );
                  }

                  if (item.type === "list-item") {
                    return (
                      <div
                        key={lineIdx}
                        className={`flex items-start gap-2 ${compact ? "text-[11px]" : "text-xs"} ${item.indent ? "ml-5" : ""}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} shrink-0 mt-1.5`} />
                        <span className="font-semibold text-foreground leading-relaxed">
                          {item.raw}
                        </span>
                      </div>
                    );
                  }

                  if (item.type === "text" && item.raw) {
                    return (
                      <p
                        key={lineIdx}
                        className={`${compact ? "text-[11px]" : "text-xs"} font-medium text-foreground/90 leading-relaxed ${item.indent ? "ml-5" : ""}`}
                      >
                        {item.raw}
                      </p>
                    );
                  }

                  return null;
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
