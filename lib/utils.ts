import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

/**
 * Generates a clean, deterministic consultation token in the format #AYUR-SESS-XXXX
 * where XXXX is a 4-digit number (1000-9999) derived from the session ID.
 */
export function formatAyurToken(sessionId?: string | null): string {
  if (!sessionId) {
    return "#AYUR-SESS-1048";
  }
  // If already matches #AYUR-SESS-XXXX, preserve it
  if (/^#?AYUR-SESS-\d{4}$/i.test(sessionId)) {
    return sessionId.startsWith("#") ? sessionId.toUpperCase() : `#${sessionId.toUpperCase()}`;
  }
  let hash = 0;
  for (let i = 0; i < sessionId.length; i++) {
    hash = ((hash << 5) - hash) + sessionId.charCodeAt(i);
    hash |= 0;
  }
  const fourDigit = (Math.abs(hash) % 9000) + 1000;
  return `#AYUR-SESS-${fourDigit}`;
}

