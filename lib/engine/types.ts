export type ComplaintCategory =
  | "CHEST_PAIN"
  | "HEADACHE"
  | "ABDOMINAL_PAIN"
  | "JOINT_PAIN"
  | "FEVER"
  | "GENERAL";

export type QuestionNodeType = "TEXT" | "SINGLE_CHOICE" | "MULTI_CHOICE" | "SCALE" | "YES_NO";

export interface QuestionOption {
  value: string;
  labelHi: string;
  labelEn: string;
  score?: number;
  isRedFlag?: boolean;
}

export interface RedFlagRule {
  field: string;
  expectedValue: string | number | boolean;
  severity: "HIGH" | "CRITICAL";
  description: string;
  ruleId: string;
}

export interface NextNodeRule {
  condition?: {
    field?: string;
    operator?: "EQUALS" | "CONTAINS" | "GREATER_THAN" | "IN";
    value?: unknown;
  };
  targetNodeCode: string;
}

export interface EngineQuestionDefinition {
  nodeCode: string;
  chiefComplaintCategory: ComplaintCategory;
  questionText: string;
  questionTextHindi: string;
  questionType: QuestionNodeType;
  options?: QuestionOption[];
  clinicalDomain: string; // SOCRATES_SITE, SOCRATES_SEVERITY, AGNI, AMA, PRAKRITI
  redFlagTriggers?: RedFlagRule[];
  nextRules?: NextNodeRule[];
}

export interface CollectedFacts {
  category?: ComplaintCategory;
  socrates?: {
    site?: string;
    onset?: string;
    character?: string;
    radiation?: string;
    associatedSymptoms?: string[];
    timing?: string;
    exacerbatingFactors?: string;
    severity?: number | string;
  };
  ayushGhataka?: {
    agni?: "SAMA" | "MANDA" | "TIKSHNA" | "VISHAMA";
    ama?: boolean;
    nidra?: string;
    koshtha?: string;
  };
  familyHistory?: {
    diabetesHtn?: string;
    cardiacStroke?: string;
    summaryText?: string;
  };
  socialHistory?: {
    habits?: string;
    dietActivity?: string;
    smokingPackYears?: number;
    summaryText?: string;
  };
  obstetricHistory?: {
    applicable?: boolean;
    menstrualStatus?: string;
    obstetricStatus?: string;
    summaryText?: string;
  };
  answers?: Record<string, unknown>;
  triggeredRedFlags?: Array<{ ruleId: string; description: string; severity: string }>;
}

export interface EngineStateDTO {
  sessionId: string;
  category: ComplaintCategory;
  currentNodeCode: string | null;
  questionCount: number;
  maxQuestions: number;
  triageLevel: "ROUTINE" | "URGENT" | "EMERGENCY";
  isPaused: boolean;
  completed: boolean;
  collectedFacts: CollectedFacts;
}

export interface QuestionProvider {
  classifyComplaint(text: string): Promise<ComplaintCategory>;
  getNodeByCode(nodeCode: string): Promise<EngineQuestionDefinition | null>;
  getFirstNodeForCategory(category: ComplaintCategory): Promise<EngineQuestionDefinition | null>;
  getNextNodeCode(
    currentNode: EngineQuestionDefinition,
    answer: unknown,
    facts: CollectedFacts
  ): string | null;
}
