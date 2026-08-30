export interface FamilyHistoryEntry {
  condition: string; // e.g. Diabetes, Hypertension, CAD, Stroke, Cancer, Tuberculosis
  conditionHindi: string;
  relation: "FATHER" | "MOTHER" | "SIBLING" | "GRANDPARENT" | "MULTIPLE" | "NONE";
  relationHindi: string;
  notes?: string;
}

export interface SocialHistoryData {
  occupation?: string;
  smokingStatus: "NEVER" | "FORMER" | "CURRENT_SMOKER" | "NOT_SPECIFIED";
  packYears?: number;
  alcoholIntake: "NONE" | "OCCASIONAL" | "REGULAR" | "HEAVY";
  tobaccoOrGutka: "NONE" | "OCCASIONAL" | "DAILY";
  dietPattern: "VEGETARIAN" | "NON_VEGETARIAN" | "OVO_VEGETARIAN" | "VEGAN";
  physicalActivity: "SEDENTARY" | "MODERATE" | "ACTIVE";
  sleepPattern: "NORMAL_6_8_HRS" | "DISTURBED_INSOMNIA" | "EXCESSIVE";
}

export interface ObstetricGynecologicalHistory {
  applicable: boolean;
  maritalStatus?: "MARRIED" | "UNMARRIED" | "WIDOWED" | "DIVORCED";
  gravidaParaAbortion?: {
    gravida: number; // Total pregnancies
    para: number; // Term births
    abortions: number; // Miscarriages/terminations
    livingChildren: number;
  };
  lastMenstrualPeriod?: string; // Date / string representation
  menstrualRegularity: "REGULAR" | "IRREGULAR" | "POST_MENOPAUSAL" | "NOT_SPECIFIED";
  contraceptionMethod?: "NONE" | "OCP" | "IUD_COPPER_T" | "BARRIER" | "PERMANENT";
  previousComplications?: string; // e.g. GDM, Pre-eclampsia, PPH
}

export interface ComprehensivePatientHistory {
  familyHistory: FamilyHistoryEntry[];
  socialHistory: SocialHistoryData;
  obstetricHistory?: ObstetricGynecologicalHistory;
}

/**
 * Common standard options and questions for structured history taking in Indian OPDs
 */
export const STRUCTURED_HISTORY_QUESTION_NODES = {
  // --- FAMILY HISTORY ---
  FH_DIABETES_HTN: {
    nodeCode: "FH_DIABETES_HTN",
    chiefComplaintCategory: "GENERAL" as const,
    clinicalDomain: "FAMILY_HISTORY",
    questionText: "Does anyone in your direct family (Parents, Siblings) have Diabetes or High Blood Pressure (Hypertension)?",
    questionTextHindi: "क्या आपके परिवार (माता-पिता, भाई-बहन) में किसी को शुगर (डायबिटीज) या उच्च रक्तचाप (BP) की बीमारी है?",
    questionType: "SINGLE_CHOICE" as const,
    options: [
      { value: "YES_PARENTS", labelHi: "हाँ, माता या पिता को (Yes, Parents)", labelEn: "Yes, Parents" },
      { value: "YES_SIBLINGS", labelHi: "हाँ, भाई या बहन को (Yes, Siblings)", labelEn: "Yes, Siblings" },
      { value: "YES_BOTH", labelHi: "हाँ, दोनों को है (Yes, Multiple)", labelEn: "Yes, Both" },
      { value: "NO", labelHi: "नहीं, किसी को नहीं (No family history)", labelEn: "No" },
      { value: "DONT_KNOW", labelHi: "जानकारी नहीं है (Don't Know)", labelEn: "Don't Know" },
    ],
  },
  FH_CARDIAC_STROKE: {
    nodeCode: "FH_CARDIAC_STROKE",
    chiefComplaintCategory: "GENERAL" as const,
    clinicalDomain: "FAMILY_HISTORY",
    questionText: "Is there any family history of Heart Attack, Stroke, or early sudden cardiac death?",
    questionTextHindi: "क्या परिवार में किसी को दिल का दौरा (हार्ट अटैक), लकवा (स्ट्रोक) या असामयिक मृत्यु का इतिहास है?",
    questionType: "SINGLE_CHOICE" as const,
    options: [
      { value: "YES_HEART_ATTACK", labelHi: "हाँ, हार्ट अटैक का इतिहास (Yes, Heart Attack)", labelEn: "Yes, Heart Attack", isRedFlag: false },
      { value: "YES_STROKE", labelHi: "हाँ, लकवा/स्ट्रोक (Yes, Stroke)", labelEn: "Yes, Stroke" },
      { value: "NO", labelHi: "नहीं (No)", labelEn: "No" },
      { value: "DONT_KNOW", labelHi: "पता नहीं (Don't Know)", labelEn: "Don't Know" },
    ],
  },

  // --- SOCIAL & LIFESTYLE HISTORY ---
  SOC_HABITS: {
    nodeCode: "SOC_HABITS",
    chiefComplaintCategory: "GENERAL" as const,
    clinicalDomain: "SOCIAL_HISTORY",
    questionText: "Do you consume Tobacco/Gutka, Smoke Bidi/Cigarettes, or drink Alcohol?",
    questionTextHindi: "क्या आप तंबाकू/गुटखा, बीड़ी/सिगरेट या शराब का सेवन करते हैं?",
    questionType: "SINGLE_CHOICE" as const,
    options: [
      { value: "SMOKING_REGULAR", labelHi: "बीड़ी / सिगरेट (Smoking)", labelEn: "Smoking" },
      { value: "TOBACCO_GUTKA", labelHi: "तंबाकू / गुटखा (Tobacco/Gutka)", labelEn: "Tobacco/Gutka" },
      { value: "ALCOHOL_OCCASIONAL", labelHi: "शराब / मद्यपान (Alcohol)", labelEn: "Alcohol" },
      { value: "MULTIPLE_HABITS", labelHi: "एक से अधिक व्यसन (Multiple)", labelEn: "Multiple" },
      { value: "NONE_NEVER", labelHi: "कोई व्यसन नहीं (No habits - Clean)", labelEn: "None / Never" },
    ],
  },
  SOC_DIET_ACTIVITY: {
    nodeCode: "SOC_DIET_ACTIVITY",
    chiefComplaintCategory: "GENERAL" as const,
    clinicalDomain: "SOCIAL_HISTORY",
    questionText: "What is your regular dietary pattern and daily physical activity level?",
    questionTextHindi: "आपका खान-पान (आहार) और दैनिक शारीरिक श्रम/व्यायाम कैसा है?",
    questionType: "SINGLE_CHOICE" as const,
    options: [
      { value: "VEG_MODERATE", labelHi: "शाकाहारी + मध्यम व्यायाम (Vegetarian + Moderate)", labelEn: "Vegetarian + Moderate" },
      { value: "VEG_SEDENTARY", labelHi: "शाकाहारी + कम शारीरिक श्रम (Vegetarian + Sedentary)", labelEn: "Vegetarian + Sedentary" },
      { value: "NONVEG_MODERATE", labelHi: "मांसाहारी/मिश्रित + मध्यम व्यायाम (Mixed + Moderate)", labelEn: "Non-Veg + Moderate" },
      { value: "NONVEG_SEDENTARY", labelHi: "मांसाहारी + कम शारीरिक श्रम (Mixed + Sedentary)", labelEn: "Non-Veg + Sedentary" },
    ],
  },

  // --- OBSTETRIC & GYNECOLOGICAL (FEMALE PATIENTS) ---
  OBS_MENSTRUAL: {
    nodeCode: "OBS_MENSTRUAL",
    chiefComplaintCategory: "GENERAL" as const,
    clinicalDomain: "OBSTETRIC_GYNECOLOGICAL",
    questionText: "What is the status of your menstrual cycles (Periods)?",
    questionTextHindi: "आपकी मासिक धर्म (Periods/महावारी) की क्या स्थिति है?",
    questionType: "SINGLE_CHOICE" as const,
    options: [
      { value: "REGULAR_MONTHLY", labelHi: "नियमित हर महीने (Regular monthly)", labelEn: "Regular Monthly" },
      { value: "IRREGULAR_DELAYED", labelHi: "अनियमित या दर्दनाक (Irregular / Dysmenorrhea)", labelEn: "Irregular / Painful" },
      { value: "MENOPAUSE", labelHi: "माहवारी बंद हो चुकी है (Menopause attained)", labelEn: "Post-Menopausal" },
      { value: "PREGNANT_CURRENT", labelHi: "वर्तमान में गर्भवती (Currently Pregnant)", labelEn: "Currently Pregnant" },
      { value: "NOT_APPLICABLE", labelHi: "लागू नहीं / बताना नहीं चाहते (Skip)", labelEn: "Skip / Not Applicable" },
    ],
  },
  OBS_OBSTETRIC_HISTORY: {
    nodeCode: "OBS_OBSTETRIC_HISTORY",
    chiefComplaintCategory: "GENERAL" as const,
    clinicalDomain: "OBSTETRIC_GYNECOLOGICAL",
    questionText: "Obstetric history: Have you had previous deliveries or miscarriages?",
    questionTextHindi: "प्रसूति इतिहास: क्या आपके बच्चे हैं या कभी गर्भपात (Miscarriage) हुआ है?",
    questionType: "SINGLE_CHOICE" as const,
    options: [
      { value: "CHILDREN_NORMAL", labelHi: "हाँ, सामान्य प्रसव (Children, normal deliveries)", labelEn: "Normal deliveries" },
      { value: "CESAREAN_SECTION", labelHi: "हाँ, सिजेरियन ऑपरेशन द्वारा (Cesarean / LSCS)", labelEn: "Cesarean" },
      { value: "HISTORY_MISCARRIAGE", labelHi: "गर्भपात का इतिहास (History of miscarriage/abortion)", labelEn: "Miscarriage history" },
      { value: "NULLIPARA_NO_PREG", labelHi: "कोई गर्भावस्था नहीं (No prior pregnancies)", labelEn: "Nulliparous" },
      { value: "SKIP", labelHi: "छोड़ें (Skip)", labelEn: "Skip" },
    ],
  },
};
