/**
 * Uncertainty-Driven Adaptive Question Engine Orchestrator
 * Phase 6: Uncertainty-Driven Adaptive Question Engine
 * SIH 2026 Problem Statement 26047 - AyurSetu / MediMindAi
 *
 * Coordinates:
 * Patient Case State -> Uncertainty Analysis -> Redundancy Filter -> Fatigue Check -> Ranked Next Question
 *
 * Implements deterministic SHA-256 state fingerprinting and recalculation after every answer.
 */

import { createHash } from "crypto";
import { prisma } from "@/lib/db/prisma";
import { inMemoryClinicalStore } from "@/lib/db/in-memory-store";
import { ClinicalObservation, ClinicalSession } from "@prisma/client";
import {
  ClinicalIntakeMode,
  UncertaintyEngineEvaluation,
  RecommendedQuestion,
  StopCondition,
} from "./uncertainty.types";
import { UncertaintyService } from "./uncertainty.service";
import { CandidateQuestionInput, QuestionRankingService } from "./question-ranking.service";
import { QuestionFatigueGuard } from "./fatigue.service";
import { AdaptiveQuestionGenerator } from "../engine/adaptive-question-generator";
import { ClinicalObservationService } from "./observation.service";

// Cache evaluations in-memory for serverless DB disconnection & instant replay
const evaluationCache: Map<string, UncertaintyEngineEvaluation> = new Map();

export interface EngineRunOptions {
  sessionId: string;
  patientId?: string;
  chiefComplaint?: string;
  category?: string;
  mode?: ClinicalIntakeMode;
  language?: "hi" | "en";
  hasActiveCriticalRedFlag?: boolean;
}

export class UncertaintyDrivenQuestionEngine {
  public static readonly ALGORITHM_VERSION = "v1.0.0-phase6";

  /**
   * Generates a deterministic SHA-256 fingerprint of the current evaluation inputs
   */
  static generateEvaluationFingerprint(params: {
    sessionId: string;
    answeredQuestionIds: string[];
    observationIds: string[];
    completenessRatio: number;
    mode: string;
  }): string {
    const payload = JSON.stringify({
      version: this.ALGORITHM_VERSION,
      sessionId: params.sessionId,
      mode: params.mode,
      answered: [...params.answeredQuestionIds].sort(),
      observations: [...params.observationIds].sort(),
      completeness: params.completenessRatio,
    });
    return createHash("sha256").update(payload).digest("hex");
  }

  /**
   * Main evaluation pipeline: recalculates information gaps and recommends next-best question
   */
  static async evaluateSession(options: EngineRunOptions): Promise<UncertaintyEngineEvaluation> {
    const { sessionId } = options;
    const mode: ClinicalIntakeMode = options.mode || "AYURVEDA";

    // 1. Resolve Session, Observations, and Engine State
    let session: (ClinicalSession & { chiefComplaints?: any[]; observations?: ClinicalObservation[] }) | null = null;
    let observations: ClinicalObservation[] = [];
    let chiefComplaintText = options.chiefComplaint || "";
    let complaintCategory = options.category || "General";

    try {
      session = await prisma.clinicalSession.findUnique({
        where: { id: sessionId },
        include: { chiefComplaints: true },
      });
      if (session) {
        if (!chiefComplaintText && session.chiefComplaints && session.chiefComplaints.length > 0) {
          chiefComplaintText = session.chiefComplaints[0].symptomName;
        }
      }
      observations = await ClinicalObservationService.getSessionObservations(sessionId);
    } catch {
      // In-memory fallback
    }

    // Check in-memory store if DB query returned empty
    if (observations.length === 0) {
      const memAnswers = inMemoryClinicalStore.getAnswers(sessionId);
      if (memAnswers.length > 0) {
        const now = new Date();
        // Synthesize discrete observations from in-memory answers for evaluation
        observations = memAnswers.map((a, idx) => ({
          id: `obs-mem-${idx}`,
          patientId: session?.patientId || "pat-mem",
          sessionId,
          category: "SYMPTOM" as any,
          code: a.nodeCode,
          name: a.nodeCode,
          value: typeof a.answerValue === "string" ? a.answerValue : JSON.stringify(a.answerValue),
          numericValue: typeof a.answerValue === "number" ? a.answerValue : null,
          unit: null,
          bodySite: null,
          laterality: null,
          severity: null,
          duration: null,
          frequency: null,
          modality: null,
          rawText: String(a.answerValue),
          status: "RECORDED" as any,
          source: "PATIENT_INPUT" as any,
          confidence: 1.0,
          observedAt: now,
          reportedAt: now,
          recordedAt: now,
          verifiedAt: null,
          sourceQuestionNodeId: a.nodeCode,
          sourceDocumentId: null,
          sourceEntityId: null,
          fingerprint: `fp-${a.nodeCode}`,
          metadata: null,
          verifiedById: null,
          doctorNotes: null,
          createdAt: now,
          updatedAt: now,
        }));
      }
    }

    // If still no chief complaint, check in-memory store
    if (!chiefComplaintText) {
      chiefComplaintText = "Generalized clinical consultation";
    }

    // 2. Fetch answered questions from EngineState
    const answeredQuestionIds = new Set<string>();
    const answeredValues: Record<string, unknown> = {};
    const questionHistory: Array<{ questionId: string; dimension?: any; facetKey?: string }> = [];

    try {
      const engineState = await prisma.engineState.findUnique({
        where: { sessionId },
      });
      if (engineState) {
        const facts = engineState.collectedFacts as any;
        if (facts && facts.answers) {
          Object.keys(facts.answers).forEach((k) => {
            answeredQuestionIds.add(k);
            answeredValues[k] = facts.answers[k];
            questionHistory.push({ questionId: k, facetKey: k });
          });
        }
      }
    } catch {}

    // Include in-memory answers in answeredQuestionIds
    const memAns = inMemoryClinicalStore.getAnswers(sessionId);
    for (const a of memAns) {
      answeredQuestionIds.add(a.nodeCode);
      answeredValues[a.nodeCode] = a.answerValue;
      if (!questionHistory.some((q) => q.questionId === a.nodeCode)) {
        questionHistory.push({ questionId: a.nodeCode, facetKey: a.nodeCode });
      }
    }

    // 3. Run Uncertainty & Completeness Analysis
    const completeness = UncertaintyService.evaluateCompleteness({
      sessionId,
      chiefComplaint: chiefComplaintText,
      category: complaintCategory,
      mode,
      observations,
      answeredQuestionIds,
      answeredValues,
    });

    // 4. Synthesize Candidate Questions via Adaptive Generator
    const dynamicGen = await AdaptiveQuestionGenerator.generateQuestions({
      chiefComplaint: chiefComplaintText,
      language: options.language || "hi",
      intakeMode: mode === "HOMEOPATHY" ? "GENERAL" : mode,
      sessionId,
    });

    const candidates: CandidateQuestionInput[] = dynamicGen.questions.map((q) => {
      let dim: any = "COMPLAINT_CHARACTERIZATION";
      let isRf = false;

      if (q.clinicalPurpose === "severity") dim = "SEVERITY";
      else if (q.clinicalPurpose === "location") dim = "LOCATION";
      else if (q.clinicalPurpose === "onset") dim = "TEMPORAL_HISTORY";
      else if (q.clinicalPurpose === "associated") dim = "ASSOCIATED_SYMPTOMS";
      else if (q.clinicalPurpose === "red_flag") {
        dim = "NEGATIVE_SAFETY_FINDINGS";
        isRf = true;
      } else if (q.clinicalPurpose === "history") dim = "PAST_MEDICAL_HISTORY";
      else if (q.clinicalPurpose === "family_history") dim = "FAMILY_HISTORY";
      else if (q.clinicalPurpose === "social_history") dim = "LIFESTYLE";

      return {
        questionId: q.id,
        text: q.text,
        textEn: q.textEn,
        type: q.type,
        options: q.options,
        clinicalPurpose: q.clinicalPurpose,
        dimension: dim,
        facetKey: `socrates.${q.clinicalPurpose}`,
        isRedFlagScreening: isRf,
      };
    });

    // Add AYUSH candidate questions when in AYURVEDA mode
    if (mode === "AYURVEDA") {
      candidates.push({
        questionId: "ayur_agni_fire",
        text: "आपकी भूख और पाचन की स्थिति कैसी रहती है? (मंदाग्नि / तीक्ष्णाग्नि)",
        textEn: "How is your appetite and digestion capacity? (Normal / Sluggish / Excessive)",
        type: "single_choice",
        options: [
          { value: "SAMA", labelHi: "सामान्य / स्वस्थ (Normal)", labelEn: "Normal" },
          { value: "MANDAGNI", labelHi: "मंद भूख / अपच (Poor / Sluggish)", labelEn: "Sluggish" },
          { value: "TIKSHNA", labelHi: "अत्यधिक तीव्र भूख (Excessive / Burning)", labelEn: "Excessive" },
          { value: "VISHAMA", labelHi: "अनियमित भूख (Irregular)", labelEn: "Irregular" },
        ],
        clinicalPurpose: "ayurveda_agni",
        dimension: "AYURVEDIC_AGNI",
        facetKey: "ayurveda.agni",
      });

      candidates.push({
        questionId: "ayur_ama_signs",
        text: "क्या सुबह उठने पर जीभ पर सफेद परत, भारीपन या आलस्य महसूस होता है? (आम लक्षण)",
        textEn: "Do you experience a white coating on your tongue, heaviness, or morning fatigue? (Ama)",
        type: "yes_no",
        options: [
          { value: "YES", labelHi: "हाँ, सफेद परत व भारीपन रहता है (Yes)", labelEn: "Yes" },
          { value: "NO", labelHi: "नहीं, जीभ साफ है (No)", labelEn: "No" },
        ],
        clinicalPurpose: "ayurveda_ama",
        dimension: "AYURVEDIC_AMA",
        facetKey: "ayurveda.ama",
      });
    }

    // 5. Rank Candidate Questions
    const ranked = QuestionRankingService.rankCandidates(candidates, {
      sessionId,
      chiefComplaint: chiefComplaintText,
      category: complaintCategory,
      mode,
      completeness,
      observations,
      answeredQuestionIds,
      answeredValues,
      questionHistory,
      hasActiveCriticalRedFlag: options.hasActiveCriticalRedFlag,
    });

    // 6. Fatigue & Stop Condition Evaluation
    const fatigue = QuestionFatigueGuard.evaluate({
      totalQuestionsAnswered: answeredQuestionIds.size,
      questionHistory,
      overallCompleteness: completeness.overall,
      hasBlockingGaps: completeness.blockingGaps.length > 0,
      hasActiveCriticalRedFlag: !!options.hasActiveCriticalRedFlag,
      nextCandidateDimension: ranked[0]?.dimension,
      nextCandidateFacet: ranked[0]?.rationale?.informationGapsResolved[0],
    });

    let stopCondition: StopCondition = fatigue.stopCondition;
    let stopReasonExplanation = fatigue.reason;
    let nextBestQuestion: RecommendedQuestion | null = ranked[0] || null;

    if (fatigue.shouldStop) {
      if (fatigue.stopCondition === "SAFETY_ESCALATION") {
        nextBestQuestion = null;
      } else if (fatigue.stopCondition === "MINIMUM_SAFE_COMPLETENESS_REACHED" || fatigue.stopCondition === "MAXIMUM_QUESTION_BUDGET_REACHED") {
        nextBestQuestion = null;
      }
    }

    if (!nextBestQuestion && stopCondition === "CONTINUE") {
      stopCondition = "NO_HIGH_VALUE_QUESTIONS_REMAIN";
      stopReasonExplanation = "All high-value clinical facets for this complaint category have been addressed.";
    }

    // 7. Calculate Deterministic Fingerprint
    const fingerprint = this.generateEvaluationFingerprint({
      sessionId,
      answeredQuestionIds: Array.from(answeredQuestionIds),
      observationIds: observations.map((o) => o.id),
      completenessRatio: completeness.overall,
      mode,
    });

    const result: UncertaintyEngineEvaluation = {
      sessionId,
      patientId: session?.patientId,
      mode,
      chiefComplaint: chiefComplaintText,
      completeness,
      gaps: completeness.missingImportantFacets,
      stopCondition,
      stopReasonExplanation,
      recommendedQuestion: nextBestQuestion,
      fingerprint,
      evaluatedAt: new Date(),
    };

    evaluationCache.set(sessionId, result);
    return result;
  }

  /**
   * Retrieves the cached evaluation for a session
   */
  static getCachedEvaluation(sessionId: string): UncertaintyEngineEvaluation | null {
    return evaluationCache.get(sessionId) || null;
  }
}
