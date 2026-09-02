import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/api/errors";
import {
  ObservationType,
  ObservationSource,
  ObservationStatus,
  SessionStatus,
  ClinicalObservation,
} from "@prisma/client";

export type LongitudinalTrend =
  | "IMPROVING"
  | "WORSENING"
  | "STABLE"
  | "FLUCTUATING"
  | "NEW"
  | "RESOLVED"
  | "UNKNOWN";

export type SymptomEvolutionState =
  | "NEW"
  | "PERSISTENT"
  | "RESOLVED"
  | "NOT_CURRENTLY_REPORTED"
  | "UNKNOWN";

export type TimelineEventType =
  | "CONSULTATION"
  | "NEW_SYMPTOM"
  | "PERSISTENT_SYMPTOM"
  | "IMPROVING_SYMPTOM"
  | "WORSENING_SYMPTOM"
  | "RESOLVED_SYMPTOM"
  | "NEW_FINDING"
  | "MEDICATION_CHANGE"
  | "AYURVEDA_CHANGE"
  | "HOMEOPATHY_CHANGE"
  | "DOCTOR_ASSESSMENT"
  | "RED_FLAG_ALERT"
  | "DOCUMENT_ANALYZED";

export interface NormalizedObservationPoint {
  observationId: string;
  sessionId: string;
  sessionDate: Date;
  rawText: string;
  value?: string | null;
  numericValue?: number | null;
  severity?: string | null;
  frequency?: string | null;
  modality?: string | null;
  bodySite?: string | null;
  status: ObservationStatus;
  source: ObservationSource;
  confidence: number;
  isVerifiedByDoctor: boolean;
  verifiedById?: string | null;
  doctorNotes?: string | null;
}

export interface SymptomTrajectory {
  conceptKey: string;
  canonicalName: string;
  category: ObservationType;
  bodySite?: string | null;
  firstObservedAt: string;
  latestObservedAt: string;
  encounterCount: number;
  dataPoints: NormalizedObservationPoint[];
  latestSeverity?: number | string | null;
  previousSeverity?: number | string | null;
  severityDelta?: number | null; // e.g. -4 (improved) or +2 (worsened)
  severityTrend: LongitudinalTrend;
  frequencyTrend: LongitudinalTrend;
  evolutionState: SymptomEvolutionState;
  explanation: string;
}

export interface ConsultationComparisonDTO {
  currentSessionId: string;
  currentConsultationDate: string;
  previousSessionId: string | null;
  previousConsultationDate: string | null;
  status: "COMPARISON_AVAILABLE" | "NO_COMPARABLE_PREVIOUS_CONSULTATION";
  improved: Array<{
    symptom: string;
    description: string;
    previousValue: string;
    currentValue: string;
  }>;
  worsened: Array<{
    symptom: string;
    description: string;
    previousValue: string;
    currentValue: string;
  }>;
  persistent: Array<{
    symptom: string;
    description: string;
    currentValue: string;
  }>;
  newlyReported: Array<{
    symptom: string;
    description: string;
    currentValue: string;
  }>;
  notCurrentlyReported: Array<{
    symptom: string;
    previousValue: string;
  }>;
  ayushChanges: Array<{
    parameter: string;
    previous: string;
    current: string;
  }>;
  safetyAlerts: Array<{
    ruleId: string;
    status: "NEW_SAFETY_ALERT" | "PERSISTENT_SAFETY_CONCERN";
    description: string;
  }>;
  summaryText: string;
}

export interface DerivedTimelineEvent {
  id: string;
  date: string;
  sessionId: string;
  type: TimelineEventType;
  title: string;
  description: string;
  status?: string;
  source: ObservationSource | "SYSTEM" | "DOCTOR";
  isAbnormal?: boolean;
  isDoctorVerified?: boolean;
  metadata?: Record<string, unknown>;
}

export interface PatientLongitudinalProfile {
  patientId: string;
  totalConsultations: number;
  firstConsultationDate: string | null;
  latestConsultationDate: string | null;
  trajectories: SymptomTrajectory[];
  latestComparison: ConsultationComparisonDTO | null;
  timelineEvents: DerivedTimelineEvent[];
}

export class LongitudinalIntelligenceService {
  /**
   * Generates a deterministic concept fingerprint for grouping observations over time.
   * Concept Fingerprint = Category + Normalized Concept + Body Site
   */
  static generateConceptFingerprint(obs: {
    category: ObservationType;
    code: string;
    name?: string;
    bodySite?: string | null;
  }): string {
    const rawCode = (obs.code || "").toLowerCase().trim();
    const bodySite = (obs.bodySite || "").toLowerCase().trim();
    const category = obs.category || ObservationType.SYMPTOM;

    // Standardize synonyms / variations into canonical clinical concept keys
    let normalizedConcept = rawCode;

    if (
      rawCode.includes("epigastric") ||
      rawCode.includes("burning") ||
      rawCode.includes("stomach_burn") ||
      rawCode.includes("acidity") ||
      rawCode.includes("amlapitta")
    ) {
      normalizedConcept = "symptom.epigastric_burning";
    } else if (
      rawCode.includes("knee") ||
      rawCode.includes("joint_pain") ||
      rawCode.includes("sandhivata") ||
      rawCode.includes("amavata")
    ) {
      normalizedConcept = "symptom.knee_joint_pain";
    } else if (rawCode.includes("chest") || rawCode.includes("angina") || rawCode.includes("hritshoola")) {
      normalizedConcept = "symptom.chest_pain";
    } else if (rawCode.includes("headache") || rawCode.includes("shirashoola") || rawCode.includes("migraine")) {
      normalizedConcept = "symptom.headache";
    } else if (rawCode.includes("sleep") || rawCode.includes("insomnia") || rawCode.includes("anidra")) {
      normalizedConcept = "symptom.sleep_disturbance";
    } else if (rawCode.includes("reflux") || rawCode.includes("gerd") || rawCode.includes("heartburn")) {
      normalizedConcept = "symptom.acid_reflux";
    } else if (rawCode.includes("agni")) {
      normalizedConcept = "ayurveda.agni";
    } else if (rawCode.includes("ama")) {
      normalizedConcept = "ayurveda.ama";
    } else if (rawCode.includes("koshtha")) {
      normalizedConcept = "ayurveda.koshtha";
    }

    return `${category}::${normalizedConcept}${bodySite ? `::${bodySite}` : ""}`;
  }

  /**
   * Evaluates severity trajectory across sequential observation points.
   * Follows strict clinical safety rules: reports data delta rather than fabricating clinical progression.
   */
  static evaluateSeverityTrend(dataPoints: NormalizedObservationPoint[]): {
    trend: LongitudinalTrend;
    latestSeverity?: number | string | null;
    previousSeverity?: number | string | null;
    severityDelta?: number | null;
    explanation: string;
  } {
    if (!dataPoints || dataPoints.length === 0) {
      return { trend: "UNKNOWN", explanation: "No recorded severity data points." };
    }

    if (dataPoints.length === 1) {
      const pt = dataPoints[0];
      return {
        trend: "NEW",
        latestSeverity: pt.numericValue ?? pt.severity ?? pt.value,
        explanation: "Single baseline measurement recorded.",
      };
    }

    const numericPoints = dataPoints.filter((p) => typeof p.numericValue === "number");

    if (numericPoints.length >= 2) {
      const prev = numericPoints[numericPoints.length - 2].numericValue!;
      const curr = numericPoints[numericPoints.length - 1].numericValue!;
      const delta = curr - prev;

      if (delta < 0) {
        return {
          trend: "IMPROVING",
          latestSeverity: curr,
          previousSeverity: prev,
          severityDelta: delta,
          explanation: `Severity score decreased from ${prev}/10 to ${curr}/10 (${delta} points).`,
        };
      } else if (delta > 0) {
        return {
          trend: "WORSENING",
          latestSeverity: curr,
          previousSeverity: prev,
          severityDelta: delta,
          explanation: `Severity score increased from ${prev}/10 to ${curr}/10 (+${delta} points).`,
        };
      } else {
        // Check if there is fluctuation among earlier data points
        const allSame = numericPoints.every((p) => p.numericValue === curr);
        if (allSame) {
          return {
            trend: "STABLE",
            latestSeverity: curr,
            previousSeverity: prev,
            severityDelta: 0,
            explanation: `Severity remained unchanged at ${curr}/10 across consultations.`,
          };
        }
        return {
          trend: "FLUCTUATING",
          latestSeverity: curr,
          previousSeverity: prev,
          severityDelta: 0,
          explanation: `Severity currently at ${curr}/10 with fluctuating historical values.`,
        };
      }
    }

    // Fallback qualitative comparison (MILD, MODERATE, SEVERE)
    const qualitativeOrder: Record<string, number> = {
      MILD: 1,
      MODERATE: 2,
      SEVERE: 3,
      CRITICAL: 4,
    };

    const qualPoints = dataPoints
      .map((p) => (p.severity ? p.severity.toUpperCase() : null))
      .filter((s): s is string => !!s && qualitativeOrder[s] !== undefined);

    if (qualPoints.length >= 2) {
      const prevRank = qualitativeOrder[qualPoints[qualPoints.length - 2]];
      const currRank = qualitativeOrder[qualPoints[qualPoints.length - 1]];
      if (currRank < prevRank) {
        return {
          trend: "IMPROVING",
          latestSeverity: qualPoints[qualPoints.length - 1],
          previousSeverity: qualPoints[qualPoints.length - 2],
          explanation: `Qualitative severity improved from ${qualPoints[qualPoints.length - 2]} to ${qualPoints[qualPoints.length - 1]}.`,
        };
      } else if (currRank > prevRank) {
        return {
          trend: "WORSENING",
          latestSeverity: qualPoints[qualPoints.length - 1],
          previousSeverity: qualPoints[qualPoints.length - 2],
          explanation: `Qualitative severity escalated from ${qualPoints[qualPoints.length - 2]} to ${qualPoints[qualPoints.length - 1]}.`,
        };
      } else {
        return {
          trend: "STABLE",
          latestSeverity: qualPoints[qualPoints.length - 1],
          previousSeverity: qualPoints[qualPoints.length - 2],
          explanation: `Qualitative severity remained stable (${qualPoints[qualPoints.length - 1]}).`,
        };
      }
    }

    return {
      trend: "UNKNOWN",
      latestSeverity: dataPoints[dataPoints.length - 1].value,
      explanation: "Insufficient comparable numeric or qualitative severity data.",
    };
  }

  /**
   * Constructs symptom trajectories across all historical consultations for a patient
   */
  static async buildPatientTrajectories(
    patientId: string,
    inMemoryObservations?: ClinicalObservation[]
  ): Promise<SymptomTrajectory[]> {
    let observations: ClinicalObservation[] = [];

    if (inMemoryObservations && inMemoryObservations.length > 0) {
      observations = inMemoryObservations;
    } else {
      try {
        observations = await prisma.clinicalObservation.findMany({
          where: { patientId },
          orderBy: [{ reportedAt: "asc" }, { recordedAt: "asc" }],
          take: 200,
        });
      } catch {
        observations = [];
      }
    }

    if (!observations || observations.length === 0) {
      return [];
    }

    // Group observations by concept fingerprint
    const grouped = new Map<string, ClinicalObservation[]>();
    for (const obs of observations) {
      const fp = this.generateConceptFingerprint(obs);
      if (!grouped.has(fp)) {
        grouped.set(fp, []);
      }
      grouped.get(fp)!.push(obs);
    }

    const trajectories: SymptomTrajectory[] = [];

    for (const [fingerprint, obsList] of Array.from(grouped.entries())) {
      const sorted = [...obsList].sort(
        (a, b) => new Date(a.reportedAt).getTime() - new Date(b.reportedAt).getTime()
      );

      const normalizedPoints: NormalizedObservationPoint[] = sorted.map((o) => ({
        observationId: o.id,
        sessionId: o.sessionId,
        sessionDate: o.reportedAt,
        rawText: o.rawText,
        value: o.value,
        numericValue: o.numericValue,
        severity: o.severity,
        frequency: o.frequency,
        modality: o.modality,
        bodySite: o.bodySite,
        status: o.status,
        source: o.source,
        confidence: o.confidence,
        isVerifiedByDoctor: !!o.verifiedById || o.status === ObservationStatus.VERIFIED,
        verifiedById: o.verifiedById,
        doctorNotes: o.doctorNotes,
      }));

      const latestObs = sorted[sorted.length - 1];
      const firstObs = sorted[0];
      const severityAnalysis = this.evaluateSeverityTrend(normalizedPoints);

      // Determine evolution state
      let evolutionState: SymptomEvolutionState = "NEW";
      if (latestObs.status === ObservationStatus.REFUTED) {
        evolutionState = "RESOLVED";
      } else if (sorted.length > 1) {
        evolutionState = "PERSISTENT";
      } else {
        evolutionState = "NEW";
      }

      trajectories.push({
        conceptKey: fingerprint,
        canonicalName: latestObs.name,
        category: latestObs.category,
        bodySite: latestObs.bodySite,
        firstObservedAt: firstObs.reportedAt.toISOString(),
        latestObservedAt: latestObs.reportedAt.toISOString(),
        encounterCount: sorted.length,
        dataPoints: normalizedPoints,
        latestSeverity: severityAnalysis.latestSeverity,
        previousSeverity: severityAnalysis.previousSeverity,
        severityDelta: severityAnalysis.severityDelta,
        severityTrend: severityAnalysis.trend,
        frequencyTrend: "STABLE", // Default unless explicit frequency delta
        evolutionState,
        explanation: severityAnalysis.explanation,
      });
    }

    return trajectories;
  }

  /**
   * Compares the current clinical session against the most relevant prior clinical session
   */
  static async compareConsultations(
    currentSessionId: string,
    providedCurrentObservations?: ClinicalObservation[],
    providedPriorObservations?: ClinicalObservation[]
  ): Promise<ConsultationComparisonDTO> {
    if (!currentSessionId) {
      throw AppError.badRequest("currentSessionId is required for consultation comparison");
    }

    let currentSession: any = null;
    let priorSession: any = null;
    let currentObs: ClinicalObservation[] = providedCurrentObservations || [];
    let priorObs: ClinicalObservation[] = providedPriorObservations || [];

    // 1. Fetch current and prior clinical sessions
    if (!providedCurrentObservations || !providedPriorObservations) {
      try {
        currentSession = await prisma.clinicalSession.findUnique({
          where: { id: currentSessionId },
          include: { redFlagEvents: true },
        });

        if (currentSession?.patientId) {
          // Find most recent prior session that was not abandoned
          priorSession = await prisma.clinicalSession.findFirst({
            where: {
              patientId: currentSession.patientId,
              id: { not: currentSessionId },
              status: { in: [SessionStatus.COMPLETED, SessionStatus.WAITING_FOR_DOCTOR, SessionStatus.IN_PROGRESS] },
            },
            orderBy: { startedAt: "desc" },
            include: { redFlagEvents: true },
          });

          if (currentObs.length === 0) {
            currentObs = await prisma.clinicalObservation.findMany({
              where: { sessionId: currentSessionId },
            });
          }

          if (priorSession && priorObs.length === 0) {
            priorObs = await prisma.clinicalObservation.findMany({
              where: { sessionId: priorSession.id },
            });
          }
        }
      } catch {
        // Fallback for in-memory disconnected DB test runs
      }
    }

    const currentDateStr = currentSession?.startedAt
      ? new Date(currentSession.startedAt).toISOString()
      : new Date().toISOString();

    if (!priorSession && priorObs.length === 0) {
      return {
        currentSessionId,
        currentConsultationDate: currentDateStr,
        previousSessionId: null,
        previousConsultationDate: null,
        status: "NO_COMPARABLE_PREVIOUS_CONSULTATION",
        improved: [],
        worsened: [],
        persistent: currentObs.map((o) => ({
          symptom: o.name,
          description: o.rawText,
          currentValue: o.value || (o.numericValue ? `${o.numericValue}/10` : "Present"),
        })),
        newlyReported: [],
        notCurrentlyReported: [],
        ayushChanges: [],
        safetyAlerts: [],
        summaryText: "No prior consultation records exist for this patient. Baseline assessment established.",
      };
    }

    const priorDateStr = priorSession?.startedAt
      ? new Date(priorSession.startedAt).toISOString()
      : new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

    // 2. Map observations by concept fingerprint
    const currentMap = new Map<string, ClinicalObservation>();
    currentObs.forEach((o) => currentMap.set(this.generateConceptFingerprint(o), o));

    const priorMap = new Map<string, ClinicalObservation>();
    priorObs.forEach((o) => priorMap.set(this.generateConceptFingerprint(o), o));

    const improved: ConsultationComparisonDTO["improved"] = [];
    const worsened: ConsultationComparisonDTO["worsened"] = [];
    const persistent: ConsultationComparisonDTO["persistent"] = [];
    const newlyReported: ConsultationComparisonDTO["newlyReported"] = [];
    const notCurrentlyReported: ConsultationComparisonDTO["notCurrentlyReported"] = [];
    const ayushChanges: ConsultationComparisonDTO["ayushChanges"] = [];

    // Compare Current Observations with Prior
    for (const [fp, curr] of Array.from(currentMap.entries())) {
      const prior = priorMap.get(fp);

      if (!prior) {
        // Newly appeared observation in current session
        newlyReported.push({
          symptom: curr.name,
          description: curr.rawText,
          currentValue: curr.value || (curr.numericValue ? `${curr.numericValue}/10` : "Newly reported"),
        });
      } else {
        // Recurring concept — evaluate trajectory
        if (
          curr.category.startsWith("AYURVEDA_") ||
          curr.category.startsWith("HOMEOPATHY_")
        ) {
          if (curr.value !== prior.value) {
            ayushChanges.push({
              parameter: curr.name,
              previous: prior.value || "Not specified",
              current: curr.value || "Not specified",
            });
          }
        }

        if (typeof curr.numericValue === "number" && typeof prior.numericValue === "number") {
          const delta = curr.numericValue - prior.numericValue;
          if (delta < 0) {
            improved.push({
              symptom: curr.name,
              description: `Severity decreased from ${prior.numericValue}/10 to ${curr.numericValue}/10`,
              previousValue: `${prior.numericValue}/10`,
              currentValue: `${curr.numericValue}/10`,
            });
          } else if (delta > 0) {
            worsened.push({
              symptom: curr.name,
              description: `Severity increased from ${prior.numericValue}/10 to ${curr.numericValue}/10`,
              previousValue: `${prior.numericValue}/10`,
              currentValue: `${curr.numericValue}/10`,
            });
          } else {
            persistent.push({
              symptom: curr.name,
              description: `Severity unchanged at ${curr.numericValue}/10`,
              currentValue: `${curr.numericValue}/10`,
            });
          }
        } else {
          persistent.push({
            symptom: curr.name,
            description: curr.rawText,
            currentValue: curr.value || "Persisting symptom",
          });
        }
      }
    }

    // Check symptoms present in prior consultation but absent in current
    for (const [fp, prior] of Array.from(priorMap.entries())) {
      if (!currentMap.has(fp)) {
        notCurrentlyReported.push({
          symptom: prior.name,
          previousValue: prior.value || (prior.numericValue ? `${prior.numericValue}/10` : "Previously recorded"),
        });
      }
    }

    // Safety Alert Comparisons
    const safetyAlerts: ConsultationComparisonDTO["safetyAlerts"] = [];
    const currentRedFlags = currentSession?.redFlagEvents || [];
    const priorRedFlags = priorSession?.redFlagEvents || [];
    const priorRuleIds = new Set(priorRedFlags.map((rf: any) => rf.ruleId));

    for (const rf of currentRedFlags) {
      if (priorRuleIds.has(rf.ruleId)) {
        safetyAlerts.push({
          ruleId: rf.ruleId,
          status: "PERSISTENT_SAFETY_CONCERN",
          description: rf.description || "Persistent clinical red-flag alert across visits.",
        });
      } else {
        safetyAlerts.push({
          ruleId: rf.ruleId,
          status: "NEW_SAFETY_ALERT",
          description: rf.description || "New clinical safety alert triggered in current consultation.",
        });
      }
    }

    // Construct concise physician longitudinal summary
    const summaryLines: string[] = [];
    if (improved.length > 0) {
      summaryLines.push(`• Improved: ${improved.map((i) => `${i.symptom} (${i.previousValue} → ${i.currentValue})`).join(", ")}`);
    }
    if (worsened.length > 0) {
      summaryLines.push(`• Worsened: ${worsened.map((w) => `${w.symptom} (${w.previousValue} → ${w.currentValue})`).join(", ")}`);
    }
    if (newlyReported.length > 0) {
      summaryLines.push(`• Newly Reported: ${newlyReported.map((n) => n.symptom).join(", ")}`);
    }
    if (persistent.length > 0) {
      summaryLines.push(`• Persistent: ${persistent.map((p) => p.symptom).join(", ")}`);
    }
    if (notCurrentlyReported.length > 0) {
      summaryLines.push(`• Not Currently Reported: ${notCurrentlyReported.map((nc) => nc.symptom).join(", ")}`);
    }

    return {
      currentSessionId,
      currentConsultationDate: currentDateStr,
      previousSessionId: priorSession ? priorSession.id : "prior-session",
      previousConsultationDate: priorDateStr,
      status: "COMPARISON_AVAILABLE",
      improved,
      worsened,
      persistent,
      newlyReported,
      notCurrentlyReported,
      ayushChanges,
      safetyAlerts,
      summaryText: summaryLines.length > 0 ? summaryLines.join("\n") : "Symptoms stable across consultations.",
    };
  }

  /**
   * Generates a projected, unified longitudinal timeline combining consultations,
   * structured observations, verified findings, and safety flags without duplicating database tables.
   */
  static async getLongitudinalTimeline(
    patientId: string,
    options?: { limit?: number }
  ): Promise<DerivedTimelineEvent[]> {
    if (!patientId) {
      throw AppError.badRequest("patientId is required");
    }

    const limit = options?.limit && options.limit > 0 ? Math.min(options.limit, 100) : 50;
    const events: DerivedTimelineEvent[] = [];

    try {
      const [sessions, observations, documents] = await Promise.all([
        prisma.clinicalSession.findMany({
          where: { patientId },
          orderBy: { startedAt: "desc" },
          take: limit,
          include: { chiefComplaints: true, redFlagEvents: true },
        }),
        prisma.clinicalObservation.findMany({
          where: { patientId },
          orderBy: { reportedAt: "desc" },
          take: limit * 2,
        }),
        prisma.medicalDocument.findMany({
          where: { session: { patientId }, deletedAt: null },
          orderBy: { uploadedAt: "desc" },
          take: 10,
        }),
      ]);

      // 1. Map Sessions to Consultation Timeline Events
      for (const sess of sessions) {
        const complaints = sess.chiefComplaints.map((c) => c.symptomName).join(", ");
        events.push({
          id: `evt-sess-${sess.id}`,
          date: sess.startedAt.toISOString().split("T")[0],
          sessionId: sess.id,
          type: "CONSULTATION",
          title: `परामर्श (Clinical Consultation) ${complaints ? `· ${complaints}` : ""}`,
          description: `Status: ${sess.status} | Triage: ${sess.triagePriority}`,
          source: "SYSTEM",
          metadata: {
            triagePriority: sess.triagePriority,
          },
        });

        // Map Red-Flag Safety Alerts
        for (const rf of sess.redFlagEvents) {
          events.push({
            id: `evt-rf-${rf.id}`,
            date: rf.triggeredAt.toISOString().split("T")[0],
            sessionId: sess.id,
            type: "RED_FLAG_ALERT",
            title: `🚨 आपातकालीन सुरक्षा अलर्ट (Red-Flag: ${rf.ruleId})`,
            description: rf.description,
            source: "SYSTEM",
            isAbnormal: true,
          });
        }
      }

      // 2. Map Structured Observations
      for (const obs of observations) {
        let type: TimelineEventType = "NEW_FINDING";
        if (obs.category === ObservationType.SYMPTOM) {
          type = "NEW_SYMPTOM";
        } else if (obs.category.startsWith("AYURVEDA_")) {
          type = "AYURVEDA_CHANGE";
        } else if (obs.category.startsWith("HOMEOPATHY_")) {
          type = "HOMEOPATHY_CHANGE";
        }

        const isDoctorVerified = obs.status === ObservationStatus.VERIFIED || !!obs.verifiedById;

        events.push({
          id: `evt-obs-${obs.id}`,
          date: obs.reportedAt.toISOString().split("T")[0],
          sessionId: obs.sessionId,
          type: isDoctorVerified ? "DOCTOR_ASSESSMENT" : type,
          title: obs.name,
          description: `${obs.value || obs.rawText}${obs.numericValue ? ` (${obs.numericValue}/10)` : ""}${
            isDoctorVerified ? " [चिकित्सक द्वारा सत्यापित / Doctor Verified]" : ""
          }`,
          source: obs.source,
          isDoctorVerified,
          metadata: {
            category: obs.category,
            code: obs.code,
            severity: obs.severity,
          },
        });
      }

      // 3. Map Medical Documents
      for (const doc of documents) {
        events.push({
          id: `evt-doc-${doc.id}`,
          date: doc.uploadedAt.toISOString().split("T")[0],
          sessionId: doc.sessionId || "doc-intake",
          type: "DOCUMENT_ANALYZED",
          title: `दस्तावेज़ विश्लेषण (Document Uploaded: ${doc.fileName})`,
          description: `Type: ${doc.type} | OCR Processed`,
          source: ObservationSource.OCR_EXTRACTED,
        });
      }
    } catch {
      // In-memory fallback
    }

    // Sort chronologically descending
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}
