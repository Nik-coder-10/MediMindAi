/**
 * Core Adaptive Question and Clinical Category Types
 * SIH 2026 Problem 26047 - AyurSetu
 */

export type ClinicalCategory =
  | "Musculoskeletal"
  | "Chest Pain"
  | "Headache"
  | "Abdominal Pain"
  | "Fever"
  | "Respiratory"
  | "General"
  | "Other"
  // 30 Specialized Categories
  | "Shoulder Pain"
  | "Lower Back Pain"
  | "Neck Pain"
  | "Knee Pain"
  | "Hip Pain"
  | "Ankle & Heel Pain"
  | "Small Joint Pain"
  | "Muscle Pain & Cramps"
  | "Acidity & GERD"
  | "Constipation & Bowel Issues"
  | "Piles & Anorectal Disorders"
  | "Urinary Tract & Burning (मूत्रकृच्छ्र)"
  | "Kidney Stones (मूत्राश्मरी)"
  | "Skin Rash & Eczema (कुष्ठ / विचर्चिका)"
  | "Psoriasis (किटिभ / एककुष्ठ)"
  | "Hair Loss & Scalp (खालित्य / इन्द्रलुप्त)"
  | "Eye Disorders & Vision (नेत्र रोग / अभिष्यन्द)"
  | "Ear Pain & Hearing (कर्ण रोग)"
  | "Dental & Gum Disorders (दंत रोग)"
  | "Mouth Ulcers & Stomatitis (मुखपाक)"
  | "Sleep Disorders & Insomnia (अनिद्रा)"
  | "Anxiety, Stress & Palpitations (चित्तोद्वेग)"
  | "Liver & Metabolic Health (यकृत् विकार)"
  | "Diabetes & Metabolic Care (प्रमेह / मधुमेह)"
  | "Hypertension & Cardiovascular (उच्च रक्तचाप)"
  | "Thyroid & Endocrine Care (गलगंड / अवटु ग्रंथि)"
  | "Fatigue, Weakness & Debility (दौर्बल्य / क्लम)"
  | "Sinusitis & Nasal Allergies (पीनस / प्रतिश्याय)"
  | "Vertigo, Dizziness & Vestibular (भ्रम / चक्कर)"
  | "Gout & Uric Acid Arthritis (वातरक्त)";

export type QuestionType = "text" | "scale" | "yes_no" | "single_choice" | "multi_choice";
export type QuestionPriority = "high" | "medium";
export type ClinicalPurpose =
  | "onset"
  | "location"
  | "severity"
  | "character"
  | "aggravating"
  | "relieving"
  | "associated"
  | "red_flag"
  | "history"
  | "family_history"
  | "social_history";

export interface QuestionOptionItem {
  value: string;
  labelHi: string;
  labelEn: string;
  isRedFlag?: boolean;
}

export interface AdaptiveQuestion {
  id: string;
  text: string;
  textEn: string;
  type: QuestionType;
  options?: Array<QuestionOptionItem | string>;
  priority: QuestionPriority;
  clinicalPurpose: ClinicalPurpose;
}

export interface AdaptiveQuestionGeneratorInput {
  chiefComplaint: string;
  language?: "hi" | "en";
  intakeMode?: "AYURVEDA" | "GENERAL";
  sessionId?: string;
  alreadyCollectedFacts?: Record<string, unknown>;
}

export interface AdaptiveQuestionGeneratorOutput {
  detectedProblems: string[];
  category: ClinicalCategory;
  questions: AdaptiveQuestion[];
  redFlagHints: string[];
}
