import { EngineQuestionDefinition, ComplaintCategory, QuestionProvider, CollectedFacts } from "./types";
import { CLINICAL_RED_FLAG_REGISTRY } from "./red-flag-rules";

export const COMPREHENSIVE_QUESTION_REGISTRY: Record<string, EngineQuestionDefinition> = {
  // ==============================================================================
  // 1. CHEST PAIN TREE (SOCRATES + ACS + DISSECTION RED FLAGS)
  // ==============================================================================
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
      { value: "TEARING_BACK", labelHi: "पीठ में चीरने जैसा तेज दर्द (Severe Tearing to Back)", labelEn: "Tearing into Back", isRedFlag: true },
      { value: "SHARP_STABBING", labelHi: "तेज चुभन जैसा (Sharp Stabbing)", labelEn: "Sharp Stabbing" },
      { value: "BURNING_ACIDIC", labelHi: "जलन / अम्लपित्त जैसा (Burning / Heartburn)", labelEn: "Burning / Heartburn" },
    ],
    redFlagTriggers: [CLINICAL_RED_FLAG_REGISTRY.RF_AORTIC_TEARING],
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
    redFlagTriggers: [CLINICAL_RED_FLAG_REGISTRY.RF_ACS_RADIATION],
    nextRules: [{ targetNodeCode: "CP_ASSOCIATED" }],
  },

  CP_ASSOCIATED: {
    nodeCode: "CP_ASSOCIATED",
    chiefComplaintCategory: "CHEST_PAIN",
    clinicalDomain: "SOCRATES_ASSOCIATED",
    questionText: "Are you experiencing any shortness of breath, cold sweating, or dizziness?",
    questionTextHindi: "क्या आपको सांस फूलना, ठंडा पसीना या चक्कर आने की समस्या हो रही है?",
    questionType: "SINGLE_CHOICE",
    options: [
      { value: "DIAPHORESIS", labelHi: "अत्यधिक ठंडा पसीना व घबराहट (Cold Sweating & Distress)", labelEn: "Cold Sweating", isRedFlag: true },
      { value: "BREATHLESSNESS", labelHi: "सांस फूलना (Shortness of Breath)", labelEn: "Breathlessness", isRedFlag: true },
      { value: "NONE", labelHi: "इनमें से कोई नहीं (None)", labelEn: "None" },
    ],
    redFlagTriggers: [CLINICAL_RED_FLAG_REGISTRY.RF_CARDIAC_AUTONOMIC_SIGNS],
    nextRules: [{ targetNodeCode: "CP_EXACERBATION" }],
  },

  CP_EXACERBATION: {
    nodeCode: "CP_EXACERBATION",
    chiefComplaintCategory: "CHEST_PAIN",
    clinicalDomain: "SOCRATES_EXACERBATING",
    questionText: "Does the chest pain increase with exertion or walking?",
    questionTextHindi: "क्या चलने या मेहनत करने पर दर्द बढ़ता है?",
    questionType: "YES_NO",
    options: [
      { value: "YES", labelHi: "हाँ (Yes, on exertion)", labelEn: "Yes" },
      { value: "NO", labelHi: "नहीं (No)", labelEn: "No" },
    ],
    nextRules: [],
  },

  // ==============================================================================
  // 2. HEADACHE / NEUROLOGICAL TREE (FAST + THUNDERCLAP + MENINGISM)
  // ==============================================================================
  HA_ONSET: {
    nodeCode: "HA_ONSET",
    chiefComplaintCategory: "HEADACHE",
    clinicalDomain: "SOCRATES_ONSET",
    questionText: "Did the headache start suddenly like a thunderclap within seconds?",
    questionTextHindi: "क्या सिरदर्द अचानक कुछ सेकंडों में अत्यधिक तीव्र गति से शुरू हुआ?",
    questionType: "SINGLE_CHOICE",
    options: [
      { value: "THUNDERCLAP_SUDDEN", labelHi: "अचानक अत्यधिक तेज (Thunderclap Sudden)", labelEn: "Sudden explosive", isRedFlag: true },
      { value: "GRADUAL_HOURS", labelHi: "धीरे-धीरे कई घंटों में (Gradual over hours)", labelEn: "Gradual" },
    ],
    redFlagTriggers: [CLINICAL_RED_FLAG_REGISTRY.RF_HEADACHE_THUNDERCLAP],
    nextRules: [{ targetNodeCode: "HA_NEURO_DEFICIT" }],
  },

  HA_NEURO_DEFICIT: {
    nodeCode: "HA_NEURO_DEFICIT",
    chiefComplaintCategory: "HEADACHE",
    clinicalDomain: "NEUROLOGICAL_SIGNS",
    questionText: "Are you experiencing weakness in arms, face drooping, or difficulty speaking?",
    questionTextHindi: "क्या आपको चेहरे पर तिरछापन, हाथ में कमजोरी या बोलने में लड़खड़ाहट है?",
    questionType: "SINGLE_CHOICE",
    options: [
      { value: "FACIAL_OR_ARM_WEAKNESS", labelHi: "हाँ, कमजोरी/तिरछापन है (Yes, weakness / FAST sign)", labelEn: "Yes, weakness", isRedFlag: true },
      { value: "NO", labelHi: "नहीं (No weakness)", labelEn: "No" },
    ],
    redFlagTriggers: [CLINICAL_RED_FLAG_REGISTRY.RF_STROKE_FAST_SIGNS],
    nextRules: [{ targetNodeCode: "HA_ASSOCIATED" }],
  },

  HA_ASSOCIATED: {
    nodeCode: "HA_ASSOCIATED",
    chiefComplaintCategory: "HEADACHE",
    clinicalDomain: "SOCRATES_ASSOCIATED",
    questionText: "Do you have neck stiffness, high fever, or light sensitivity?",
    questionTextHindi: "क्या आपकी गर्दन में अकड़न, तेज बुखार या रोशनी से तेज परेशानी है?",
    questionType: "SINGLE_CHOICE",
    options: [
      { value: "NECK_STIFFNESS_FEVER", labelHi: "गर्दन अकड़न व तेज बुखार (Neck stiffness & fever)", labelEn: "Neck stiffness", isRedFlag: true },
      { value: "MILD_NAUSEA", labelHi: "हल्की मिचली / उल्टी (Mild nausea)", labelEn: "Mild nausea" },
      { value: "NONE", labelHi: "कोई नहीं (None)", labelEn: "None" },
    ],
    redFlagTriggers: [CLINICAL_RED_FLAG_REGISTRY.RF_HEADACHE_MENINGISM],
    nextRules: [],
  },

  // ==============================================================================
  // 3. ABDOMINAL PAIN TREE (ACUTE ABDOMEN & GI BLEED)
  // ==============================================================================
  ABD_LOCATION: {
    nodeCode: "ABD_LOCATION",
    chiefComplaintCategory: "ABDOMINAL_PAIN",
    clinicalDomain: "SOCRATES_SITE",
    questionText: "Where in your abdomen is the pain located?",
    questionTextHindi: "पेट में किस जगह दर्द सबसे ज्यादा है?",
    questionType: "SINGLE_CHOICE",
    options: [
      { value: "EPIGASTRIC_UPPER", labelHi: "पेट के ऊपरी हिस्से में / छाती के नीचे (Upper / Epigastric)", labelEn: "Upper Abdomen" },
      { value: "RIGHT_LOWER", labelHi: "पेट के निचले दाएं हिस्से में (Right Lower Side - Appendicitis area)", labelEn: "Right Lower" },
      { value: "DIFFUSE_ALL_OVER", labelHi: "पूरे पेट में फैला हुआ (All over abdomen)", labelEn: "Diffuse" },
    ],
    nextRules: [{ targetNodeCode: "ABD_CHARACTER" }],
  },

  ABD_CHARACTER: {
    nodeCode: "ABD_CHARACTER",
    chiefComplaintCategory: "ABDOMINAL_PAIN",
    clinicalDomain: "SOCRATES_CHARACTER",
    questionText: "Is your abdomen soft or hard like a wooden board?",
    questionTextHindi: "क्या आपका पेट छूने पर नरम है या लकड़ी के तख्ते जैसा सख्त (Rigid) है?",
    questionType: "SINGLE_CHOICE",
    options: [
      { value: "BOARD_LIKE_RIGIDITY", labelHi: "तख्ते जैसा अत्यधिक सख्त (Board-like hard & rigid)", labelEn: "Board-like rigid", isRedFlag: true },
      { value: "SOFT_TENDER", labelHi: "नरम लेकिन दबाने पर दर्द (Soft but tender)", labelEn: "Soft" },
    ],
    redFlagTriggers: [CLINICAL_RED_FLAG_REGISTRY.RF_ACUTE_ABDOMEN_RIGIDITY],
    nextRules: [{ targetNodeCode: "ABD_BLEEDING" }],
  },

  ABD_BLEEDING: {
    nodeCode: "ABD_BLEEDING",
    chiefComplaintCategory: "ABDOMINAL_PAIN",
    clinicalDomain: "GI_BLEED_EVALUATION",
    questionText: "Have you had vomiting of blood or passed black tarry stools?",
    questionTextHindi: "क्या आपको खून की उल्टी हुई है या काले रंग का मल (Black Stool) आया है?",
    questionType: "SINGLE_CHOICE",
    options: [
      { value: "VOMITING_BLOOD", labelHi: "खून की उल्टी (Vomiting blood)", labelEn: "Vomiting blood", isRedFlag: true },
      { value: "BLACK_TARRY_STOOL", labelHi: "काले रंग का मल (Black tarry stool)", labelEn: "Black stool", isRedFlag: true },
      { value: "NO_BLEEDING", labelHi: "नहीं, कोई खून नहीं (No bleeding signs)", labelEn: "No bleeding" },
    ],
    redFlagTriggers: [
      CLINICAL_RED_FLAG_REGISTRY.RF_GI_BLEED_HEMATEMESIS,
      CLINICAL_RED_FLAG_REGISTRY.RF_GI_BLEED_MELENA,
    ],
    nextRules: [],
  },

  // ==============================================================================
  // 4. FEVER & INFECTION TREE
  // ==============================================================================
  FEVER_DURATION: {
    nodeCode: "FEVER_DURATION",
    chiefComplaintCategory: "FEVER",
    clinicalDomain: "INFECTION_DURATION",
    questionText: "How many days have you had this fever?",
    questionTextHindi: "आपको कितने दिनों से बुखार आ रहा है?",
    questionType: "SINGLE_CHOICE",
    options: [
      { value: "ACUTE_1_3_DAYS", labelHi: "१ से ३ दिन (1-3 days)", labelEn: "1-3 days" },
      { value: "PROLONGED_OVER_1_WEEK", labelHi: "१ सप्ताह से अधिक (Over 1 week)", labelEn: "Over 1 week" },
    ],
    nextRules: [{ targetNodeCode: "FEVER_NEURO" }],
  },

  FEVER_NEURO: {
    nodeCode: "FEVER_NEURO",
    chiefComplaintCategory: "FEVER",
    clinicalDomain: "SEPSIS_ENCEPHALITIS_CHECK",
    questionText: "Is the patient showing signs of drowsiness, confusion, or talking unusually?",
    questionTextHindi: "क्या रोगी को अत्यधिक बेहोशी, भ्रम या असामान्य बातचीत की समस्या है?",
    questionType: "SINGLE_CHOICE",
    options: [
      { value: "CONFUSION_DROWSINESS", labelHi: "हाँ, भ्रम/बेहोशी है (Yes, confused/drowsy)", labelEn: "Confusion / Drowsiness", isRedFlag: true },
      { value: "FULLY_ALERT", labelHi: "पूर्णतः सचेत हैं (Fully alert)", labelEn: "Fully alert" },
    ],
    redFlagTriggers: [CLINICAL_RED_FLAG_REGISTRY.RF_FEVER_ALTERED_SENSORIUM],
    nextRules: [{ targetNodeCode: "FEVER_RESPIRATORY" }],
  },

  FEVER_RESPIRATORY: {
    nodeCode: "FEVER_RESPIRATORY",
    chiefComplaintCategory: "FEVER",
    clinicalDomain: "PNEUMONIA_SEVERITY",
    questionText: "Is there severe breathlessness or bluish discoloration of lips?",
    questionTextHindi: "क्या सांस लेने में बहुत कठिनाई या होठों का नीला पड़ना है?",
    questionType: "SINGLE_CHOICE",
    options: [
      { value: "SEVERE_BREATHLESSNESS", labelHi: "हाँ, सांस में गंभीर कष्ट है (Severe breathlessness)", labelEn: "Severe breathlessness", isRedFlag: true },
      { value: "MILD_COUGH_ONLY", labelHi: "केवल हल्की खांसी (Mild cough only)", labelEn: "Mild cough only" },
      { value: "NONE", labelHi: "कोई नहीं (None)", labelEn: "None" },
    ],
    redFlagTriggers: [CLINICAL_RED_FLAG_REGISTRY.RF_FEVER_SEVERE_DYSPNEA],
    nextRules: [],
  },

  // ==============================================================================
  // 5. JOINT PAIN TREE (AMAVATA / SEPTIC ARTHRITIS)
  // ==============================================================================
  JP_LOCATION: {
    nodeCode: "JP_LOCATION",
    chiefComplaintCategory: "JOINT_PAIN",
    clinicalDomain: "SOCRATES_SITE",
    questionText: "Which joints are primarily painful?",
    questionTextHindi: "मुख्य रूप से किन जोड़ों में दर्द है?",
    questionType: "SINGLE_CHOICE",
    options: [
      { value: "KNEES_WRISTS_SMALL", labelHi: "घुटने, कलाइयां और उंगलियां (Knees & Wrists)", labelEn: "Knees & Wrists" },
      { value: "LOWER_BACK_HIP", labelHi: "कमर और कूल्हे (Lower back & Hip)", labelEn: "Lower back & Hip" },
      { value: "SINGLE_LARGE_JOINT", labelHi: "केवल एक बड़ा जोड़ (Single Large Joint)", labelEn: "Single Large Joint" },
    ],
    nextRules: [{ targetNodeCode: "JP_SIGNS" }],
  },

  JP_SIGNS: {
    nodeCode: "JP_SIGNS",
    chiefComplaintCategory: "JOINT_PAIN",
    clinicalDomain: "SEPTIC_ARTHRITIS_CHECK",
    questionText: "Is any single joint extremely hot, red, and completely impossible to touch or bear weight?",
    questionTextHindi: "क्या कोई जोड़ अत्यधिक लाल, गर्म और छूने या वजन डालने पर असहनीय है?",
    questionType: "SINGLE_CHOICE",
    options: [
      { value: "HOT_RED_INABILITY_TO_BEAR_WEIGHT", labelHi: "अत्यधिक लाल, गर्म व चलने में असमर्थ (Hot, Red, Septic sign)", labelEn: "Hot & Red", isRedFlag: true },
      { value: "STIFF_ACHY_ONLY", labelHi: "केवल जकड़न व दर्द (Stiff & Achy)", labelEn: "Stiff & Achy" },
    ],
    redFlagTriggers: [CLINICAL_RED_FLAG_REGISTRY.RF_SEPTIC_ARTHRITIS],
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
    ],
    nextRules: [],
  },

  // ==============================================================================
  // 6. GENERAL / SYSTEMIC INTAKE & LIFESTYLE QUERIES
  // ==============================================================================
  GEN_ALLERGY: {
    nodeCode: "GEN_ALLERGY",
    chiefComplaintCategory: "GENERAL",
    clinicalDomain: "ANAPHYLAXIS_SAFETY",
    questionText: "Are you experiencing sudden swelling of lips/tongue or whistling sound while breathing?",
    questionTextHindi: "क्या अचानक होठों/जीभ में सूजन या सांस लेते समय सीटी जैसी आवाज आ रही है?",
    questionType: "SINGLE_CHOICE",
    options: [
      { value: "STRIDOR_LIP_SWELLING", labelHi: "हाँ, होठों में सूजन व सांस में सीटी (Lip swelling / Stridor)", labelEn: "Anaphylaxis signs", isRedFlag: true },
      { value: "NO", labelHi: "नहीं (No)", labelEn: "No" },
    ],
    redFlagTriggers: [CLINICAL_RED_FLAG_REGISTRY.RF_ANAPHYLAXIS_AIRWAY],
    nextRules: [{ targetNodeCode: "GEN_DURATION" }],
  },

  GEN_DURATION: {
    nodeCode: "GEN_DURATION",
    chiefComplaintCategory: "GENERAL",
    clinicalDomain: "GENERAL_DURATION",
    questionText: "How long have you been experiencing this problem?",
    questionTextHindi: "यह मुख्य समस्या आपको कितने समय से हो रही है?",
    questionType: "SINGLE_CHOICE",
    options: [
      { value: "HOURS_1_24", labelHi: "आज ही शुरू हुआ (Within last 24 hours)", labelEn: "Within 24 hours" },
      { value: "DAYS_1_7", labelHi: "कुछ दिनों से (1 to 7 days)", labelEn: "1 to 7 days" },
      { value: "WEEKS_1_4", labelHi: "कुछ हफ्तों से (1 to 4 weeks)", labelEn: "1 to 4 weeks" },
      { value: "CHRONIC_MONTHS", labelHi: "महीनों या लंबे समय से (Over a month)", labelEn: "More than a month" },
    ],
    nextRules: [{ targetNodeCode: "GEN_CHRONIC_CONDITIONS" }],
  },

  // NEW GENERAL QUERY 1: Chronic Comorbidities (Diabetes / Hypertension / Thyroid)
  GEN_CHRONIC_CONDITIONS: {
    nodeCode: "GEN_CHRONIC_CONDITIONS",
    chiefComplaintCategory: "GENERAL",
    clinicalDomain: "PAST_MEDICAL_HISTORY",
    questionText: "Do you have any existing chronic conditions like High Blood Pressure, Diabetes, or Thyroid?",
    questionTextHindi: "क्या आपको पहले से उच्च रक्तचाप (BP), मधुमेह (शुगर) या थायरॉयड जैसी कोई पुरानी बीमारी है?",
    questionType: "SINGLE_CHOICE",
    options: [
      { value: "DIABETES_HTN", labelHi: "हाँ, बीपी या शुगर की समस्या है (Diabetes / High BP)", labelEn: "Diabetes or Hypertension" },
      { value: "THYROID_HEART", labelHi: "थायरॉयड या हृदय संबंधी समस्या (Thyroid / Cardiac History)", labelEn: "Thyroid or Cardiac" },
      { value: "MULTIPLE_CHRONIC", labelHi: "एक से अधिक पुरानी बीमारियां (Multiple chronic conditions)", labelEn: "Multiple chronic conditions" },
      { value: "NONE", labelHi: "नहीं, कोई पुरानी बीमारी नहीं (None / Healthy past)", labelEn: "None reported" },
    ],
    nextRules: [{ targetNodeCode: "GEN_MEDICATION_ALLERGY" }],
  },

  // NEW GENERAL QUERY 2: Known Drug & Food Allergies
  GEN_MEDICATION_ALLERGY: {
    nodeCode: "GEN_MEDICATION_ALLERGY",
    chiefComplaintCategory: "GENERAL",
    clinicalDomain: "ALLERGY_SAFETY",
    questionText: "Do you have any known allergies to specific medicines (like Penicillin, Sulfa) or foods?",
    questionTextHindi: "क्या आपको किसी दवा (जैसे पेनिसिलिन, सल्फा) या विशेष खाद्य पदार्थ से कोई एलर्जी है?",
    questionType: "SINGLE_CHOICE",
    options: [
      { value: "DRUG_ALLERGY_YES", labelHi: "हाँ, किसी खास दवा से एलर्जी है (Yes, Drug allergy)", labelEn: "Yes, Medication allergy" },
      { value: "FOOD_ALLERGY_YES", labelHi: "हाँ, खाद्य एलर्जी है (Yes, Food allergy)", labelEn: "Yes, Food allergy" },
      { value: "NO_KNOWN_ALLERGIES", labelHi: "नहीं, कोई एलर्जी नहीं है (NKDA - No Known Allergies)", labelEn: "No Known Drug Allergies (NKDA)" },
    ],
    nextRules: [{ targetNodeCode: "GEN_DIGESTION_APPETITE" }],
  },

  // NEW GENERAL QUERY 3: Appetite & Digestion (Agni status)
  GEN_DIGESTION_APPETITE: {
    nodeCode: "GEN_DIGESTION_APPETITE",
    chiefComplaintCategory: "GENERAL",
    clinicalDomain: "AGNI_APPETITE_EVALUATION",
    questionText: "How is your daily appetite and digestion?",
    questionTextHindi: "आपकी रोजाना की भूख और खाना पचने की स्थिति कैसी रहती है?",
    questionType: "SINGLE_CHOICE",
    options: [
      { value: "NORMAL_HEALTHY", labelHi: "सामान्य व संतुलित भूख (Normal & healthy digestion)", labelEn: "Normal & healthy" },
      { value: "LOSS_OF_APPETITE", labelHi: "भूख में कमी व अरुचि (Loss of appetite / Anorexia)", labelEn: "Loss of appetite" },
      { value: "ACIDITY_BLOATING", labelHi: "गैस, अफरा व खट्टी डकारें (Acidity, gas & bloating)", labelEn: "Acidity & bloating" },
      { value: "IRREGULAR", labelHi: "कभी बहुत ज्यादा, कभी बिल्कुल नहीं (Irregular appetite)", labelEn: "Irregular appetite" },
    ],
    nextRules: [{ targetNodeCode: "GEN_SLEEP_FATIGUE" }],
  },

  // NEW GENERAL QUERY 4: Sleep Quality & Energy (Nidra & Ojas)
  GEN_SLEEP_FATIGUE: {
    nodeCode: "GEN_SLEEP_FATIGUE",
    chiefComplaintCategory: "GENERAL",
    clinicalDomain: "SLEEP_ENERGY_ASSESSMENT",
    questionText: "How has your sleep quality and daytime energy been recently?",
    questionTextHindi: "हाल ही में आपकी रात की नींद और दिन की ऊर्जा (स्फूर्ति) कैसी रही है?",
    questionType: "SINGLE_CHOICE",
    options: [
      { value: "SOUND_RESTFUL", labelHi: "गहरी व आरामदायक नींद, दिनभर स्फूर्ति (Sound sleep & energetic)", labelEn: "Sound sleep & energetic" },
      { value: "POOR_DISTURBED", labelHi: "बार-बार नींद टूटना व बेचैनी (Disturbed / Insomnia)", labelEn: "Disturbed sleep / Insomnia" },
      { value: "EXCESSIVE_FATIGUE", labelHi: "दिनभर अत्यधिक थकान व कमजोरी (Chronic fatigue / Lethargy)", labelEn: "Chronic fatigue & weakness" },
    ],
    nextRules: [{ targetNodeCode: "GEN_WATER_INTAKE" }],
  },

  // NEW GENERAL QUERY 5: Daily Hydration & Urination (Mutra & Udaka)
  GEN_WATER_INTAKE: {
    nodeCode: "GEN_WATER_INTAKE",
    chiefComplaintCategory: "GENERAL",
    clinicalDomain: "HYDRATION_URINARY_HEALTH",
    questionText: "How much water do you drink daily and is there any burning during urination?",
    questionTextHindi: "आप रोजाना लगभग कितना पानी पीते हैं और क्या पेशाब में कोई जलन या दर्द होता है?",
    questionType: "SINGLE_CHOICE",
    options: [
      { value: "ADEQUATE_NO_BURNING", labelHi: "२ से ३ लीटर, पेशाब में कोई जलन नहीं (Adequate water, no burning)", labelEn: "2-3 Litres, normal urination" },
      { value: "BURNING_MICTURITION", labelHi: "पेशाब में जलन या बार-बार जाना (Burning sensation / Dysuria)", labelEn: "Burning sensation during urination" },
      { value: "LOW_WATER_INTAKE", labelHi: "दिनभर में १ लीटर से भी कम पानी (Very low fluid intake)", labelEn: "Less than 1 Litre daily" },
    ],
    nextRules: [{ targetNodeCode: "GEN_BOWEL_REGULARITY" }],
  },

  // NEW GENERAL QUERY 6: Bowel Regularity (Koshtha & Mala)
  GEN_BOWEL_REGULARITY: {
    nodeCode: "GEN_BOWEL_REGULARITY",
    chiefComplaintCategory: "GENERAL",
    clinicalDomain: "BOWEL_HEALTH",
    questionText: "Do you experience regular bowel movements or suffer from constipation / loose stools?",
    questionTextHindi: "क्या आपका पेट रोजाना नियमित साफ होता है या कब्जियत / दस्त की समस्या रहती है?",
    questionType: "SINGLE_CHOICE",
    options: [
      { value: "REGULAR_DAILY", labelHi: "रोजाना सुबह आसानी से साफ (Regular clean bowel daily)", labelEn: "Regular daily movements" },
      { value: "CHRONIC_CONSTIPATION", labelHi: "कड़ा मल या २-३ दिन में साफ होना (Constipation / Hard stool)", labelEn: "Constipation / Hard stools" },
      { value: "LOOSE_FREQUENT", labelHi: "बार-बार पतला दस्त आना (Loose frequent stools)", labelEn: "Loose / Frequent stools" },
    ],
    nextRules: [{ targetNodeCode: "GEN_PHYSICAL_ACTIVITY" }],
  },

  // NEW GENERAL QUERY 7: Physical Activity & Sedentary Habit
  GEN_PHYSICAL_ACTIVITY: {
    nodeCode: "GEN_PHYSICAL_ACTIVITY",
    chiefComplaintCategory: "GENERAL",
    clinicalDomain: "LIFESTYLE_EXERCISE",
    questionText: "What is your typical daily physical activity or exercise routine?",
    questionTextHindi: "आपकी दैनिक शारीरिक गतिविधि या व्यायाम की दिनचर्या कैसी है?",
    questionType: "SINGLE_CHOICE",
    options: [
      { value: "REGULAR_WALK_EXERCISE", labelHi: "रोजाना ३० मिनट टहलना या योग (Daily walking / Yoga)", labelEn: "Daily walking or exercise (>30 mins)" },
      { value: "MODERATE_HOUSEHOLD", labelHi: "घर का सामान्य काम (Moderate household chores)", labelEn: "Moderate daily routine" },
      { value: "SEDENTARY_DESK", labelHi: "अधिकांश समय बैठकर काम करना (Sedentary / Desk job)", labelEn: "Mostly sitting / Sedentary" },
    ],
    nextRules: [{ targetNodeCode: "GEN_STRESS_MENTAL" }],
  },

  // NEW GENERAL QUERY 8: Stress & Emotional Balance (Manasika Bhavas)
  GEN_STRESS_MENTAL: {
    nodeCode: "GEN_STRESS_MENTAL",
    chiefComplaintCategory: "GENERAL",
    clinicalDomain: "MENTAL_WELLBEING",
    questionText: "How would you describe your current stress or anxiety levels?",
    questionTextHindi: "आप अपने वर्तमान मानसिक तनाव या चिंता के स्तर को कैसा बताएंगे?",
    questionType: "SINGLE_CHOICE",
    options: [
      { value: "MILD_MANAGED", labelHi: "शांत व सामान्य (Calm & well-managed)", labelEn: "Calm & manageable" },
      { value: "MODERATE_STRESS", labelHi: "काम या पारिवारिक तनाव (Moderate daily stress)", labelEn: "Moderate work/family stress" },
      { value: "HIGH_ANXIETY", labelHi: "अत्यधिक तनाव, घबराहट या चिंता (High stress & anxiety)", labelEn: "Severe stress / Anxiety" },
    ],
    nextRules: [],
  },

};

export class ComprehensiveQuestionProvider implements QuestionProvider {
  async classifyComplaint(text: string): Promise<ComplaintCategory> {
    const lower = text.toLowerCase();
    if (lower.includes("chest") || lower.includes("सीना") || lower.includes("छाती") || lower.includes("heart") || lower.includes("हृदय")) {
      return "CHEST_PAIN";
    }
    if (lower.includes("head") || lower.includes("सिर") || lower.includes("migraine") || lower.includes("headache")) {
      return "HEADACHE";
    }
    if (lower.includes("stomach") || lower.includes("पेट") || lower.includes("abdomen") || lower.includes("gas") || lower.includes("acidity") || lower.includes("अम्लपित्त")) {
      return "ABDOMINAL_PAIN";
    }
    if (lower.includes("fever") || lower.includes("बुखार") || lower.includes("ताप") || lower.includes("jvara") || lower.includes("chills")) {
      return "FEVER";
    }
    if (lower.includes("joint") || lower.includes("घुटने") || lower.includes("जोड़ों") || lower.includes("knee") || lower.includes("arthritis") || lower.includes("वात")) {
      return "JOINT_PAIN";
    }
    return "GENERAL";
  }

  async getNodeByCode(nodeCode: string): Promise<EngineQuestionDefinition | null> {
    return COMPREHENSIVE_QUESTION_REGISTRY[nodeCode] || null;
  }

  async getFirstNodeForCategory(category: ComplaintCategory): Promise<EngineQuestionDefinition | null> {
    switch (category) {
      case "CHEST_PAIN":
        return COMPREHENSIVE_QUESTION_REGISTRY["CP_SEVERITY"] || null;
      case "HEADACHE":
        return COMPREHENSIVE_QUESTION_REGISTRY["HA_ONSET"] || null;
      case "ABDOMINAL_PAIN":
        return COMPREHENSIVE_QUESTION_REGISTRY["ABD_LOCATION"] || null;
      case "FEVER":
        return COMPREHENSIVE_QUESTION_REGISTRY["FEVER_DURATION"] || null;
      case "JOINT_PAIN":
        return COMPREHENSIVE_QUESTION_REGISTRY["JP_LOCATION"] || null;
      case "GENERAL":
      default:
        return COMPREHENSIVE_QUESTION_REGISTRY["GEN_ALLERGY"] || null;
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
    return currentNode.nextRules[0]?.targetNodeCode || null;
  }
}

export const defaultQuestionProvider = new ComprehensiveQuestionProvider();
