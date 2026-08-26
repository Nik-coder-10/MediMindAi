import { RedFlagRule } from "./types";

export const CLINICAL_RED_FLAG_REGISTRY: Record<string, RedFlagRule> = {
  // 1. CARDIAC & CHEST
  RF_ACS_RADIATION: {
    ruleId: "RF_ACS_RADIATION",
    field: "CP_RADIATION",
    expectedValue: "YES",
    severity: "CRITICAL",
    description: "Chest pain radiating to left arm, neck, or jaw. Possible Acute Coronary Syndrome.",
  },
  RF_CARDIAC_AUTONOMIC_SIGNS: {
    ruleId: "RF_CARDIAC_AUTONOMIC_SIGNS",
    field: "CP_ASSOCIATED",
    expectedValue: "DIAPHORESIS",
    severity: "CRITICAL",
    description: "Chest pain accompanied by cold sweating (diaphoresis) or acute breathlessness.",
  },
  RF_AORTIC_TEARING: {
    ruleId: "RF_AORTIC_TEARING",
    field: "CP_CHARACTER",
    expectedValue: "TEARING_BACK",
    severity: "CRITICAL",
    description: "Severe tearing chest pain radiating between shoulder blades. Suspected Aortic Dissection.",
  },

  // 2. NEUROLOGICAL & STROKE
  RF_HEADACHE_THUNDERCLAP: {
    ruleId: "RF_HEADACHE_THUNDERCLAP",
    field: "HA_ONSET",
    expectedValue: "THUNDERCLAP_SUDDEN",
    severity: "CRITICAL",
    description: "Sudden onset explosive headache reaching peak severity in seconds. Suspected Subarachnoid Hemorrhage.",
  },
  RF_STROKE_FAST_SIGNS: {
    ruleId: "RF_STROKE_FAST_SIGNS",
    field: "HA_NEURO_DEFICIT",
    expectedValue: "FACIAL_OR_ARM_WEAKNESS",
    severity: "CRITICAL",
    description: "Acute unilateral weakness, facial droop, or speech slurring. Suspected Acute Stroke (FAST).",
  },
  RF_HEADACHE_MENINGISM: {
    ruleId: "RF_HEADACHE_MENINGISM",
    field: "HA_ASSOCIATED",
    expectedValue: "NECK_STIFFNESS_FEVER",
    severity: "CRITICAL",
    description: "Headache with neck rigidity and photophobia. Suspected Meningitis.",
  },

  // 3. ABDOMINAL & GI EMERGENCIES
  RF_GI_BLEED_HEMATEMESIS: {
    ruleId: "RF_GI_BLEED_HEMATEMESIS",
    field: "ABD_BLEEDING",
    expectedValue: "VOMITING_BLOOD",
    severity: "CRITICAL",
    description: "Abdominal pain with active blood in vomit or coffee-ground emesis.",
  },
  RF_GI_BLEED_MELENA: {
    ruleId: "RF_GI_BLEED_MELENA",
    field: "ABD_BLEEDING",
    expectedValue: "BLACK_TARRY_STOOL",
    severity: "HIGH",
    description: "Abdominal pain accompanied by black tarry stools (Melena).",
  },
  RF_ACUTE_ABDOMEN_RIGIDITY: {
    ruleId: "RF_ACUTE_ABDOMEN_RIGIDITY",
    field: "ABD_CHARACTER",
    expectedValue: "BOARD_LIKE_RIGIDITY",
    severity: "CRITICAL",
    description: "Generalized board-like abdominal rigidity and guarding. Suspected visceral perforation.",
  },

  // 4. FEVER & INFECTION
  RF_FEVER_ALTERED_SENSORIUM: {
    ruleId: "RF_FEVER_ALTERED_SENSORIUM",
    field: "FEVER_NEURO",
    expectedValue: "CONFUSION_DROWSINESS",
    severity: "CRITICAL",
    description: "High fever accompanied by confusion, delirium, or unresponsiveness. Suspected Encephalitis / Sepsis.",
  },
  RF_FEVER_SEVERE_DYSPNEA: {
    ruleId: "RF_FEVER_SEVERE_DYSPNEA",
    field: "FEVER_RESPIRATORY",
    expectedValue: "SEVERE_BREATHLESSNESS",
    severity: "HIGH",
    description: "Fever with marked tachypnea and inability to speak in full sentences. Suspected severe pneumonia.",
  },

  // 5. MUSCULOSKELETAL & JOINT
  RF_SEPTIC_ARTHRITIS: {
    ruleId: "RF_SEPTIC_ARTHRITIS",
    field: "JP_SIGNS",
    expectedValue: "HOT_RED_INABILITY_TO_BEAR_WEIGHT",
    severity: "HIGH",
    description: "Single hot, erythematous joint with severe fever and total inability to bear weight. Suspected Septic Arthritis.",
  },

  // 6. ANAPHYLAXIS & ALLERGIC
  RF_ANAPHYLAXIS_AIRWAY: {
    ruleId: "RF_ANAPHYLAXIS_AIRWAY",
    field: "GEN_ALLERGY",
    expectedValue: "STRIDOR_LIP_SWELLING",
    severity: "CRITICAL",
    description: "Sudden lip/tongue angioedema with audible wheeze and stridor. Suspected Anaphylaxis.",
  },
};
