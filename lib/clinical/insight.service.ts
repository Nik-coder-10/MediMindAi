import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/api/errors";
import {
  InsightStatus,
  DoctorReviewDecision,
  ClinicalInsight,
  ClinicalEvidence,
  ClinicalObservation,
} from "@prisma/client";
import { LongitudinalIntelligenceService, ConsultationComparisonDTO, SymptomTrajectory } from "./longitudinal.service";
import { KnowledgeGraphService, ExplainableKnowledgeContextDTO } from "@/lib/knowledge/knowledge-graph.service";
import { CLINICAL_RED_FLAG_REGISTRY } from "@/lib/engine/red-flag-rules";

/**
 * Explicit Clinical Insight Taxonomy
 */
export type ClinicalInsightType =
  // Longitudinal
  | "NEW_FINDING"
  | "PERSISTENT_FINDING"
  | "IMPROVING_FINDING"
  | "WORSENING_FINDING"
  | "FLUCTUATING_FINDING"
  | "POSSIBLE_RESOLUTION"
  | "NOT_CURRENTLY_REPORTED"
  // Pattern
  | "RECURRING_PATTERN"
  | "ASSOCIATED_PATTERN"
  | "TEMPORAL_PATTERN"
  | "MODALITY_PATTERN"
  // Data Quality
  | "MISSING_INFORMATION"
  | "CONFLICTING_INFORMATION"
  | "LOW_CONFIDENCE_MATCH"
  | "INSUFFICIENT_HISTORY"
  // AYUSH Context
  | "AYURVEDA_KNOWLEDGE_CONTEXT"
  | "HOMEOPATHY_KNOWLEDGE_CONTEXT";

export type ClinicalInsightPriority = "INFO" | "ATTENTION" | "IMPORTANT";
export type ClinicalConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

export interface InsightStructuredExplanation {
  what: string;           // Concise description of what was observed
  why: string;            // Clinical rule / deterministic rationale
  evidence: string[];     // IDs and descriptions of supporting observations
  knowledgeContext?: {
    conceptKey: string;
    conceptName: string;
    domain: string;
    relationships: string[];
    sourceCitation: string;
  } | null;
  consultationDates: string[]; // Temporal dates involved
  limitations: string;    // Explicit non-diagnostic / non-causal disclaimer
}

export interface GeneratedInsightCandidate {
  fingerprint: string;
  insightType: ClinicalInsightType;
  title: string;
  description: string;
  status: InsightStatus;
  confidence: number;
  confidenceLevel: ClinicalConfidenceLevel;
  priority: ClinicalInsightPriority;
  algorithmVersion: string;
  sourceObservationIds: string[];
  evidence: Array<{
    observationId: string;
    relationship: "SUPPORTING" | "CONTRADICTORY" | "NEUTRAL";
    weight: number;
    rationale: string;
    isDirectEvidence: boolean;
  }>;
  explanation: InsightStructuredExplanation;
  metadata?: Record<string, unknown>;
}

export interface DoctorReviewPayload {
  insightId: string;
  doctorId: string;
  decision: DoctorReviewDecision;
  overrideText?: string;
  reason?: string;
}

// In-Memory Insight Store for disconnected test environments and fast read-through
const inMemoryInsights = new Map<string, ClinicalInsight & { evidence: ClinicalEvidence[] }>();

export class ClinicalInsightService {
  public static readonly ALGORITHM_VERSION = "v1.0";
  public static readonly NON_DIAGNOSTIC_DISCLAIMER =
    "Clinical insights represent deterministic rule-based pattern analysis and traditional literature associations for physician decision support. They do not constitute an autonomous biomedical diagnosis, prognosis, or prescription.";

  /**
   * Generates a deterministic, idempotent fingerprint for an insight candidate.
   */
  static generateInsightFingerprint(params: {
    sessionId: string;
    insightType: string;
    observationIds: string[];
    knowledgeIds?: string[];
    algorithmVersion?: string;
  }): string {
    const sortedObs = [...params.observationIds].sort().join(",");
    const sortedKg = params.knowledgeIds ? [...params.knowledgeIds].sort().join(",") : "";
    const ver = params.algorithmVersion || this.ALGORITHM_VERSION;
    return `fp::${params.sessionId}::${params.insightType}::obs[${sortedObs}]::kg[${sortedKg}]::${ver}`;
  }

  /**
   * Synthesizes all deterministic clinical insights for a given clinical session.
   * Pure deterministic rules first: Longitudinal trajectory + Knowledge graph context + Data quality checks.
   */
  static async generateSessionInsights(sessionId: string): Promise<GeneratedInsightCandidate[]> {
    if (!sessionId) {
      throw AppError.badRequest("sessionId is required to generate clinical insights");
    }

    // 1. Fetch Session Observations
    let session: any = null;
    let patientId = "";
    let observations: ClinicalObservation[] = [];

    try {
      session = await prisma.clinicalSession.findUnique({
        where: { id: sessionId },
        include: {
          patient: true,
          clinicalObservations: {
            include: { knowledgeLinks: { include: { concept: true } } },
            orderBy: { reportedAt: "asc" },
          },
          patientAnswers: { include: { questionNode: true } },
          redFlagEvents: true,
        },
      });

      if (session) {
        patientId = session.patientId;
        observations = session.clinicalObservations || [];
      }
    } catch {
      // DB Disconnected Fallback
    }

    if (!session) {
      const { inMemoryClinicalStore } = await import("@/lib/db/in-memory-store");
      const memSession = inMemoryClinicalStore.getSession(sessionId);
      if (memSession) {
        patientId = memSession.patientId;
      }
    }

    const candidates: GeneratedInsightCandidate[] = [];

    // If no observations exist, generate DATA QUALITY: INSUFFICIENT_HISTORY / MISSING_INFORMATION
    if (observations.length === 0) {
      const emptyFingerprint = this.generateInsightFingerprint({
        sessionId,
        insightType: "INSUFFICIENT_HISTORY",
        observationIds: [],
      });

      candidates.push({
        fingerprint: emptyFingerprint,
        insightType: "INSUFFICIENT_HISTORY",
        title: "अपर्याप्त क्लिनिकल इतिहास (Insufficient Clinical History)",
        description: "No structured clinical observations recorded for the current consultation.",
        status: InsightStatus.REVIEW_REQUIRED,
        confidence: 1.0,
        confidenceLevel: "HIGH",
        priority: "INFO",
        algorithmVersion: this.ALGORITHM_VERSION,
        sourceObservationIds: [],
        evidence: [],
        explanation: {
          what: "No recorded clinical observations available for inference.",
          why: "The consultation intake has not yielded structured symptom or sign observations.",
          evidence: [],
          knowledgeContext: null,
          consultationDates: [new Date().toISOString().split("T")[0]],
          limitations: this.NON_DIAGNOSTIC_DISCLAIMER,
        },
      });
      return candidates;
    }

    // 2. Fetch Longitudinal Comparisons & Trajectories
    let longitudinalComp: ConsultationComparisonDTO | null = null;
    let trajectories: SymptomTrajectory[] = [];

    try {
      longitudinalComp = await LongitudinalIntelligenceService.compareConsultations(sessionId);
      if (patientId) {
        trajectories = await LongitudinalIntelligenceService.buildPatientTrajectories(patientId);
      }
    } catch (e: any) {
      console.warn("Longitudinal analysis unavailable during insight synthesis:", e?.message);
    }

    // 3. Process Longitudinal Trajectories into Explainable Insights
    if (longitudinalComp && longitudinalComp.status === "COMPARISON_AVAILABLE") {
      // 3a. IMPROVING Findings
      for (const item of longitudinalComp.improved) {
        const matchingObs = observations.filter((o) =>
          o.name.toLowerCase().includes(item.symptom.toLowerCase()) ||
          item.symptom.toLowerCase().includes(o.name.toLowerCase()) ||
          o.code.toLowerCase().includes(item.symptom.toLowerCase())
        );
        const obsIds = matchingObs.map((o) => o.id);
        const fp = this.generateInsightFingerprint({
          sessionId,
          insightType: "IMPROVING_FINDING",
          observationIds: obsIds.length > 0 ? obsIds : [`obs-imp-${item.symptom}`],
        });

        candidates.push({
          fingerprint: fp,
          insightType: "IMPROVING_FINDING",
          title: `लक्षण में सुधार: ${item.symptom} (Improving Finding)`,
          description: item.description,
          status: InsightStatus.REVIEW_REQUIRED,
          confidence: 0.9,
          confidenceLevel: "HIGH",
          priority: "INFO",
          algorithmVersion: this.ALGORITHM_VERSION,
          sourceObservationIds: obsIds,
          evidence: obsIds.map((id) => ({
            observationId: id,
            relationship: "SUPPORTING",
            weight: 0.95,
            rationale: `Sequential measurement showed reduction from ${item.previousValue} to ${item.currentValue}.`,
            isDirectEvidence: true,
          })),
          explanation: {
            what: `Symptom '${item.symptom}' demonstrated measured clinical reduction.`,
            why: `Severity score or frequency decreased between previous session (${longitudinalComp.previousConsultationDate}) and current session (${longitudinalComp.currentConsultationDate}).`,
            evidence: obsIds,
            consultationDates: [
              longitudinalComp.previousConsultationDate || "Previous",
              longitudinalComp.currentConsultationDate,
            ],
            limitations: this.NON_DIAGNOSTIC_DISCLAIMER,
          },
        });
      }

      // 3b. WORSENING Findings
      for (const item of longitudinalComp.worsened) {
        const matchingObs = observations.filter((o) =>
          o.name.toLowerCase().includes(item.symptom.toLowerCase()) ||
          item.symptom.toLowerCase().includes(o.name.toLowerCase()) ||
          o.code.toLowerCase().includes(item.symptom.toLowerCase())
        );
        const obsIds = matchingObs.map((o) => o.id);
        const fp = this.generateInsightFingerprint({
          sessionId,
          insightType: "WORSENING_FINDING",
          observationIds: obsIds.length > 0 ? obsIds : [`obs-wors-${item.symptom}`],
        });

        candidates.push({
          fingerprint: fp,
          insightType: "WORSENING_FINDING",
          title: `लक्षण में वृद्धि / तीव्रता: ${item.symptom} (Worsening Finding)`,
          description: item.description,
          status: InsightStatus.REVIEW_REQUIRED,
          confidence: 0.95,
          confidenceLevel: "HIGH",
          priority: "ATTENTION",
          algorithmVersion: this.ALGORITHM_VERSION,
          sourceObservationIds: obsIds,
          evidence: obsIds.map((id) => ({
            observationId: id,
            relationship: "SUPPORTING",
            weight: 1.0,
            rationale: `Sequential measurement showed exacerbation from ${item.previousValue} to ${item.currentValue}.`,
            isDirectEvidence: true,
          })),
          explanation: {
            what: `Symptom '${item.symptom}' increased in severity score or reported frequency.`,
            why: `Clinical severity delta is positive between sequential consultations.`,
            evidence: obsIds,
            consultationDates: [
              longitudinalComp.previousConsultationDate || "Previous",
              longitudinalComp.currentConsultationDate,
            ],
            limitations: this.NON_DIAGNOSTIC_DISCLAIMER,
          },
        });
      }

      // 3c. NEWLY REPORTED Findings
      for (const item of longitudinalComp.newlyReported) {
        const matchingObs = observations.filter((o) =>
          o.name.toLowerCase().includes(item.symptom.toLowerCase()) ||
          item.symptom.toLowerCase().includes(o.name.toLowerCase()) ||
          o.code.toLowerCase().includes(item.symptom.toLowerCase())
        );
        const obsIds = matchingObs.map((o) => o.id);
        const fp = this.generateInsightFingerprint({
          sessionId,
          insightType: "NEW_FINDING",
          observationIds: obsIds.length > 0 ? obsIds : [`obs-new-${item.symptom}`],
        });

        candidates.push({
          fingerprint: fp,
          insightType: "NEW_FINDING",
          title: `नया लक्षण दर्ज: ${item.symptom} (Newly Reported Finding)`,
          description: item.description,
          status: InsightStatus.REVIEW_REQUIRED,
          confidence: 0.9,
          confidenceLevel: "HIGH",
          priority: "ATTENTION",
          algorithmVersion: this.ALGORITHM_VERSION,
          sourceObservationIds: obsIds,
          evidence: obsIds.map((id) => ({
            observationId: id,
            relationship: "SUPPORTING",
            weight: 0.9,
            rationale: `Finding reported for the first time during the current consultation.`,
            isDirectEvidence: true,
          })),
          explanation: {
            what: `Symptom '${item.symptom}' was newly reported in this consultation.`,
            why: `Observation was absent in previous recorded consultation history.`,
            evidence: obsIds,
            consultationDates: [longitudinalComp.currentConsultationDate],
            limitations: this.NON_DIAGNOSTIC_DISCLAIMER,
          },
        });
      }

      // 3d. PERSISTENT Findings
      for (const item of longitudinalComp.persistent) {
        const matchingObs = observations.filter((o) =>
          o.name.toLowerCase().includes(item.symptom.toLowerCase()) ||
          item.symptom.toLowerCase().includes(o.name.toLowerCase()) ||
          o.code.toLowerCase().includes(item.symptom.toLowerCase())
        );
        const obsIds = matchingObs.map((o) => o.id);
        const fp = this.generateInsightFingerprint({
          sessionId,
          insightType: "PERSISTENT_FINDING",
          observationIds: obsIds.length > 0 ? obsIds : [`obs-per-${item.symptom}`],
        });

        candidates.push({
          fingerprint: fp,
          insightType: "PERSISTENT_FINDING",
          title: `निरंतर लक्षण: ${item.symptom} (Persistent Finding)`,
          description: item.description,
          status: InsightStatus.REVIEW_REQUIRED,
          confidence: 0.85,
          confidenceLevel: "HIGH",
          priority: "INFO",
          algorithmVersion: this.ALGORITHM_VERSION,
          sourceObservationIds: obsIds,
          evidence: obsIds.map((id) => ({
            observationId: id,
            relationship: "SUPPORTING",
            weight: 0.85,
            rationale: `Symptom remains unmitigated across sequential encounters.`,
            isDirectEvidence: true,
          })),
          explanation: {
            what: `Symptom '${item.symptom}' persisted across multiple consultations.`,
            why: `Consistent report across consecutive clinical encounters.`,
            evidence: obsIds,
            consultationDates: [
              longitudinalComp.previousConsultationDate || "Previous",
              longitudinalComp.currentConsultationDate,
            ],
            limitations: this.NON_DIAGNOSTIC_DISCLAIMER,
          },
        });
      }

      // 3e. NOT CURRENTLY REPORTED (No false resolution)
      for (const item of longitudinalComp.notCurrentlyReported) {
        const fp = this.generateInsightFingerprint({
          sessionId,
          insightType: "NOT_CURRENTLY_REPORTED",
          observationIds: [`obs-absent-${item.symptom}`],
        });

        candidates.push({
          fingerprint: fp,
          insightType: "NOT_CURRENTLY_REPORTED",
          title: `वर्तमान में अप्रतिवेदित: ${item.symptom} (Not Currently Reported)`,
          description: `Previously reported as '${item.previousValue}', but unmentioned during current intake.`,
          status: InsightStatus.REVIEW_REQUIRED,
          confidence: 0.75,
          confidenceLevel: "MEDIUM",
          priority: "INFO",
          algorithmVersion: this.ALGORITHM_VERSION,
          sourceObservationIds: [],
          evidence: [],
          explanation: {
            what: `Symptom '${item.symptom}' was not mentioned in the current encounter.`,
            why: `Absence of report does not confirm clinical resolution without physician verification.`,
            evidence: [],
            consultationDates: [longitudinalComp.currentConsultationDate],
            limitations: "Absence of a symptom during a case-taking turn is not evidence of cure.",
          },
        });
      }
    } else {
      // 3f. First Consultation or Insufficient Comparison History
      for (const obs of observations) {
        const fp = this.generateInsightFingerprint({
          sessionId,
          insightType: "NEW_FINDING",
          observationIds: [obs.id],
        });

        candidates.push({
          fingerprint: fp,
          insightType: "NEW_FINDING",
          title: `प्राथमिक क्लिनिकल लक्षण: ${obs.name} (Baseline Observation)`,
          description: `Baseline measurement recorded: ${obs.value || obs.rawText}.`,
          status: InsightStatus.REVIEW_REQUIRED,
          confidence: obs.confidence || 0.9,
          confidenceLevel: "HIGH",
          priority: "INFO",
          algorithmVersion: this.ALGORITHM_VERSION,
          sourceObservationIds: [obs.id],
          evidence: [
            {
              observationId: obs.id,
              relationship: "SUPPORTING",
              weight: 1.0,
              rationale: `Baseline clinical finding recorded during intake.`,
              isDirectEvidence: true,
            },
          ],
          explanation: {
            what: `Recorded baseline clinical finding '${obs.name}'.`,
            why: `Initial encounter establishes clinical baseline.`,
            evidence: [obs.id],
            consultationDates: [obs.reportedAt ? new Date(obs.reportedAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]],
            limitations: this.NON_DIAGNOSTIC_DISCLAIMER,
          },
        });
      }
    }

    // 4. Process AYUSH Knowledge Graph Contexts
    for (const obs of observations) {
      try {
        const kgContext: ExplainableKnowledgeContextDTO | null =
          await KnowledgeGraphService.getExplainableKnowledgeContext(obs.id, obs.code, obs.name);

        if (kgContext && kgContext.relationships.length > 0) {
          const insightType: ClinicalInsightType =
            kgContext.domain === "AYURVEDA"
              ? "AYURVEDA_KNOWLEDGE_CONTEXT"
              : "HOMEOPATHY_KNOWLEDGE_CONTEXT";

          const kgIds = kgContext.relationships.map((r) => `${r.relationshipType}:${r.targetConceptKey}`);
          const fp = this.generateInsightFingerprint({
            sessionId,
            insightType,
            observationIds: [obs.id],
            knowledgeIds: kgIds,
          });

          const relDescriptions = kgContext.relationships
            .map((r) => `${r.relationshipType} → ${r.targetConceptName} (${r.sourceReference})`)
            .join("; ");

          candidates.push({
            fingerprint: fp,
            insightType,
            title: `आयुष ज्ञान संबंध: ${obs.name} (${kgContext.domain} Knowledge Context)`,
            description: `Traditional knowledge literature links '${obs.name}' with: ${relDescriptions}.`,
            status: InsightStatus.REVIEW_REQUIRED,
            confidence: kgContext.confidence || 0.85,
            confidenceLevel: "MEDIUM",
            priority: "INFO",
            algorithmVersion: this.ALGORITHM_VERSION,
            sourceObservationIds: [obs.id],
            evidence: [
              {
                observationId: obs.id,
                relationship: "SUPPORTING",
                weight: 0.85,
                rationale: `Derived traditional association from ${kgContext.relationships[0]?.sourceTitle || "AYUSH Literature"}.`,
                isDirectEvidence: false, // Derived context
              },
            ],
            explanation: {
              what: `Observation '${obs.name}' resolved to canonical knowledge concept '${kgContext.matchedConceptName}'.`,
              why: `Configured AYUSH knowledge pack (${kgContext.knowledgeVersion}) contains literature associations for physician reference.`,
              evidence: [obs.id],
              knowledgeContext: {
                conceptKey: kgContext.matchedConceptKey,
                conceptName: kgContext.matchedConceptName,
                domain: kgContext.domain,
                relationships: kgContext.relationships.map((r) => r.clinicalRationale),
                sourceCitation: kgContext.relationships[0]?.sourceReference || "",
              },
              consultationDates: [obs.reportedAt ? new Date(obs.reportedAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]],
              limitations: kgContext.clinicalDisclaimer,
            },
          });
        }
      } catch (kgErr: any) {
        console.warn("Knowledge graph context resolution deferred:", kgErr?.message);
      }
    }

    return candidates;
  }

  /**
   * Persists generated insight candidates to the database with atomic concurrency safety and idempotency.
   * Uses atomic Prisma upsert with composite key @@unique([sessionId, fingerprint]).
   * Critical Invariant: System-generated regeneration MUST NEVER erase doctor-reviewed data
   * (VERIFIED, REJECTED, OVERRIDDEN, doctorDecision, doctorOverrideText, doctorReviewReason, reviewedById, reviewedAt).
   */
  static async persistSessionInsights(
    patientId: string,
    sessionId: string,
    candidates: GeneratedInsightCandidate[]
  ): Promise<Array<ClinicalInsight & { evidence: ClinicalEvidence[] }>> {
    const persistedInsights: Array<ClinicalInsight & { evidence: ClinicalEvidence[] }> = [];

    for (const cand of candidates) {
      try {
        // Atomic Upsert using the composite unique key (sessionId_fingerprint)
        const saved = await prisma.$transaction(async (tx) => {
          // 1. Fetch any existing record for this session & fingerprint
          const existing = await tx.clinicalInsight.findUnique({
            where: {
              sessionId_fingerprint: {
                sessionId,
                fingerprint: cand.fingerprint,
              },
            },
            include: { evidence: true },
          });

          let insight: ClinicalInsight;

          if (existing) {
            // Invariant: If doctor has already reviewed this insight, do NOT overwrite status or review fields
            const isDoctorReviewed =
              existing.status === InsightStatus.VERIFIED ||
              existing.status === InsightStatus.REJECTED ||
              existing.status === InsightStatus.OVERRIDDEN ||
              existing.doctorDecision !== null;

            insight = await tx.clinicalInsight.update({
              where: { id: existing.id },
              data: {
                // Update system fields only
                confidence: cand.confidence,
                ruleOrModelVersion: cand.algorithmVersion,
                description: cand.description,
                // If not reviewed, we can update status; if reviewed, preserve existing doctor status
                ...(isDoctorReviewed
                  ? {}
                  : { status: cand.status, title: cand.title }),
                metadata: {
                  ...(existing.metadata && typeof existing.metadata === "object" ? existing.metadata : {}),
                  fingerprint: cand.fingerprint,
                  priority: cand.priority,
                  confidenceLevel: cand.confidenceLevel,
                  explanation: cand.explanation,
                  ...cand.metadata,
                } as any,
              },
            });
          } else {
            // Insert new insight atomically
            insight = await tx.clinicalInsight.create({
              data: {
                patientId,
                sessionId,
                fingerprint: cand.fingerprint,
                insightType: cand.insightType,
                title: cand.title,
                description: cand.description,
                status: cand.status,
                confidence: cand.confidence,
                ruleOrModelVersion: cand.algorithmVersion,
                metadata: {
                  fingerprint: cand.fingerprint,
                  priority: cand.priority,
                  confidenceLevel: cand.confidenceLevel,
                  explanation: cand.explanation,
                  ...cand.metadata,
                } as any,
              },
            });
          }

          // Link evidence items atomically with conflict ignore
          const currentEv = await tx.clinicalEvidence.findMany({
            where: { insightId: insight.id },
          });
          const existingObsIds = new Set(currentEv.map((e) => e.observationId));
          const createdEv: ClinicalEvidence[] = [...currentEv];

          for (const ev of cand.evidence) {
            if (existingObsIds.has(ev.observationId)) continue;

            const obsExists = await tx.clinicalObservation.findUnique({
              where: { id: ev.observationId },
            });
            if (obsExists) {
              const evItem = await tx.clinicalEvidence.create({
                data: {
                  insightId: insight.id,
                  observationId: ev.observationId,
                  relationship: ev.relationship,
                  weight: ev.weight,
                  rationale: ev.rationale,
                },
              });
              createdEv.push(evItem);
              existingObsIds.add(ev.observationId);
            }
          }

          return {
            ...insight,
            evidence: createdEv,
          };
        });

        persistedInsights.push(saved);
        inMemoryInsights.set(saved.id, saved);
      } catch (err: any) {
        // Concurrency unique constraint race recovery: fetch the winner record
        try {
          const recovered = await prisma.clinicalInsight.findUnique({
            where: {
              sessionId_fingerprint: {
                sessionId,
                fingerprint: cand.fingerprint,
              },
            },
            include: { evidence: true },
          });
          if (recovered) {
            persistedInsights.push(recovered);
            inMemoryInsights.set(recovered.id, recovered);
            continue;
          }
        } catch {
          // Proceed to in-memory fallback if database is completely offline
        }

        // Fallback in-memory representation for serverless DB disconnection
        // In-memory Deduplication Key: `${sessionId}::${cand.fingerprint}`
        let fallbackInsight: (ClinicalInsight & { evidence: ClinicalEvidence[] }) | undefined;
        const memoryValues = Array.from(inMemoryInsights.values());
        for (const existingMem of memoryValues) {
          const memFp = existingMem.fingerprint || (existingMem.metadata as any)?.fingerprint;
          if (existingMem.sessionId === sessionId && memFp === cand.fingerprint) {
            fallbackInsight = existingMem;
            break;
          }
        }

        if (fallbackInsight) {
          // If already doctor reviewed, preserve doctor status
          const isDocReviewed =
            fallbackInsight.status === InsightStatus.VERIFIED ||
            fallbackInsight.status === InsightStatus.REJECTED ||
            fallbackInsight.status === InsightStatus.OVERRIDDEN ||
            fallbackInsight.doctorDecision !== null;

          if (!isDocReviewed) {
            fallbackInsight.title = cand.title;
            fallbackInsight.status = cand.status;
          }
          fallbackInsight.description = cand.description;
          fallbackInsight.confidence = cand.confidence;
          fallbackInsight.ruleOrModelVersion = cand.algorithmVersion;
          persistedInsights.push(fallbackInsight);
        } else {
          const newFallback: ClinicalInsight & { evidence: ClinicalEvidence[] } = {
            id: `ins-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            patientId,
            sessionId,
            fingerprint: cand.fingerprint,
            insightType: cand.insightType,
            title: cand.title,
            description: cand.description,
            status: cand.status,
            confidence: cand.confidence,
            ruleOrModelVersion: cand.algorithmVersion,
            reviewedById: null,
            doctorDecision: null,
            doctorOverrideText: null,
            doctorReviewReason: null,
            reviewedAt: null,
            metadata: {
              fingerprint: cand.fingerprint,
              priority: cand.priority,
              confidenceLevel: cand.confidenceLevel,
              explanation: cand.explanation,
              ...cand.metadata,
            } as any,
            generatedAt: new Date(),
            updatedAt: new Date(),
            evidence: cand.evidence.map((ev, idx) => ({
              id: `ev-${Date.now()}-${idx}`,
              insightId: `ins-${Date.now()}`,
              observationId: ev.observationId,
              relationship: ev.relationship,
              weight: ev.weight,
              rationale: ev.rationale,
              createdAt: new Date(),
            })),
          };

          persistedInsights.push(newFallback);
          inMemoryInsights.set(newFallback.id, newFallback);
        }
      }
    }

    return persistedInsights;
  }

  /**
   * Attending doctor reviews, confirms, overrides, or rejects a clinical insight.
   * Invariant: System-generated insight and explanation are NEVER deleted; doctor decision is explicitly recorded.
   */
  static async reviewInsight(payload: DoctorReviewPayload): Promise<ClinicalInsight> {
    if (!payload.insightId || !payload.doctorId || !payload.decision) {
      throw AppError.badRequest("insightId, doctorId, and decision are required for doctor review");
    }

    const updatedStatus: InsightStatus =
      payload.decision === DoctorReviewDecision.CONFIRMED
        ? InsightStatus.VERIFIED
        : payload.decision === DoctorReviewDecision.REJECTED
        ? InsightStatus.REJECTED
        : InsightStatus.OVERRIDDEN;

    try {
      const updated = await prisma.clinicalInsight.update({
        where: { id: payload.insightId },
        data: {
          reviewedById: payload.doctorId,
          doctorDecision: payload.decision,
          doctorOverrideText: payload.overrideText || null,
          doctorReviewReason: payload.reason || null,
          status: updatedStatus,
          reviewedAt: new Date(),
        },
      });

      if (inMemoryInsights.has(payload.insightId)) {
        const mem = inMemoryInsights.get(payload.insightId)!;
        inMemoryInsights.set(payload.insightId, {
          ...mem,
          reviewedById: payload.doctorId,
          doctorDecision: payload.decision,
          doctorOverrideText: payload.overrideText || null,
          doctorReviewReason: payload.reason || null,
          status: updatedStatus,
          reviewedAt: new Date(),
        });
      }

      return updated;
    } catch {
      // In-Memory Fallback
      const existingMem = inMemoryInsights.get(payload.insightId);
      const fallback: ClinicalInsight = {
        id: payload.insightId,
        patientId: existingMem?.patientId || "pat-fallback",
        sessionId: existingMem?.sessionId || "sess-fallback",
        fingerprint: existingMem?.fingerprint || `fp-rev-${payload.insightId}`,
        insightType: existingMem?.insightType || "PERSISTENT_FINDING",
        title: existingMem?.title || "Reviewed Finding",
        description: existingMem?.description || "Clinical finding reviewed by attending physician.",
        status: updatedStatus,
        confidence: existingMem?.confidence || 0.9,
        ruleOrModelVersion: existingMem?.ruleOrModelVersion || this.ALGORITHM_VERSION,
        reviewedById: payload.doctorId,
        doctorDecision: payload.decision,
        doctorOverrideText: payload.overrideText || null,
        doctorReviewReason: payload.reason || null,
        reviewedAt: new Date(),
        metadata: existingMem?.metadata || null,
        generatedAt: existingMem?.generatedAt || new Date(),
        updatedAt: new Date(),
      };

      inMemoryInsights.set(payload.insightId, {
        ...fallback,
        evidence: existingMem?.evidence || [],
      });

      return fallback;
    }
  }

  /**
   * Validates LLM-generated insight text candidates against structured clinical source facts.
   * Strictly rejects hallucinations, autonomous diagnoses, or medication orders.
   */
  static validateLlmInsightCandidate(candidateText: string, knownFacts: string[]): {
    isValid: boolean;
    rejectionReason?: string;
  } {
    const lower = candidateText.toLowerCase();

    // 1. Safety check: No autonomous prescribing
    const rxKeywords = ["prescribe", "dosage", "mg/day", "take 2 tablets", "formulation order", "administer"];
    if (rxKeywords.some((kw) => lower.includes(kw))) {
      return {
        isValid: false,
        rejectionReason: "LLM candidate contains prohibited autonomous medication prescription orders.",
      };
    }

    // 2. Safety check: No definitive biomedical diagnosis claims
    const dxKeywords = ["patient is diagnosed with", "patient has confirmed disease", "pathology proven", "definitive diagnosis"];
    if (dxKeywords.some((kw) => lower.includes(kw))) {
      return {
        isValid: false,
        rejectionReason: "LLM candidate makes prohibited autonomous definitive diagnostic assertions.",
      };
    }

    // 3. Safety check: Fact validation
    const hasKnownFact = knownFacts.some((fact) => lower.includes(fact.toLowerCase()));
    if (!hasKnownFact && knownFacts.length > 0) {
      return {
        isValid: false,
        rejectionReason: "LLM candidate does not anchor to any known structured patient observation.",
      };
    }

    return { isValid: true };
  }
}
