/**
 * Question Ranking & Value Scoring Service
 * Phase 6: Uncertainty-Driven Adaptive Question Engine
 * SIH 2026 Problem Statement 26047 - AyurSetu / MediMindAi
 *
 * Implements deterministic scoring of candidate questions based on:
 * - SafetyPriority: Urgent screening outranks general history
 * - InformationGain: Resolution of high-priority uncertainty dimensions
 * - CaseCompletenessImpact: Weighted contribution to missing case info
 * - Relevance: Complaint category and clinic mode alignment
 * - TemporalUrgency: Acute vs chronic history timing
 * - RedundancyPenalty: Penalizes already known or equivalent facts
 * - FatiguePenalty: Penalizes consecutive same-dimension questions & repeated questions
 *
 * SAFETY INVARIANT:
 * RED-FLAG SCREENING > SAFETY-CRITICAL > CHIEF COMPLAINT > CORE HISTORY > AYUSH DETAIL > OPTIONAL
 */

import {
  UncertaintyDimension,
  RecommendedQuestion,
  QuestionRecommendationRationale,
  CaseCompletenessResult,
  ClinicalIntakeMode,
} from "./uncertainty.types";
import { QuestionRedundancyDetector } from "./redundancy.service";
import { QuestionFatigueGuard } from "./fatigue.service";
import { ClinicalObservation } from "@prisma/client";

export interface CandidateQuestionInput {
  questionId: string;
  text: string;
  textEn: string;
  type: string;
  options?: any[];
  clinicalPurpose: string;
  dimension: UncertaintyDimension;
  facetKey: string;
  isRedFlagScreening?: boolean;
}

export interface RankingContext {
  sessionId: string;
  chiefComplaint: string;
  category: string;
  mode: ClinicalIntakeMode;
  completeness: CaseCompletenessResult;
  observations: ClinicalObservation[];
  answeredQuestionIds: Set<string>;
  answeredValues: Record<string, unknown>;
  questionHistory: Array<{ questionId: string; dimension?: UncertaintyDimension; facetKey?: string }>;
  ocrFacts?: Array<{ entityType: string; text: string; confidence?: number }>;
  longitudinalObs?: ClinicalObservation[];
  hasActiveCriticalRedFlag?: boolean;
}

export class QuestionRankingService {
  /**
   * Evaluates and scores candidate questions, returning the highest-value safe recommendation
   */
  static rankCandidates(
    candidates: CandidateQuestionInput[],
    ctx: RankingContext
  ): RecommendedQuestion[] {
    const scoredQuestions: Array<{
      candidate: CandidateQuestionInput;
      score: number;
      rationale: QuestionRecommendationRationale;
      patientContext: string;
    }> = [];

    for (const cand of candidates) {
      // 1. Redundancy Evaluation
      const redundancy = QuestionRedundancyDetector.evaluateRedundancy({
        questionId: cand.questionId,
        facetKey: cand.facetKey,
        answeredQuestionIds: ctx.answeredQuestionIds,
        answeredValues: ctx.answeredValues,
        observations: ctx.observations,
        ocrFacts: ctx.ocrFacts,
        longitudinalObs: ctx.longitudinalObs,
      });

      // If already known with high confidence and no contradiction, apply heavy redundancy penalty
      if (redundancy.isRedundant && !redundancy.isContradictory) {
        continue; // Exclude completely redundant questions from top recommendations
      }

      // 2. Fatigue Evaluation for this candidate
      const fatigue = QuestionFatigueGuard.evaluate({
        totalQuestionsAnswered: ctx.answeredQuestionIds.size,
        questionHistory: ctx.questionHistory,
        overallCompleteness: ctx.completeness.overall,
        hasBlockingGaps: ctx.completeness.blockingGaps.length > 0,
        hasActiveCriticalRedFlag: !!ctx.hasActiveCriticalRedFlag,
        nextCandidateDimension: cand.dimension,
        nextCandidateFacet: cand.facetKey,
      });

      // 3. Score Components (Normalized 0.0 to 1.0 scale)
      let safetyPriority = 0.0;
      if (cand.isRedFlagScreening || cand.dimension === "NEGATIVE_SAFETY_FINDINGS") {
        safetyPriority = 1.0;
      } else if (cand.dimension === "SEVERITY" || cand.dimension === "ALLERGY_HISTORY") {
        safetyPriority = 0.85;
      } else if (cand.dimension === "MEDICATION_HISTORY") {
        safetyPriority = 0.75;
      }

      // Information Gain: does this resolve a currently UNKNOWN or CONTRADICTORY gap?
      const gap = ctx.completeness.missingImportantFacets.find(
        (g) => g.dimension === cand.dimension || g.facet === cand.facetKey
      );
      let informationGain = 0.4;
      if (redundancy.isContradictory) {
        informationGain = 0.95; // Resolving conflicting clinical report is extremely high value
      } else if (gap && gap.status === "UNKNOWN") {
        informationGain = gap.blocking ? 0.90 : 0.75;
      }

      // Case Completeness Impact: weight of this dimension
      const dimCompleteness = ctx.completeness.categoryCompleteness[cand.dimension];
      const completenessImpact = dimCompleteness && dimCompleteness.status === "UNRESOLVED" ? 0.8 : 0.3;

      // Relevance: alignment with chief complaint category & clinic mode
      let relevance = 0.6;
      if (
        cand.clinicalPurpose === "onset" ||
        cand.clinicalPurpose === "location" ||
        cand.clinicalPurpose === "severity"
      ) {
        relevance = 0.9;
      }
      // Mode-specific relevance boosts
      if (ctx.mode === "AYURVEDA" && cand.dimension.startsWith("AYURVEDIC_")) {
        relevance = 0.85;
      }
      if (ctx.mode === "HOMEOPATHY" && cand.dimension.startsWith("HOMEOPATHIC_")) {
        relevance = 0.85;
      }

      // Temporal Urgency: Early questions (1-3) prioritize symptoms; later questions (4+) prioritize medical history
      let temporalUrgency = 0.5;
      const count = ctx.answeredQuestionIds.size;
      if (count <= 3) {
        if (cand.dimension === "COMPLAINT_CHARACTERIZATION" || cand.dimension === "SEVERITY" || cand.dimension === "LOCATION") {
          temporalUrgency = 0.9;
        }
      } else {
        if (cand.dimension === "MEDICATION_HISTORY" || cand.dimension === "ALLERGY_HISTORY" || cand.dimension.startsWith("AYURVEDIC_")) {
          temporalUrgency = 0.8;
        }
      }

      // Redundancy penalty & Fatigue penalty
      const redundancyPenalty = redundancy.penalty;
      const fatiguePenalty = fatigue.fatiguePenalty;

      // Heuristic Question Value Formula
      const totalScore =
        safetyPriority * 1.5 +
        informationGain * 1.2 +
        completenessImpact * 1.0 +
        relevance * 0.8 +
        temporalUrgency * 0.5 -
        redundancyPenalty * 1.5 -
        fatiguePenalty * 0.8;

      // Explainable Rationale Reasons
      const reasons: string[] = [];
      if (safetyPriority >= 0.8) reasons.push("prioritizes_safety_red_flag_screening");
      if (redundancy.isContradictory) reasons.push("resolves_clinical_contradiction");
      if (informationGain >= 0.7) reasons.push("resolves_high_priority_information_gap");
      if (relevance >= 0.8) reasons.push("directly_relevant_to_chief_complaint");
      if (completenessImpact >= 0.7) reasons.push("required_for_case_completeness");

      // Patient-friendly calm context cue (avoids raw numbers)
      let patientContext = "लक्षणों को बेहतर समझने के लिए महत्वपूर्ण प्रश्न";
      if (safetyPriority >= 0.8) {
        patientContext = "आपकी सुरक्षा सुनिश्चित करने के लिए महत्वपूर्ण प्रश्न (Safety check)";
      } else if (redundancy.isContradictory) {
        patientContext = "पूर्व विवरण को स्पष्ट करने के लिए एक प्रश्न (Clarification)";
      } else if (cand.dimension.startsWith("AYURVEDIC_")) {
        patientContext = "आयुर्वेदिक प्रकृति व अग्नि स्थिति समझने के लिए (AYUSH assessment)";
      }

      scoredQuestions.push({
        candidate: cand,
        score: Math.round(totalScore * 100) / 100,
        patientContext,
        rationale: {
          rank: 0,
          score: Math.round(totalScore * 100) / 100,
          reasons,
          informationGapsResolved: [cand.facetKey],
          uncertaintyDimensions: [cand.dimension],
          safetyPriority,
          informationGain,
          completenessImpact,
          relevance,
          redundancyScore: redundancyPenalty,
          fatiguePenalty,
          isClarificationQuestion: redundancy.isContradictory,
        },
      });
    }

    // Sort descending by score
    scoredQuestions.sort((a, b) => b.score - a.score);

    // Map to RecommendedQuestion with 1-based ranks
    return scoredQuestions.map((sq, index) => ({
      questionId: sq.candidate.questionId,
      text: sq.candidate.text,
      textEn: sq.candidate.textEn,
      type: sq.candidate.type,
      options: sq.candidate.options,
      clinicalPurpose: sq.candidate.clinicalPurpose,
      priority:
        sq.candidate.isRedFlagScreening || sq.rationale.safetyPriority >= 0.9
          ? "critical"
          : sq.score >= 2.0
          ? "high"
          : "medium",
      dimension: sq.candidate.dimension,
      rationale: {
        ...sq.rationale,
        rank: index + 1,
      },
      patientFriendlyContext: sq.patientContext,
    }));
  }
}
