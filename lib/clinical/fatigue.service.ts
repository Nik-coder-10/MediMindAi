/**
 * Question Fatigue & Budget Guard Service
 * Uncertainty-Driven Adaptive Question Engine
 * AyurSetu / MediMindAi Clinical Platform
 *
 * Prevents conversational fatigue, limits consecutive questions from the same domain,
 * and deterministically evaluates when to stop questioning while guaranteeing clinical safety.
 */

import { StopCondition, UncertaintyDimension } from "./uncertainty.types";

export interface FatigueGuardConfig {
  maxQuestionBudget: number; // Max total questions (default: 10)
  minSafeCompleteness: number; // e.g. 0.70 (70% case info completeness)
  maxConsecutiveSameDimension: number; // Max consecutive questions in same domain (default: 2)
  maxRepetitionsPerFacet: number; // Max times a single facet can be inquired (default: 2)
}

export interface FatigueEvaluationInput {
  totalQuestionsAnswered: number;
  questionHistory: Array<{ questionId: string; dimension?: UncertaintyDimension; facetKey?: string }>;
  overallCompleteness: number;
  hasBlockingGaps: boolean;
  hasActiveCriticalRedFlag: boolean;
  nextCandidateDimension?: UncertaintyDimension;
  nextCandidateFacet?: string;
  config?: Partial<FatigueGuardConfig>;
}

export interface FatigueEvaluationResult {
  stopCondition: StopCondition;
  shouldStop: boolean;
  fatiguePenalty: number; // 0.0 (no fatigue) to 1.0 (severe fatigue)
  reason?: string;
  consecutiveDimensionCount: number;
  facetRepetitionCount: number;
}

export class QuestionFatigueGuard {
  public static readonly DEFAULT_CONFIG: FatigueGuardConfig = {
    maxQuestionBudget: 10,
    minSafeCompleteness: 0.70,
    maxConsecutiveSameDimension: 2,
    maxRepetitionsPerFacet: 2,
  };

  /**
   * Evaluates question fatigue and determines whether to continue or stop intake
   */
  static evaluate(input: FatigueEvaluationInput): FatigueEvaluationResult {
    const cfg: FatigueGuardConfig = {
      ...this.DEFAULT_CONFIG,
      ...(input.config || {}),
    };

    // 1. Authoritative Safety Rule Escalation: Emergency Red Flag supersedes all stop conditions
    if (input.hasActiveCriticalRedFlag) {
      return {
        stopCondition: "SAFETY_ESCALATION",
        shouldStop: true,
        fatiguePenalty: 0.0,
        reason: "Critical emergency red flag triggered. Case requires immediate physician/triage escalation.",
        consecutiveDimensionCount: 0,
        facetRepetitionCount: 0,
      };
    }

    // 2. Absolute Question Budget Check
    if (input.totalQuestionsAnswered >= cfg.maxQuestionBudget) {
      return {
        stopCondition: "MAXIMUM_QUESTION_BUDGET_REACHED",
        shouldStop: true,
        fatiguePenalty: 1.0,
        reason: `Maximum conversational question budget (${cfg.maxQuestionBudget}) reached to avoid patient exhaustion.`,
        consecutiveDimensionCount: 0,
        facetRepetitionCount: 0,
      };
    }

    // 3. Minimum Safe Completeness Check (No Blocking Gaps remaining)
    if (input.overallCompleteness >= cfg.minSafeCompleteness && !input.hasBlockingGaps) {
      // If we already have sufficient case information (>= 70%) and no blocking safety gaps:
      if (input.totalQuestionsAnswered >= 5) {
        return {
          stopCondition: "MINIMUM_SAFE_COMPLETENESS_REACHED",
          shouldStop: true,
          fatiguePenalty: 0.9,
          reason: `Safe case information completeness reached (${Math.round(input.overallCompleteness * 100)}%) with zero blocking gaps.`,
          consecutiveDimensionCount: 0,
          facetRepetitionCount: 0,
        };
      }
    }

    // 4. Consecutive Same-Dimension Inquiries Penalty
    let consecutiveDimensionCount = 0;
    if (input.nextCandidateDimension && input.questionHistory.length > 0) {
      for (let i = input.questionHistory.length - 1; i >= 0; i--) {
        if (input.questionHistory[i].dimension === input.nextCandidateDimension) {
          consecutiveDimensionCount++;
        } else {
          break;
        }
      }
    }

    // 5. Repetitions on the same facet
    let facetRepetitionCount = 0;
    if (input.nextCandidateFacet && input.questionHistory.length > 0) {
      facetRepetitionCount = input.questionHistory.filter(
        (q) => q.facetKey === input.nextCandidateFacet
      ).length;
    }

    // Compute heuristic penalty
    let fatiguePenalty = 0.0;
    // Base fatigue from total questions asked (linear ramp from 4 questions onward)
    if (input.totalQuestionsAnswered >= 4) {
      fatiguePenalty += (input.totalQuestionsAnswered - 3) * 0.08;
    }

    // Penalty for repeated consecutive dimension
    if (consecutiveDimensionCount >= cfg.maxConsecutiveSameDimension) {
      fatiguePenalty += 0.45;
    }

    // Heavy penalty for repeating the exact same facet
    if (facetRepetitionCount >= cfg.maxRepetitionsPerFacet) {
      fatiguePenalty += 0.80;
    }

    return {
      stopCondition: "CONTINUE",
      shouldStop: false,
      fatiguePenalty: Math.min(1.0, Math.max(0.0, fatiguePenalty)),
      reason:
        consecutiveDimensionCount >= cfg.maxConsecutiveSameDimension
          ? `Patient has already answered ${consecutiveDimensionCount} consecutive questions in ${input.nextCandidateDimension}. Recommend switching domain.`
          : undefined,
      consecutiveDimensionCount,
      facetRepetitionCount,
    };
  }
}
