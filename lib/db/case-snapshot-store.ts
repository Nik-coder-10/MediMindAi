/**
 * Durable Case Snapshot Mirror
 *
 * The clinical queue / patient case list must survive serverless cold starts and
 * multiple Vercel lambda instances. When PostgreSQL is unavailable the in-memory
 * store is process-local only, so a case registered in one request disappears in
 * another. This module mirrors submitted cases into Supabase Storage (which is
 * already configured and working in production) and rehydrates them on demand.
 *
 * Snapshots are a resilience layer only — PostgreSQL remains the source of truth
 * when it is reachable.
 */

import { supabaseAdminClient } from "@/lib/auth/supabase-client";
import { inMemoryClinicalStore } from "@/lib/db/in-memory-store";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "medical-documents";
const PREFIX = "case-snapshots";
const CACHE_TTL_MS = 8000;

let snapshotCache: { at: number; items: any[]; loaded: boolean } = {
  at: 0,
  items: [],
  loaded: false,
};

function withTimeout<T>(work: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    work,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

function iso(value: any): string | null {
  if (!value) return null;
  try {
    const d = value instanceof Date ? value : new Date(value);
    return isNaN(d.getTime()) ? null : d.toISOString();
  } catch {
    return null;
  }
}

/** Normalizes ISO date strings back to Date objects for in-memory consumers. */
function reviveDates(value: any): any {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(reviveDates);

  const out: any = { ...value };
  for (const key of [
    "startedAt",
    "updatedAt",
    "completedAt",
    "dateOfBirth",
    "answeredAt",
    "triggeredAt",
    "uploadedAt",
    "timestamp",
    "grantedAt",
    "eventDate",
    "createdAt",
  ]) {
    if (typeof out[key] === "string" && out[key]) {
      const d = new Date(out[key]);
      if (!isNaN(d.getTime())) out[key] = d;
    }
  }
  for (const key of [
    "patient",
    "user",
    "clinicalSummary",
    "ayurvedaAssessment",
  ]) {
    if (out[key] && typeof out[key] === "object") out[key] = reviveDates(out[key]);
  }
  for (const key of [
    "patientAnswers",
    "medicalDocuments",
    "redFlagEvents",
    "conversationTurns",
    "chiefComplaints",
  ]) {
    if (Array.isArray(out[key])) out[key] = out[key].map(reviveDates);
  }
  if (out.patient?.timelineEvents) {
    out.patient.timelineEvents = out.patient.timelineEvents.map(reviveDates);
  }
  return out;
}

function buildSnapshot(session: any) {
  return {
    id: session.id,
    patientId: session.patientId ?? null,
    doctorId: session.doctorId ?? null,
    status: session.status ?? "IN_PROGRESS",
    triagePriority: session.triagePriority ?? "ROUTINE",
    language: session.language ?? "hi",
    startedAt: iso(session.startedAt) ?? new Date().toISOString(),
    updatedAt: iso(session.updatedAt) ?? new Date().toISOString(),
    completedAt: iso(session.completedAt),
    redFlagTriggered: !!session.redFlagTriggered,
    notes: session.notes ?? null,
    patient: session.patient
      ? {
          ...session.patient,
          dateOfBirth: iso(session.patient.dateOfBirth),
          user: session.patient.user
            ? {
                ...session.patient.user,
                preferredLanguage: session.patient.user.preferredLanguage ?? session.language ?? "hi",
              }
            : null,
          timelineEvents: (session.patient.timelineEvents || []).map((e: any) => ({
            ...e,
            eventDate: iso(e.eventDate),
          })),
          consentRecords: session.patient.consentRecords || [],
        }
      : null,
    chiefComplaints: (session.chiefComplaints || []).map((cc: any) => ({
      id: cc.id ?? `cc-${session.id}`,
      sessionId: session.id,
      symptomName: cc.symptomName ?? "Consultation Intake",
      duration: cc.duration ?? "2-3 days",
      severity: cc.severity ?? "MODERATE",
      location: cc.location ?? "General",
    })),
    patientAnswers: (session.patientAnswers || []).map((a: any) => ({
      ...a,
      answeredAt: iso(a.answeredAt),
    })),
    conversationTurns: (session.conversationTurns || []).map((t: any) => ({
      ...t,
      timestamp: iso(t.timestamp),
    })),
    medicalDocuments: (session.medicalDocuments || []).map((d: any) => ({
      ...d,
      uploadedAt: iso(d.uploadedAt),
      extractedEntities: d.extractedEntities || [],
    })),
    redFlagEvents: (session.redFlagEvents || []).map((rf: any) => ({
      ...rf,
      triggeredAt: iso(rf.triggeredAt),
    })),
    clinicalSummary: session.clinicalSummary
      ? {
          ...session.clinicalSummary,
          updatedAt: iso(session.clinicalSummary.updatedAt),
        }
      : null,
    ayurvedaAssessment: session.ayurvedaAssessment || null,
    doctor: session.doctor || null,
  };
}

/** Mirrors a submitted (or updated) case to durable storage. Non-fatal. */
export async function saveCaseSnapshot(session: any): Promise<boolean> {
  if (!session?.id) return false;
  try {
    const payload = JSON.stringify(buildSnapshot(session));
    const result = await withTimeout(
      supabaseAdminClient.storage
        .from(BUCKET)
        .upload(`${PREFIX}/${session.id}.json`, payload, {
          contentType: "application/json",
          upsert: true,
        }),
      6000,
      { error: new Error("Storage mirror timeout") } as any
    );

    if (result?.error) {
      console.warn("[CaseSnapshot] mirror upload warning:", result.error.message);
      return false;
    }

    // Ensure the next list read sees this case immediately.
    snapshotCache = { at: 0, items: [], loaded: false };
    return true;
  } catch (error) {
    console.warn(
      "[CaseSnapshot] mirror upload unavailable (in-memory fallback active):",
      (error as any)?.message
    );
    return false;
  }
}

/** Loads every mirrored case. Returns [] when storage is unavailable. */
export async function loadAllCaseSnapshots(): Promise<any[]> {
  if (snapshotCache.loaded && Date.now() - snapshotCache.at < CACHE_TTL_MS) {
    return snapshotCache.items;
  }

  try {
    const listed = await withTimeout(
      supabaseAdminClient.storage.from(BUCKET).list(PREFIX, { limit: 1000 }),
      6000,
      { data: null, error: new Error("Storage list timeout") } as any
    );
    const { data, error } = listed;

    if (error || !data?.length) {
      snapshotCache = { at: Date.now(), items: [], loaded: true };
      return [];
    }

    const jsonFiles = data.filter((f: any) => f.name?.endsWith(".json"));
    const loaded = await Promise.all(
      jsonFiles.map(async (f: any) => {
        try {
          const { data: blob, error: dlError } = await withTimeout(
            supabaseAdminClient.storage.from(BUCKET).download(`${PREFIX}/${f.name}`),
            6000,
            { data: null, error: new Error("Storage download timeout") } as any
          );
          if (dlError || !blob) return null;
          const parsed = JSON.parse(await blob.text());
          return parsed?.id ? reviveDates(parsed) : null;
        } catch {
          return null;
        }
      })
    );

    const items = loaded.filter(Boolean);
    snapshotCache = { at: Date.now(), items, loaded: true };
    return items;
  } catch (error) {
    console.warn(
      "[CaseSnapshot] mirror read unavailable:",
      (error as any)?.message
    );
    snapshotCache = { at: Date.now(), items: [], loaded: true };
    return [];
  }
}

/**
 * Loads one mirrored case into the process-local clinical store so that
 * authorization and detail routes keep working across lambda instances.
 */
export async function hydrateCaseSnapshot(sessionId: string): Promise<any | null> {
  if (!sessionId) return null;
  if (inMemoryClinicalStore.getSession(sessionId)) {
    return inMemoryClinicalStore.getSession(sessionId);
  }

  try {
    const { data: blob, error } = await withTimeout(
      supabaseAdminClient.storage.from(BUCKET).download(`${PREFIX}/${sessionId}.json`),
      6000,
      { data: null, error: new Error("Storage hydration timeout") } as any
    );
    if (error || !blob) return null;

    const parsed = JSON.parse(await blob.text());
    if (!parsed?.id) return null;

    const session = reviveDates(parsed);
    inMemoryClinicalStore.upsertSession(session as any);
    return session;
  } catch {
    return null;
  }
}
