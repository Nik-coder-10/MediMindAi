import { EngineQuestionDefinition, ComplaintCategory, QuestionProvider, CollectedFacts } from "./types";

export const SAMPLE_QUESTION_TREE: Record<string, EngineQuestionDefinition> = {
  // ==========================================
  // CHEST PAIN DECISION TREE (SOCRATES + CARDIAC RED FLAGS)
  // ==========================================
  CP_SEVERITY: {
    nodeCode: "CP_SEVERITY",
    chiefComplaintCategory: "CHEST_PAIN",
    clinicalDomain: "SOCRATES_SEVERITY",
    questionText: "On a scale of 1 to 10, how severe is your chest pain?",
    questionTextHindi: "१ से १० के पैमाने पर, आपकी छाती का दर्द कितना तीव्र है?",
    questionType: "SINGLE_CHOICE",
    options: [
      { value: "MILD_1_3", labelHi: "हल्का (१ से ३)", labelEn: "Mild (1-3)", score: 2 },
      { value: "MODERATE_4_6", labelHi: "मध्यम (४ से ६)", labelEn: "Moderate (4-6)", score: 5 },
      { value: "SEVERE_7_10", labelHi: "अत्यधिक तेज (७ से १०)", labelEn: "Severe (7-10)", score: 9, isRedFlag: true },
    ],
    nextRules: [{ targetNodeCode: "CP_CHARACTER" }],
  },

  CP_CHARACTER: {
    nodeCode: "CP_CHARACTER",
    chiefComplaintCategory: "CHEST_PAIN",
    clinicalDomain: "SOCRATES_CHARACTER",
    questionText: "What does the pain feel like?",
    questionTextHindi: "दर्द किस प्रकार का महसूस हो रहा है?",
    questionType: "SINGLE_CHOICE",
    options: [
      { value: "PRESSURE_HEAVINESS", labelHi: "छाती पर भारीपन / दबाव (Heavy Pressure / Crushing)", labelEn: "Heavy Pressure / Squeezing", isRedFlag: true },
      { value: "SHARP_STABBING", labelHi: "तेज चुभन जैसा (Sharp Stabbing)", labelEn: "Sharp Stabbing" },
      { value: "BURNING_ACIDIC", labelHi: "जलन / अम्लपित्त जैसा (Burning / Acidic)", labelEn: "Burning / Heartburn" },
    ],
    nextRules: [{ targetNodeCode: "CP_RADIATION" }],
  },

  CP_RADIATION: {
    nodeCode: "CP_RADIATION",
    chiefComplaintCategory: "CHEST_PAIN",
    clinicalDomain: "SOCRATES_RADIATION",
    questionText: "Does the pain spread to your left arm, neck, jaw, or back?",
    questionTextHindi: "क्या यह दर्द आपके बाएं हाथ, गर्दन, जबड़े या पीठ की तरफ फैलता है?",
    questionType: "YES_NO",
    options: [
      { value: "YES", labelHi: "हाँ, फैलता है (Yes, radiates)", labelEn: "Yes", isRedFlag: true },
      { value: "NO", labelHi: "नहीं (No radiation)", labelEn: "No" },
      { value: "NOT_SURE", labelHi: "पता नहीं (Not sure)", labelEn: "Not sure" },
    ],
    redFlagTriggers: [
      {
        field: "CP_RADIATION",
        expectedValue: "YES",
        severity: "CRITICAL",
        description: "Chest pain radiating to left arm/jaw/neck - Acute Coronary Syndrome pattern.",
        ruleId: "RF_ACS_RADIATION",
      },
    ],
    nextRules: [{ targetNodeCode: "CP_ASSOCIATED" }],
  },

  CP_ASSOCIATED: {
    nodeCode: "CP_ASSOCIATED",
    chiefComplaintCategory: "CHEST_PAIN",
    clinicalDomain: "SOCRATES_ASSOCIATED",
    questionText: "Are you experiencing any shortness of breath, cold sweating, or dizziness?",
    questionTextHindi: "क्या आपको सांस फूलना, ठंडा पसीना या चक्कर आने की समस्या हो रही है?",
    questionType: "MULTI_CHOICE",
    options: [
      { value: "BREATHLESSNESS", labelHi: "सांस फूलना (Shortness of breath)", labelEn: "Shortness of breath", isRedFlag: true },
      { value: "DIAPHORESIS", labelHi: "अत्यधिक ठंडा पसीना (Cold Sweating)", labelEn: "Cold Sweating", isRedFlag: true },
      { value: "DIZZINESS", labelHi: "चक्कर आना (Dizziness / Giddiness)", labelEn: "Dizziness" },
      { value: "NONE", labelHi: "इनमें से कोई नहीं (None of these)", labelEn: "None" },
    ],
    redFlagTriggers: [
      {
        field: "CP_ASSOCIATED",
        expectedValue: "DIAPHORESIS",
        severity: "CRITICAL",
        description: "Chest pain associated with diaphoresis & dyspnea.",
        ruleId: "RF_CARDIAC_AUTONOMIC_SIGNS",
      },
    ],
    nextRules: [], // End of Chest pain triage tree
  },

  // ==========================================
  // JOINT PAIN DECISION TREE (AMAVATA / SANDHIGATA VATA)
  // ==========================================
  JP_LOCATION: {
    nodeCode: "JP_LOCATION",
    chiefComplaintCategory: "JOINT_PAIN",
    clinicalDomain: "SOCRATES_SITE",
    questionText: "Which joints are primarily painful?",
    questionTextHindi: "मुख्य रूप से किन जोड़ों में दर्द है?",
    questionType: "SINGLE_CHOICE",
    options: [
      { value: "KNEES_WRISTS_SMALL", labelHi: "घुटने, कलाइयां और उंगलियां (Knees, Wrists & Small joints)", labelEn: "Knees & Wrists" },
      { value: "LOWER_BACK_HIP", labelHi: "कमर और कूल्हे (Lower back & Hip)", labelEn: "Lower back & Hip" },
      { value: "SINGLE_LARGE_JOINT", labelHi: "केवल एक बड़ा जोड़ (Single Large Joint)", labelEn: "Single Large Joint" },
    ],
    nextRules: [{ targetNodeCode: "JP_MORNING_STIFFNESS" }],
  },

  JP_MORNING_STIFFNESS: {
    nodeCode: "JP_MORNING_STIFFNESS",
    chiefComplaintCategory: "JOINT_PAIN",
    clinicalDomain: "AMA_LAKSHANA",
    questionText: "Do you experience morning stiffness lasting more than 1 hour?",
    questionTextHindi: "क्या सुबह उठने पर जोड़ों में १ घंटे से अधिक जकड़न (Stiffness) रहती है?",
    questionType: "YES_NO",
    options: [
      { value: "YES", labelHi: "हाँ (Yes, >1 hr)", labelEn: "Yes" },
      { value: "NO", labelHi: "नहीं (No)", labelEn: "No" },
      { value: "NOT_SURE", labelHi: "पता नहीं (Not sure)", labelEn: "Not sure" },
    ],
    nextRules: [{ targetNodeCode: "JP_AGNI_HEAVY_FOOD" }],
  },

  JP_AGNI_HEAVY_FOOD: {
    nodeCode: "JP_AGNI_HEAVY_FOOD",
    chiefComplaintCategory: "JOINT_PAIN",
    clinicalDomain: "AGNI_AMA_INTERACTION",
    questionText: "Does the joint pain and stiffness increase after eating heavy or oily food?",
    questionTextHindi: "क्या भारी या तैलीय भोजन के बाद दर्द और पेट में भारीपन बढ़ जाता है?",
    questionType: "YES_NO",
    options: [
      { value: "YES", labelHi: "हाँ, बढ़ जाता है (Yes)", labelEn: "Yes" },
      { value: "NO", labelHi: "नहीं (No)", labelEn: "No" },
    ],
    nextRules: [],
  },
};

export class RuleBasedQuestionProvider implements QuestionProvider {
  async classifyComplaint(text: string): Promise<ComplaintCategory> {
    const lower = text.toLowerCase();
    if (lower.includes("chest") || lower.includes("सीना") || lower.includes("छाती") || lower.includes("dil") || lower.includes("heart") || lower.includes("हृदय")) {
      return "CHEST_PAIN";
    }
    if (lower.includes("head") || lower.includes("सिर") || lower.includes("headache") || lower.includes("migraine")) {
      return "HEADACHE";
    }
    if (lower.includes("stomach") || lower.includes("पेट") || lower.includes("abdomen") || lower.includes("gas") || lower.includes("acidity") || lower.includes("अम्लपित्त")) {
      return "ABDOMINAL_PAIN";
    }
    if (lower.includes("joint") || lower.includes("घुटने") || lower.includes("जोड़ों") || lower.includes("knee") || lower.includes("arthritis") || lower.includes("वात") || lower.includes("pain")) {
      return "JOINT_PAIN";
    }
    if (lower.includes("fever") || lower.includes("बुखार") || lower.includes("ताप") || lower.includes("jvara")) {
      return "FEVER";
    }
    return "GENERAL";
  }

  async getNodeByCode(nodeCode: string): Promise<EngineQuestionDefinition | null> {
    return SAMPLE_QUESTION_TREE[nodeCode] || null;
  }

  async getFirstNodeForCategory(category: ComplaintCategory): Promise<EngineQuestionDefinition | null> {
    switch (category) {
      case "CHEST_PAIN":
        return SAMPLE_QUESTION_TREE["CP_SEVERITY"] || null;
      case "JOINT_PAIN":
        return SAMPLE_QUESTION_TREE["JP_LOCATION"] || null;
      default:
        return SAMPLE_QUESTION_TREE["CP_SEVERITY"] || null;
    }
  }

  getNextNodeCode(
    currentNode: EngineQuestionDefinition,
    answer: unknown,
    facts: CollectedFacts
  ): string | null {
    if (!currentNode.nextRules || currentNode.nextRules.length === 0) {
      return null;
    }
    // Return first target rule in linear protocol
    return currentNode.nextRules[0]?.targetNodeCode || null;
  }
}

export const defaultQuestionProvider = new RuleBasedQuestionProvider();
