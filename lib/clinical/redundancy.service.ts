/**
 * Question Redundancy & Contradiction Detector Service
 * Phase 6: Uncertainty-Driven Adaptive Question Engine
 * SIH 2026 Problem Statement 26047 - AyurSetu / MediMindAi
 *
 * Prevents redundant clinical questions by inspecting:
 * 1. Discrete ClinicalObservation records
 * 2. Answered question nodes in session state
 * 3. Multimodal OCR-extracted document facts
 * 4. Longitudinal patient observations
 *
 * Distinguishes between explicit negative answers (e.g. no allergies) vs unasked (UNKNOWN).
 * Detects contradictory clinical reports requiring clarification.
 */

import { ClinicalObservation, ObservationStatus } from "@prisma/client";
import { FacetStatus, InformationEvidence } from "./uncertainty.types";

export interface RedundancyCheckInput {
  questionId: string;
  facetKey: string;
  clinicalDomain?: string;
  answeredQuestionIds: Set<string>;
  answeredValues: Record<string, unknown>;
  observations: ClinicalObservation[];
  ocrFacts?: Array<{ entityType: string; text: string; confidence?: number }>;
  longitudinalObs?: ClinicalObservation[];
}

export interface RedundancyEvaluation {
  isRedundant: boolean;
  facetStatus: FacetStatus;
  matchingEvidence: InformationEvidence[];
  penalty: number; // 0.0 (no redundancy) to 1.0 (completely redundant)
  reason?: string;
  isContradictory?: boolean;
  contradictionDetails?: {
    priorValue: unknown;
    currentValue: unknown;
    priorTimestamp?: Date | string;
    currentTimestamp?: Date | string;
    description: string;
  };
}

export class QuestionRedundancyDetector {
  /**
   * Evaluates if asking a question would collect already known or equivalent clinical information
   */
  static evaluateRedundancy(input: RedundancyCheckInput): RedundancyEvaluation {
    const evidence: InformationEvidence[] = [];

    // 1. Direct Question ID Match
    if (input.answeredQuestionIds.has(input.questionId)) {
      const val = input.answeredValues[input.questionId];
      return {
        isRedundant: true,
        facetStatus: "KNOWN",
        matchingEvidence: [
          {
            source: "QUESTION_ANSWER",
            id: input.questionId,
            code: input.facetKey,
            summary: `Question ${input.questionId} already answered: ${JSON.stringify(val)}`,
            timestamp: new Date(),
            value: val,
          },
        ],
        penalty: 1.0,
        reason: `Direct question ID '${input.questionId}' has already been answered.`,
      };
    }

    // 2. Evaluate ClinicalObservations matching this facet code
    const matchingObs = input.observations.filter((obs) => {
      const codeMatch =
        obs.code.toLowerCase() === input.facetKey.toLowerCase() ||
        obs.code.toLowerCase().includes(input.facetKey.toLowerCase()) ||
        input.facetKey.toLowerCase().includes(obs.code.toLowerCase());
      return codeMatch;
    });

    if (matchingObs.length > 0) {
      // Check for contradictions in current session observations
      if (matchingObs.length >= 2) {
        const sorted = [...matchingObs].sort(
          (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
        );
        const newest = sorted[0];
        const oldest = sorted[sorted.length - 1];

        // If numeric values differ significantly or qualitative statements directly conflict
        const isNumericConflict =
          typeof newest.numericValue === "number" &&
          typeof oldest.numericValue === "number" &&
          Math.abs(newest.numericValue - oldest.numericValue) >= 4;

        const isStatusConflict =
          (newest.status === ObservationStatus.VERIFIED && oldest.status === ObservationStatus.REFUTED) ||
          (newest.status === ObservationStatus.REFUTED && oldest.status === ObservationStatus.RECORDED);

        if (isNumericConflict || isStatusConflict) {
          return {
            isRedundant: false, // NOT redundant: clarification is clinically required!
            facetStatus: "CONTRADICTORY",
            matchingEvidence: sorted.map((o) => ({
              source: "OBSERVATION",
              id: o.id,
              code: o.code,
              summary: `${o.name}: value=${o.value || o.numericValue}, status=${o.status}`,
              timestamp: o.recordedAt,
              value: o.numericValue ?? o.value,
            })),
            penalty: 0.1, // low penalty because resolving a contradiction is high value
            isContradictory: true,
            contradictionDetails: {
              priorValue: oldest.numericValue ?? oldest.value,
              currentValue: newest.numericValue ?? newest.value,
              priorTimestamp: oldest.recordedAt,
              currentTimestamp: newest.recordedAt,
              description: `Conflicting clinical reports for ${input.facetKey}: earlier '${oldest.numericValue ?? oldest.value}' vs current '${newest.numericValue ?? newest.value}'`,
            },
            reason: `Conflicting evidence detected for ${input.facetKey}. Clarification inquiry prioritized.`,
          };
        }
      }

      // Check for explicit negative finding vs unknown
      const activeObs = matchingObs[0];
      const isExplicitNegative =
        activeObs.status === ObservationStatus.REFUTED ||
        (typeof activeObs.value === "string" &&
          (activeObs.value.toLowerCase() === "no" ||
            activeObs.value.toLowerCase() === "none" ||
            activeObs.value.toLowerCase().includes("no known") ||
            activeObs.value.toLowerCase().includes("denies")));

      evidence.push({
        source: "OBSERVATION",
        id: activeObs.id,
        code: activeObs.code,
        summary: `${activeObs.name}: ${activeObs.value || activeObs.numericValue}`,
        timestamp: activeObs.recordedAt,
        value: activeObs.numericValue ?? activeObs.value,
      });

      return {
        isRedundant: true,
        facetStatus: "KNOWN",
        matchingEvidence: evidence,
        penalty: 0.95,
        reason: isExplicitNegative
          ? `Patient explicitly stated negative finding for ${input.facetKey}.`
          : `Clinical observation already recorded for ${input.facetKey}: ${activeObs.value || activeObs.numericValue}`,
      };
    }

    // 3. Evaluate Multimodal OCR Extracted Facts (Medications, Allergies, Labs)
    if (input.ocrFacts && input.ocrFacts.length > 0) {
      const ocrMatch = input.ocrFacts.find((f) => {
        const entLower = f.entityType.toLowerCase();
        const facetLower = input.facetKey.toLowerCase();
        if (facetLower.includes("medication") && entLower.includes("medication")) return true;
        if (facetLower.includes("allergy") && entLower.includes("allergy")) return true;
        if (facetLower.includes("lab") && entLower.includes("lab")) return true;
        return false;
      });

      if (ocrMatch) {
        return {
          isRedundant: true,
          facetStatus: "KNOWN",
          matchingEvidence: [
            {
              source: "OCR_DOCUMENT",
              id: `ocr-${ocrMatch.entityType}`,
              code: input.facetKey,
              summary: `Extracted from uploaded medical document: ${ocrMatch.text}`,
              timestamp: new Date(),
              confidence: ocrMatch.confidence ?? 0.85,
            },
          ],
          penalty: 0.85,
          reason: `Information already captured via uploaded medical document OCR: '${ocrMatch.text}'`,
        };
      }
    }

    // 4. Longitudinal History Check (Stale vs Recent)
    if (input.longitudinalObs && input.longitudinalObs.length > 0) {
      const histMatch = input.longitudinalObs.find(
        (o) => o.code.toLowerCase() === input.facetKey.toLowerCase()
      );

      if (histMatch) {
        // Distinguish static history (family/past medical) vs dynamic acute symptoms (severity/onset)
        const isStaticHistory =
          input.facetKey.includes("family") ||
          input.facetKey.includes("past_medical") ||
          input.facetKey.includes("allergy") ||
          input.facetKey.includes("blood_group");

        if (isStaticHistory) {
          return {
            isRedundant: true,
            facetStatus: "KNOWN",
            matchingEvidence: [
              {
                source: "LONGITUDINAL_HISTORY",
                id: histMatch.id,
                code: histMatch.code,
                summary: `Previously recorded in past consultation: ${histMatch.value}`,
                timestamp: histMatch.recordedAt,
                value: histMatch.value,
              },
            ],
            penalty: 0.8,
            reason: `Static medical history '${input.facetKey}' is already verified in patient longitudinal record.`,
          };
        } else {
          // Dynamic acute symptom in past consultation is NOT current truth, but helpful context
          return {
            isRedundant: false,
            facetStatus: "PARTIALLY_KNOWN",
            matchingEvidence: [
              {
                source: "LONGITUDINAL_HISTORY",
                id: histMatch.id,
                code: histMatch.code,
                summary: `Prior encounter severity was ${histMatch.numericValue ?? histMatch.value}`,
                timestamp: histMatch.recordedAt,
                value: histMatch.numericValue ?? histMatch.value,
              },
            ],
            penalty: 0.15,
            reason: `Past consultation has record for '${input.facetKey}', but current status must be confirmed.`,
          };
        }
      }
    }

    // 5. Not Redundant
    return {
      isRedundant: false,
      facetStatus: "UNKNOWN",
      matchingEvidence: [],
      penalty: 0.0,
    };
  }
}
