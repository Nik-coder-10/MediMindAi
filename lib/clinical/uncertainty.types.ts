/**
 * Uncertainty & Information Completeness Domain Types
 * Uncertainty-Driven Adaptive Question Engine
 * AyurSetu / MediMindAi Clinical Platform
 *
 * Strictly models Case Information Gaps and Clinical Information Completeness.
 * DOES NOT calculate disease probabilities or make autonomous diagnostic claims.
 */

export type UncertaintyDimension =
  | "COMPLAINT_CHARACTERIZATION"
  | "TEMPORAL_HISTORY"
  | "SEVERITY"
  | "LOCATION"
  | "ASSOCIATED_SYMPTOMS"
  | "NEGATIVE_SAFETY_FINDINGS"
  | "MEDICATION_HISTORY"
  | "ALLERGY_HISTORY"
  | "PAST_MEDICAL_HISTORY"
  | "FAMILY_HISTORY"
  | "LIFESTYLE"
  | "AYURVEDIC_PRAKRITI"
  | "AYURVEDIC_VIKRITI"
  | "AYURVEDIC_AGNI"
  | "AYURVEDIC_AMA"
  | "AYURVEDIC_KOSHTHA"
  | "HOMEOPATHIC_MODALITIES"
  | "HOMEOPATHIC_GENERALS"
  | "HOMEOPATHIC_MIASMS";

export type FacetStatus =
  | "UNKNOWN"
  | "PARTIALLY_KNOWN"
  | "KNOWN"
  | "CONTRADICTORY"
  | "NOT_APPLICABLE";

export type ClinicalIntakeMode = "GENERAL" | "AYURVEDA" | "HOMEOPATHY";

export interface InformationEvidence {
  source: "OBSERVATION" | "QUESTION_ANSWER" | "OCR_DOCUMENT" | "VOICE_TRANSCRIPT" | "LONGITUDINAL_HISTORY";
  id: string;
  code: string;
  summary: string;
  timestamp: Date | string;
  confidence?: number;
  value?: unknown;
}

export interface InformationGap {
  dimension: UncertaintyDimension;
  facet: string;
  status: FacetStatus;
  description: string;
  importance: number; // Configurable weighting 0.0 to 1.5
  safetyRelevance: boolean; // Flag if missing info has critical safety impact
  blocking: boolean; // If true, session should prioritize resolving before ending
  candidateQuestionIds: string[];
  evidence: InformationEvidence[];
  reason: string;
  clarificationRequired?: boolean;
}

export interface CategoryCompleteness {
  dimension: UncertaintyDimension;
  applicableWeight: number;
  knownWeight: number;
  completeness: number; // 0.0 to 1.0
  status: "COMPLETE" | "PARTIAL" | "UNRESOLVED" | "EXEMPT";
}

export interface CaseCompletenessResult {
  overall: number; // 0.0 to 1.0 (Information completeness, NOT diagnostic certainty)
  categoryCompleteness: Record<UncertaintyDimension, CategoryCompleteness>;
  applicableWeightSum: number;
  knownWeightSum: number;
  missingImportantFacets: InformationGap[];
  blockingGaps: InformationGap[];
  contradictoryFacets: InformationGap[];
  evaluatedAt: Date;
  algorithmVersion: string;
}

export type StopCondition =
  | "CONTINUE"
  | "MINIMUM_SAFE_COMPLETENESS_REACHED"
  | "NO_HIGH_VALUE_QUESTIONS_REMAIN"
  | "REQUIRED_QUESTIONS_COMPLETED"
  | "SAFETY_ESCALATION"
  | "MAXIMUM_QUESTION_BUDGET_REACHED";

export interface QuestionRecommendationRationale {
  rank: number;
  score: number;
  reasons: string[];
  informationGapsResolved: string[];
  uncertaintyDimensions: UncertaintyDimension[];
  safetyPriority: number;
  informationGain: number;
  completenessImpact: number;
  relevance: number;
  redundancyScore: number;
  fatiguePenalty: number;
  isClarificationQuestion?: boolean;
}

export interface RecommendedQuestion {
  questionId: string;
  text: string;
  textEn: string;
  type: string;
  options?: any[];
  clinicalPurpose: string;
  priority: "high" | "medium" | "critical";
  dimension: UncertaintyDimension;
  rationale: QuestionRecommendationRationale;
  patientFriendlyContext?: string;
}

export interface UncertaintyEngineEvaluation {
  sessionId: string;
  patientId?: string;
  mode: ClinicalIntakeMode;
  chiefComplaint: string;
  completeness: CaseCompletenessResult;
  gaps: InformationGap[];
  stopCondition: StopCondition;
  stopReasonExplanation?: string;
  recommendedQuestion: RecommendedQuestion | null;
  fingerprint: string;
  evaluatedAt: Date;
}
