/**
 * Uncertainty & Case Completeness Analysis Service
 * Uncertainty-Driven Adaptive Question Engine
 * AyurSetu / MediMindAi Clinical Platform
 *
 * Implements deterministic CaseCompletenessAnalyzer and InformationGapDetector.
 * Quantifies CASE INFORMATION COMPLETENESS across 19 canonical uncertainty dimensions.
 *
 * SAFETY INVARIANT:
 * This calculates information completeness, NOT medical probability or diagnostic certainty.
 */

import { ClinicalObservation, ObservationType } from "@prisma/client";
import {
  UncertaintyDimension,
  FacetStatus,
  InformationGap,
  CaseCompletenessResult,
  CategoryCompleteness,
  ClinicalIntakeMode,
} from "./uncertainty.types";
import { QuestionRedundancyDetector } from "./redundancy.service";

export interface CompletenessEvaluationInput {
  sessionId: string;
  chiefComplaint: string;
  category: string; // e.g. "Musculoskeletal", "Abdominal Pain", "Chest Pain", "Fever", "Respiratory", "General"
  mode: ClinicalIntakeMode;
  observations: ClinicalObservation[];
  answeredQuestionIds?: Set<string>;
  answeredValues?: Record<string, unknown>;
  ocrFacts?: Array<{ entityType: string; text: string; confidence?: number }>;
  longitudinalObs?: ClinicalObservation[];
}

export interface DimensionWeightConfig {
  dimension: UncertaintyDimension;
  weight: number;
  isSafetyCritical: boolean;
}

export class UncertaintyService {
  public static readonly ALGORITHM_VERSION = "v1.0.0-phase6";

  // Configurable clinical weighting table
  public static readonly DIMENSION_WEIGHTS: Record<UncertaintyDimension, DimensionWeightConfig> = {
    NEGATIVE_SAFETY_FINDINGS: { dimension: "NEGATIVE_SAFETY_FINDINGS", weight: 1.5, isSafetyCritical: true },
    SEVERITY: { dimension: "SEVERITY", weight: 1.3, isSafetyCritical: true },
    COMPLAINT_CHARACTERIZATION: { dimension: "COMPLAINT_CHARACTERIZATION", weight: 1.2, isSafetyCritical: false },
    LOCATION: { dimension: "LOCATION", weight: 1.1, isSafetyCritical: false },
    TEMPORAL_HISTORY: { dimension: "TEMPORAL_HISTORY", weight: 1.1, isSafetyCritical: false },
    ASSOCIATED_SYMPTOMS: { dimension: "ASSOCIATED_SYMPTOMS", weight: 1.1, isSafetyCritical: false },
    MEDICATION_HISTORY: { dimension: "MEDICATION_HISTORY", weight: 1.1, isSafetyCritical: true },
    ALLERGY_HISTORY: { dimension: "ALLERGY_HISTORY", weight: 1.1, isSafetyCritical: true },
    PAST_MEDICAL_HISTORY: { dimension: "PAST_MEDICAL_HISTORY", weight: 1.0, isSafetyCritical: false },
    FAMILY_HISTORY: { dimension: "FAMILY_HISTORY", weight: 0.9, isSafetyCritical: false },
    LIFESTYLE: { dimension: "LIFESTYLE", weight: 0.8, isSafetyCritical: false },
    AYURVEDIC_AGNI: { dimension: "AYURVEDIC_AGNI", weight: 0.9, isSafetyCritical: false },
    AYURVEDIC_AMA: { dimension: "AYURVEDIC_AMA", weight: 0.9, isSafetyCritical: false },
    AYURVEDIC_PRAKRITI: { dimension: "AYURVEDIC_PRAKRITI", weight: 0.8, isSafetyCritical: false },
    AYURVEDIC_VIKRITI: { dimension: "AYURVEDIC_VIKRITI", weight: 0.8, isSafetyCritical: false },
    AYURVEDIC_KOSHTHA: { dimension: "AYURVEDIC_KOSHTHA", weight: 0.7, isSafetyCritical: false },
    HOMEOPATHIC_MODALITIES: { dimension: "HOMEOPATHIC_MODALITIES", weight: 0.9, isSafetyCritical: false },
    HOMEOPATHIC_GENERALS: { dimension: "HOMEOPATHIC_GENERALS", weight: 0.8, isSafetyCritical: false },
    HOMEOPATHIC_MIASMS: { dimension: "HOMEOPATHIC_MIASMS", weight: 0.7, isSafetyCritical: false },
  };

  /**
   * Deterministically evaluates information gaps and calculates case completeness
   */
  static evaluateCompleteness(input: CompletenessEvaluationInput): CaseCompletenessResult {
    const answeredIds = input.answeredQuestionIds || new Set<string>();
    const answeredVals = input.answeredValues || {};
    const observations = input.observations || [];
    const lowerComplaint = input.chiefComplaint.toLowerCase();
    const isPainComplaint =
      lowerComplaint.includes("pain") ||
      lowerComplaint.includes("dard") ||
      lowerComplaint.includes("ache") ||
      lowerComplaint.includes("दर्द") ||
      input.category === "Musculoskeletal" ||
      input.category === "Abdominal Pain" ||
      input.category === "Headache" ||
      input.category === "Chest Pain";

    // 1. Determine applicable dimensions based on complaint & mode
    const applicableDimensions = this.getApplicableDimensions(input.category, input.mode, isPainComplaint);

    const gaps: InformationGap[] = [];
    const missingImportant: InformationGap[] = [];
    const blockingGaps: InformationGap[] = [];
    const contradictoryFacets: InformationGap[] = [];
    const categoryResults: Partial<Record<UncertaintyDimension, CategoryCompleteness>> = {};

    let applicableWeightSum = 0;
    let knownWeightSum = 0;

    const allDimensions = Object.keys(this.DIMENSION_WEIGHTS) as UncertaintyDimension[];

    for (const dim of allDimensions) {
      const isApplicable = applicableDimensions.has(dim);
      const weightCfg = this.DIMENSION_WEIGHTS[dim];

      if (!isApplicable) {
        // Exempt dimension: do NOT penalize completeness
        categoryResults[dim] = {
          dimension: dim,
          applicableWeight: 0,
          knownWeight: 0,
          completeness: 1.0,
          status: "EXEMPT",
        };
        continue;
      }

      applicableWeightSum += weightCfg.weight;

      // Check facet status in this dimension
      const facetKey = this.getFacetKeyForDimension(dim, input.category);
      const redundancy = QuestionRedundancyDetector.evaluateRedundancy({
        questionId: `q_${facetKey}`,
        facetKey,
        answeredQuestionIds: answeredIds,
        answeredValues: answeredVals,
        observations,
        ocrFacts: input.ocrFacts,
        longitudinalObs: input.longitudinalObs,
      });

      let status: FacetStatus = redundancy.facetStatus;
      let contributionRatio = 0.0;

      if (status === "KNOWN") {
        contributionRatio = 1.0;
      } else if (status === "PARTIALLY_KNOWN") {
        contributionRatio = 0.5;
      } else if (status === "CONTRADICTORY") {
        contributionRatio = 0.25;
      } else {
        contributionRatio = 0.0;
      }

      const knownPortion = weightCfg.weight * contributionRatio;
      knownWeightSum += knownPortion;

      const gapItem: InformationGap = {
        dimension: dim,
        facet: facetKey,
        status,
        description: this.getDimensionDescription(dim, input.category),
        importance: weightCfg.weight,
        safetyRelevance: weightCfg.isSafetyCritical,
        blocking: weightCfg.isSafetyCritical && status === "UNKNOWN",
        candidateQuestionIds: this.getCandidateQuestionsForDimension(dim, input.category),
        evidence: redundancy.matchingEvidence,
        reason: redundancy.reason || `Status for ${dim} is currently ${status}.`,
        clarificationRequired: status === "CONTRADICTORY",
      };

      gaps.push(gapItem);

      if (status !== "KNOWN") {
        if (weightCfg.weight >= 1.1 || weightCfg.isSafetyCritical) {
          missingImportant.push(gapItem);
        }
        if (gapItem.blocking) {
          blockingGaps.push(gapItem);
        }
      }

      if (status === "CONTRADICTORY") {
        contradictoryFacets.push(gapItem);
      }

      categoryResults[dim] = {
        dimension: dim,
        applicableWeight: weightCfg.weight,
        knownWeight: knownPortion,
        completeness: contributionRatio,
        status:
          contributionRatio >= 1.0
            ? "COMPLETE"
            : contributionRatio > 0.0
            ? "PARTIAL"
            : "UNRESOLVED",
      };
    }

    const overall =
      applicableWeightSum > 0
        ? Math.min(1.0, Math.max(0.0, Math.round((knownWeightSum / applicableWeightSum) * 100) / 100))
        : 1.0;

    return {
      overall,
      categoryCompleteness: categoryResults as Record<UncertaintyDimension, CategoryCompleteness>,
      applicableWeightSum,
      knownWeightSum,
      missingImportantFacets: missingImportant,
      blockingGaps,
      contradictoryFacets,
      evaluatedAt: new Date(),
      algorithmVersion: this.ALGORITHM_VERSION,
    };
  }

  /**
   * Identifies which dimensions are clinically applicable to the given complaint & mode
   */
  public static getApplicableDimensions(
    category: string,
    mode: ClinicalIntakeMode,
    isPainComplaint: boolean
  ): Set<UncertaintyDimension> {
    const applicable = new Set<UncertaintyDimension>();

    // Universal clinical history facets applicable to all encounters
    applicable.add("NEGATIVE_SAFETY_FINDINGS");
    applicable.add("COMPLAINT_CHARACTERIZATION");
    applicable.add("TEMPORAL_HISTORY");
    applicable.add("MEDICATION_HISTORY");
    applicable.add("ALLERGY_HISTORY");
    applicable.add("PAST_MEDICAL_HISTORY");
    applicable.add("FAMILY_HISTORY");
    applicable.add("LIFESTYLE");

    // Location and Severity are applicable to Pain or localized complaints
    if (isPainComplaint || category === "Respiratory" || category === "General") {
      applicable.add("SEVERITY");
      applicable.add("LOCATION");
      applicable.add("ASSOCIATED_SYMPTOMS");
    }

    // AYUSH: Ayurveda Mode specific dimensions
    if (mode === "AYURVEDA") {
      applicable.add("AYURVEDIC_AGNI");
      applicable.add("AYURVEDIC_AMA");
      applicable.add("AYURVEDIC_PRAKRITI");
      applicable.add("AYURVEDIC_VIKRITI");
      applicable.add("AYURVEDIC_KOSHTHA");
    }

    // AYUSH: Homeopathy Mode specific dimensions
    if (mode === "HOMEOPATHY") {
      applicable.add("HOMEOPATHIC_MODALITIES");
      applicable.add("HOMEOPATHIC_GENERALS");
      applicable.add("HOMEOPATHIC_MIASMS");
    }

    return applicable;
  }

  private static getFacetKeyForDimension(dim: UncertaintyDimension, category: string): string {
    switch (dim) {
      case "SEVERITY":
        return "socrates.severity";
      case "LOCATION":
        return "socrates.site";
      case "COMPLAINT_CHARACTERIZATION":
        return "socrates.character";
      case "TEMPORAL_HISTORY":
        return "socrates.onset";
      case "ASSOCIATED_SYMPTOMS":
        return "socrates.associated";
      case "NEGATIVE_SAFETY_FINDINGS":
        return "safety.red_flag_screening";
      case "MEDICATION_HISTORY":
        return "history.medications";
      case "ALLERGY_HISTORY":
        return "history.allergies";
      case "PAST_MEDICAL_HISTORY":
        return "history.past_medical";
      case "FAMILY_HISTORY":
        return "history.family";
      case "LIFESTYLE":
        return "history.lifestyle";
      case "AYURVEDIC_AGNI":
        return "ayurveda.agni";
      case "AYURVEDIC_AMA":
        return "ayurveda.ama";
      case "AYURVEDIC_PRAKRITI":
        return "ayurveda.prakriti";
      case "AYURVEDIC_VIKRITI":
        return "ayurveda.vikriti";
      case "AYURVEDIC_KOSHTHA":
        return "ayurveda.koshtha";
      case "HOMEOPATHIC_MODALITIES":
        return "homeopathy.modality";
      case "HOMEOPATHIC_GENERALS":
        return "homeopathy.general";
      case "HOMEOPATHIC_MIASMS":
        return "homeopathy.miasm";
      default:
        return "clinical.general";
    }
  }

  private static getDimensionDescription(dim: UncertaintyDimension, category: string): string {
    switch (dim) {
      case "SEVERITY":
        return `Numerical or qualitative severity assessment for ${category}`;
      case "LOCATION":
        return `Anatomical localization and laterality for ${category}`;
      case "COMPLAINT_CHARACTERIZATION":
        return `Quality and presentation character of ${category}`;
      case "TEMPORAL_HISTORY":
        return `Onset time, duration, and progression pattern`;
      case "ASSOCIATED_SYMPTOMS":
        return `Concomitant manifestations and secondary complaints`;
      case "NEGATIVE_SAFETY_FINDINGS":
        return `Screening for emergency red flags and critical negative findings`;
      case "MEDICATION_HISTORY":
        return `Current active medications and allopathic/ayurvedic therapies`;
      case "ALLERGY_HISTORY":
        return `Known drug allergies, food intolerances, and cross-reactivities`;
      case "PAST_MEDICAL_HISTORY":
        return `Pre-existing chronic conditions (diabetes, hypertension, asthma)`;
      case "FAMILY_HISTORY":
        return `Hereditary medical predispositions in first-degree relatives`;
      case "LIFESTYLE":
        return `Dietary habits, sleep cycle, stress levels, and occupational factors`;
      case "AYURVEDIC_AGNI":
        return `Ayurvedic digestive fire state (Sama, Vishama, Tikshna, Mandagni)`;
      case "AYURVEDIC_AMA":
        return `Assessment of metabolic endotoxin accumulation (Ama lakshana)`;
      case "AYURVEDIC_PRAKRITI":
        return `Inherent constitutional Dosha balance (Vata-Pitta-Kapha)`;
      case "AYURVEDIC_VIKRITI":
        return `Current doshic imbalance and vitiation state`;
      case "AYURVEDIC_KOSHTHA":
        return `Bowel regularity and gastrointestinal temperament`;
      case "HOMEOPATHIC_MODALITIES":
        return `Modalities: environmental, thermal, and temporal aggravation/amelioration`;
      case "HOMEOPATHIC_GENERALS":
        return `General constitutional reactions to thermal and atmospheric conditions`;
      case "HOMEOPATHIC_MIASMS":
        return `Fundamental miasmatic background (Psora, Sycosis, Syphilis)`;
      default:
        return `Clinical inquiry for ${dim}`;
    }
  }

  private static getCandidateQuestionsForDimension(dim: UncertaintyDimension, category: string): string[] {
    switch (dim) {
      case "SEVERITY":
        return ["socrates_severity", "msk_severity_scale", "abd_severity_scale", "head_severity_scale"];
      case "LOCATION":
        return ["socrates_site", "msk_location_site", "abd_location_quadrant", "head_location_region"];
      case "NEGATIVE_SAFETY_FINDINGS":
        return ["red_flag_screening", "msk_redflag_trauma", "cp_redflag_acs", "abd_redflag_peritonitis"];
      case "MEDICATION_HISTORY":
        return ["medication_history_current", "history_current_drugs"];
      case "ALLERGY_HISTORY":
        return ["allergy_history_check", "history_known_allergies"];
      case "AYURVEDIC_AGNI":
        return ["ayur_agni_assessment", "ayurveda_digestive_fire"];
      case "AYURVEDIC_AMA":
        return ["ayur_ama_signs", "ayurveda_toxin_tongue"];
      default:
        return [`q_${dim.toLowerCase()}`];
    }
  }
}
