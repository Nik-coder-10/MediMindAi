/**
 * Dynamic Adaptive Question Generator Service
 * SIH 2026 Problem 26047 - AyurSetu
 *
 * Dynamically synthesizes 5-8 clinically relevant, SOCRATES/Dashavidha-aligned
 * follow-up questions from patient chief complaint free text (Hindi, English, Hinglish).
 */

export type ClinicalCategory =
  | "Musculoskeletal"
  | "Chest Pain"
  | "Headache"
  | "Abdominal Pain"
  | "Fever"
  | "Respiratory"
  | "General"
  | "Other";

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

interface CategoryProfile {
  category: ClinicalCategory;
  keywords: string[];
  problemsDetector: (text: string) => string[];
  questionTemplates: (lang: "hi" | "en", detected: string[]) => AdaptiveQuestion[];
  redFlagHints: string[];
}

const CATEGORY_PROFILES: Record<ClinicalCategory, CategoryProfile> = {
  Musculoskeletal: {
    category: "Musculoskeletal",
    keywords: [
      "knee", "joint", "back", "neck", "shoulder", "hip", "ankle", "wrist", "elbow", "bone",
      "arthritis", "sandhivata", "amavata", "ghutna", "ghutne", "jod", "jodon", "kamar",
      "dard", "sujan", "swelling", "stiffness", "jakdan", "ligament", "sprain", "myalgia",
      "leg", "leg pain", "hand", "hand pain", "arm", "arm pain", "body", "body pain", "body ache", "bodyache",
      "foot", "foot pain", "feet", "heel", "heel pain", "muscle", "muscle pain", "cramp", "cramps",
      "spine", "spinal", "lower back", "lumbago", "sciatica", "gout", "uric acid",
      "pair", "taang", "hath", "kandha", "gardan", "peeda", "jhanjhanahat", "sunnpann",
      "घुटने", "घुटना", "जोड़", "जोड़ों", "कमर", "हड्डी", "पीठ", "गर्दन", "कंधा", "जकड़न",
      "गठिया", "संधिवात", "आमवात", "मांसपेशी", "सूजन", "पैर", "पैर में दर्द", "टांग", "हाथ",
      "हाथ में दर्द", "एड़ी", "पिंडली", "बदन दर्द", "शरीर में दर्द", "साइटिका", "झनझनाहट", "सुन्नपन"
    ],
    problemsDetector: (text: string) => {
      const problems: string[] = [];
      const lower = text.toLowerCase();
      if (lower.includes("knee") || lower.includes("ghutn") || text.includes("घुटने") || text.includes("घुटना")) {
        problems.push("Knee Joint Pain (जानु संधि शूल)");
      }
      if (lower.includes("back") || lower.includes("kamar") || text.includes("कमर") || text.includes("पीठ")) {
        problems.push("Lower Back / Lumbar Pain (कटिशूल)");
      }
      if (lower.includes("swelling") || lower.includes("sujan") || text.includes("सूजन") || lower.includes("edema")) {
        problems.push("Joint Swelling & Inflammation (शोथ / शोफ)");
      }
      if (lower.includes("stiff") || lower.includes("jakdan") || text.includes("जकड़न")) {
        problems.push("Morning Joint Stiffness (स्तब्धता)");
      }
      if (lower.includes("shoulder") || lower.includes("kandha") || text.includes("कंधा")) {
        problems.push("Shoulder Joint Pain / Frozen Shoulder (अवबाहुक)");
      }
      if (problems.length === 0) {
        problems.push("Musculoskeletal / Joint Pain (संधिशूल)");
      }
      return problems;
    },
    questionTemplates: (lang, detected) => [
      {
        id: "msk_location_site",
        text: lang === "hi"
          ? "दर्द मुख्य रूप से किस अंग या जोड़ में है? (दोनों तरफ या केवल एक तरफ?)"
          : "Which exact joint or area is painful? (Is it on one side or both sides?)",
        textEn: "Which exact joint or area is painful? (Is it on one side or both sides?)",
        type: "single_choice",
        priority: "high",
        clinicalPurpose: "location",
        options: [
          { value: "BILATERAL_KNEES", labelHi: "दोनों घुटनों में (Both Knees)", labelEn: "Both Knees (Bilateral)" },
          { value: "SINGLE_KNEE", labelHi: "केवल एक घुटने में (Single Knee)", labelEn: "One Knee Only" },
          { value: "LOWER_BACK_HIP", labelHi: "कमर और कूल्हे में (Lower Back & Hip)", labelEn: "Lower Back & Hip" },
          { value: "MULTIPLE_SMALL_JOINTS", labelHi: "हाथ-पैरों के छोटे जोड़ों में (Small finger & wrist joints)", labelEn: "Small finger & wrist joints" },
        ],
      },
      {
        id: "msk_severity_scale",
        text: lang === "hi"
          ? "१ से १० के पैमाने पर दर्द की तीव्रता कितनी है?"
          : "On a scale of 1 to 10, how severe is the pain?",
        textEn: "On a scale of 1 to 10, how severe is the pain?",
        type: "single_choice",
        priority: "high",
        clinicalPurpose: "severity",
        options: [
          { value: "MILD_1_3", labelHi: "हल्का (१ से ३) - सामान्य काम कर पाते हैं", labelEn: "Mild (1-3) - Manageable" },
          { value: "MODERATE_4_6", labelHi: "मध्यम (४ से ६) - चलने-फिरने में तकलीफ", labelEn: "Moderate (4-6) - Walking impaired" },
          { value: "SEVERE_7_10", labelHi: "अत्यधिक तेज (७ से १०) - खड़ा होना भी कठिन", labelEn: "Severe (7-10) - Unable to bear weight", isRedFlag: true },
        ],
      },
      {
        id: "msk_onset_duration",
        text: lang === "hi"
          ? "यह दर्द कब से है और कैसे शुरू हुआ?"
          : "How long have you had this pain and how did it start?",
        textEn: "How long have you had this pain and how did it start?",
        type: "single_choice",
        priority: "high",
        clinicalPurpose: "onset",
        options: [
          { value: "ACUTE_INJURY", labelHi: "हाल ही में चोट या मुड़ने के बाद (Recent injury/twist)", labelEn: "After recent injury / trauma" },
          { value: "GRADUAL_FEW_WEEKS", labelHi: "धीरे-धीरे कुछ हफ्तों से (Gradual over weeks)", labelEn: "Gradually over weeks" },
          { value: "CHRONIC_MONTHS_YEARS", labelHi: "लंबे समय से / कई महीनों से (Months or years)", labelEn: "Chronic for months/years" },
        ],
      },
      {
        id: "msk_aggravating_movement",
        text: lang === "hi"
          ? "किस स्थिति में दर्द बढ़ता है? (सीढ़ियां चढ़ना, चलना या आराम के समय)"
          : "What makes the pain worse? (Climbing stairs, prolonged walking, or sitting)",
        textEn: "What makes the pain worse? (Climbing stairs, prolonged walking, or sitting)",
        type: "single_choice",
        priority: "medium",
        clinicalPurpose: "aggravating",
        options: [
          { value: "STAIRS_AND_WALKING", labelHi: "सीढ़ियां चढ़ने व चलने पर (Climbing stairs & walking)", labelEn: "Stairs and walking" },
          { value: "REST_OR_MORNING", labelHi: "सुबह उठने पर या लंबे आराम के बाद (Morning on waking)", labelEn: "Morning stiffness / after rest" },
          { value: "SQUATTING_CROSS_LEGGED", labelHi: "पालथी मारकर या नीचे बैठने पर (Squatting/sitting cross-legged)", labelEn: "Squatting / Floor sitting" },
        ],
      },
      {
        id: "msk_swelling_redness",
        text: lang === "hi"
          ? "क्या जोड़ में सूजन, लालिमा, गर्माहट या छूने पर अत्यधिक दर्द है?"
          : "Is there swelling, redness, warmth, or inability to bear weight on the joint?",
        textEn: "Is there swelling, redness, warmth, or inability to bear weight on the joint?",
        type: "yes_no",
        priority: "high",
        clinicalPurpose: "red_flag",
        options: [
          { value: "YES_HOT_RED", labelHi: "हाँ, जोड़ लाल, गर्म और सूजा हुआ है (Yes, hot, red, and swollen)", labelEn: "Yes, hot, red, and swollen", isRedFlag: true },
          { value: "MILD_SWELLING_ONLY", labelHi: "केवल हल्की सूजन है (Mild swelling only)", labelEn: "Mild swelling only" },
          { value: "NO_SWELLING", labelHi: "नहीं, कोई सूजन या लालिमा नहीं (No swelling/redness)", labelEn: "No swelling or redness" },
        ],
      },
      {
        id: "msk_associated_sound_locking",
        text: lang === "hi"
          ? "क्या जोड़ हिलाने पर चटकने की आवाज (Crepitus) या जोड़ अटकने जैसा महसूस होता है?"
          : "Do you experience clicking sounds (crepitus) or joint locking/giving way?",
        textEn: "Do you experience clicking sounds (crepitus) or joint locking/giving way?",
        type: "single_choice",
        priority: "medium",
        clinicalPurpose: "character",
        options: [
          { value: "CREPITUS_CRACKING", labelHi: "कट-कट की आवाज व घिसाव (Cracking/Grating sounds)", labelEn: "Cracking / Crepitus" },
          { value: "LOCKING_GIVING_WAY", labelHi: "जोड़ का अचानक अटक जाना (Joint locking/giving way)", labelEn: "Joint locking / Giving way" },
          { value: "NONE", labelHi: "ऐसा कुछ नहीं (None)", labelEn: "None" },
        ],
      },
      {
        id: "msk_ayush_ama_digestive",
        text: lang === "hi"
          ? "क्या सुबह उठने पर भारीपन, भूख की कमी या कब्जियत रहती है? (आम लक्षण)"
          : "Do you experience morning heaviness, loss of appetite, or constipation? (Ama indicator)",
        textEn: "Do you experience morning heaviness, loss of appetite, or constipation? (Ama indicator)",
        type: "single_choice",
        priority: "medium",
        clinicalPurpose: "associated",
        options: [
          { value: "AMA_PRESENT", labelHi: "हाँ, सुबह भारीपन व सुस्ती रहती है (Yes, heavy & sluggish)", labelEn: "Yes, sluggish & low appetite (Ama+)" },
          { value: "AMA_ABSENT", labelHi: "नहीं, पाचन व भूख सामान्य है (Normal digestion)", labelEn: "Normal appetite & digestion (Nirama)" },
        ],
      },
    ],
    redFlagHints: [
      "Inability to bear weight or acute joint erythema (Suspected Septic Arthritis)",
      "Trauma with joint instability or deformity (Suspected Ligament Tear / Fracture)",
      "Bilateral severe morning stiffness >1 hour (Suspected Inflammatory Polyarthritis / Amavata)"
    ],
  },

  "Chest Pain": {
    category: "Chest Pain",
    keywords: [
      "chest pain", "angina", "heart pain", "cardiac", "palpitation", "left arm", "jaw pain",
      "chhati me dard", "seena", "hridaya", "ghabrahat", "heavy chest", "crushing pain",
      "छाती में दर्द", "सीने में दर्द", "छाती", "सीना", "हृदय", "दिल में दर्द", "घबराहट", "बाएं हाथ में दर्द"
    ],
    problemsDetector: (text: string) => {
      const problems: string[] = [];
      const lower = text.toLowerCase();
      if (lower.includes("chest") || lower.includes("seena") || text.includes("छाती") || text.includes("सीना")) {
        problems.push("Chest Pain / Discomfort (उरःशूल / छाती में दर्द)");
      }
      if (lower.includes("breath") || lower.includes("saans") || text.includes("सांस")) {
        problems.push("Associated Dyspnea / Shortness of Breath (श्वास कष्ट)");
      }
      if (lower.includes("palpitation") || lower.includes("dhadkan") || text.includes("धड़कन")) {
        problems.push("Palpitations / Tachycardia (हृत्कंप)");
      }
      if (problems.length === 0) problems.push("Chest Discomfort / Cardiac Query (हृदय व उरःसंबंधित लक्षण)");
      return problems;
    },

    questionTemplates: (lang, detected) => [
      {
        id: "cp_severity_scale",
        text: lang === "hi"
          ? "१ से १० के पैमाने पर, आपकी छाती का दर्द कितना तीव्र है?"
          : "On a scale of 1 to 10, how severe is your chest pain?",
        textEn: "On a scale of 1 to 10, how severe is your chest pain?",
        type: "single_choice",
        priority: "high",
        clinicalPurpose: "severity",
        options: [
          { value: "MILD_1_3", labelHi: "हल्का (१ से ३)", labelEn: "Mild (1-3)" },
          { value: "MODERATE_4_6", labelHi: "मध्यम (४ से ६)", labelEn: "Moderate (4-6)" },
          { value: "SEVERE_7_10", labelHi: "अत्यधिक तेज (७ से १०)", labelEn: "Severe (7-10)", isRedFlag: true },
        ],
      },
      {
        id: "cp_character",
        text: lang === "hi"
          ? "दर्द किस प्रकार का महसूस हो रहा है? (भारीपन, चुभन, जलन या चीरने जैसा)"
          : "What does the pain feel like? (Heavy pressure, stabbing, burning, or tearing)",
        textEn: "What does the pain feel like? (Heavy pressure, stabbing, burning, or tearing)",
        type: "single_choice",
        priority: "high",
        clinicalPurpose: "character",
        options: [
          { value: "PRESSURE_HEAVINESS", labelHi: "छाती पर भारीपन / दबाव (Heavy Pressure / Crushing)", labelEn: "Heavy Pressure / Squeezing", isRedFlag: true },
          { value: "TEARING_BACK", labelHi: "पीठ में चीरने जैसा तेज दर्द (Tearing to Back)", labelEn: "Tearing into Back", isRedFlag: true },
          { value: "BURNING_ACIDIC", labelHi: "जलन / अम्लपित्त जैसा (Burning / Acidity)", labelEn: "Burning / Heartburn" },
          { value: "SHARP_STABBING", labelHi: "तेज चुभन जैसा (Sharp Stabbing)", labelEn: "Sharp Stabbing" },
        ],
      },
      {
        id: "cp_radiation",
        text: lang === "hi"
          ? "क्या यह दर्द आपके बाएं हाथ, गर्दन, जबड़े या पीठ की तरफ फैलता है?"
          : "Does the pain spread to your left arm, neck, jaw, or back?",
        textEn: "Does the pain spread to your left arm, neck, jaw, or back?",
        type: "yes_no",
        priority: "high",
        clinicalPurpose: "location",
        options: [
          { value: "YES_RADIATING", labelHi: "हाँ, बाएं हाथ/गर्दन में फैलता है (Yes, radiates)", labelEn: "Yes, radiates to arm/jaw", isRedFlag: true },
          { value: "NO_LOCALIZED", labelHi: "नहीं, केवल एक जगह है (No radiation)", labelEn: "No radiation" },
        ],
      },
      {
        id: "cp_associated_autonomic",
        text: lang === "hi"
          ? "क्या आपको ठंडा पसीना, चक्कर आना या अत्यधिक घबराहट हो रही है?"
          : "Are you having cold sweating, dizziness, or severe breathlessness?",
        textEn: "Are you having cold sweating, dizziness, or severe breathlessness?",
        type: "single_choice",
        priority: "high",
        clinicalPurpose: "red_flag",
        options: [
          { value: "COLD_SWEATING_DIZZY", labelHi: "अत्यधिक ठंडा पसीना व चक्कर (Cold Sweating & Dizziness)", labelEn: "Cold Sweating & Dizziness", isRedFlag: true },
          { value: "BREATHLESSNESS_ONLY", labelHi: "केवल सांस फूलना (Breathlessness only)", labelEn: "Breathlessness only", isRedFlag: true },
          { value: "NONE", labelHi: "कोई नहीं (None)", labelEn: "None" },
        ],
      },
      {
        id: "cp_exacerbation_exertion",
        text: lang === "hi"
          ? "क्या चलने या मेहनत करने पर दर्द बढ़ता है और आराम करने पर कम होता है?"
          : "Does the pain worsen with physical exertion and relieve with rest?",
        textEn: "Does the pain worsen with physical exertion and relieve with rest?",
        type: "yes_no",
        priority: "medium",
        clinicalPurpose: "aggravating",
        options: [
          { value: "YES_EXERTION", labelHi: "हाँ, मेहनत करने पर बढ़ता है (Yes, on exertion)", labelEn: "Yes, exertion increases pain" },
          { value: "NO_CONSTANT", labelHi: "नहीं, लगातार बना रहता है (No change / constant)", labelEn: "Constant / No change" },
        ],
      },
      {
        id: "cp_cardiac_history",
        text: lang === "hi"
          ? "क्या आपको पहले से उच्च रक्तचाप (BP), मधुमेह (Sugar) या हृदय रोग का इतिहास है?"
          : "Do you have a personal or family history of Hypertension, Diabetes, or Heart disease?",
        textEn: "Do you have a personal or family history of Hypertension, Diabetes, or Heart disease?",
        type: "single_choice",
        priority: "medium",
        clinicalPurpose: "history",
        options: [
          { value: "KNOWN_HTN_DM_CAD", labelHi: "हाँ, बीपी / शुगर / हृदय रोग की दवा चल रही है", labelEn: "Yes, on treatment for HTN/DM/CAD" },
          { value: "NO_CHRONIC_DISEASE", labelHi: "नहीं, ऐसा कोई पुराना रोग नहीं है", labelEn: "No prior medical history" },
        ],
      },
    ],
    redFlagHints: [
      "Retrosternal pressure radiating to left arm/jaw (Suspected Acute Coronary Syndrome)",
      "Chest pain accompanied by diaphoresis or dyspnea (Critical Cardiac Red Flag)",
      "Sudden tearing pain radiating to back (Suspected Aortic Dissection)"
    ],
  },

  Headache: {
    category: "Headache",
    keywords: [
      "headache", "head pain", "migraine", "thunderclap", "sir dard", "sirdard", "sar dard", "sardard", "shirashoola",
      "chakkar", "dizziness", "aura", "nausea", "photophobia", "neck stiffness",
      "सिरदर्द", "सिर दर्द", "सर दर्द", "सरदर्द", "सिर में दर्द", "सर में दर्द", "माइग्रेन", "आधासीसी", "चक्कर", "शिरःशूल", "गर्दन में अकड़न"
    ],
    problemsDetector: (text: string) => {
      const problems: string[] = [];
      const lower = text.toLowerCase();
      if (lower.includes("migraine") || text.includes("माइग्रेन") || lower.includes("aadhasisi")) {
        problems.push("Migraine / Vascular Headache (अर्धावभेदक)");
      }
      if (lower.includes("sir") || lower.includes("sar") || text.includes("सिर") || text.includes("सर दर्द") || text.includes("सरदर्द")) {
        problems.push("Headache & Cephalea (शिरःशूल / सिरदर्द)");
      }

      if (lower.includes("dizz") || lower.includes("chakkar") || text.includes("चक्कर")) {
        problems.push("Associated Vertigo / Dizziness (भ्रम)");
      }
      if (problems.length === 0) problems.push("Acute or Chronic Cephalea (शिरःशूल / सिरदर्द)");
      return problems;
    },
    questionTemplates: (lang, detected) => [
      {
        id: "ha_onset_thunderclap",
        text: lang === "hi"
          ? "क्या सिरदर्द अचानक कुछ सेकंडों में बिजली की तरह अत्यधिक तेज शुरू हुआ (Thunderclap)?"
          : "Did the headache begin suddenly like a thunderclap reaching peak intensity within seconds?",
        textEn: "Did the headache begin suddenly like a thunderclap reaching peak intensity within seconds?",
        type: "single_choice",
        priority: "high",
        clinicalPurpose: "onset",
        options: [
          { value: "THUNDERCLAP_SUDDEN", labelHi: "अचानक अत्यधिक तीव्र (Sudden explosive / Thunderclap)", labelEn: "Sudden explosive", isRedFlag: true },
          { value: "GRADUAL_BUILDUP", labelHi: "धीरे-धीरे कई घंटों/दिनों में (Gradual buildup)", labelEn: "Gradual buildup" },
        ],
      },
      {
        id: "ha_location_side",
        text: lang === "hi"
          ? "दर्द सिर के किस हिस्से में है? (आधे सिर में, दोनों तरफ या माथे पर?)"
          : "Which part of the head is painful? (One-sided, both sides, forehead, or back of head?)",
        textEn: "Which part of the head is painful? (One-sided, both sides, forehead, or back of head?)",
        type: "single_choice",
        priority: "high",
        clinicalPurpose: "location",
        options: [
          { value: "UNILATERAL_ONE_SIDE", labelHi: "केवल आधे सिर में (One-sided / Hemilateral)", labelEn: "One-sided (Unilateral)" },
          { value: "BILATERAL_FOREHEAD", labelHi: "माथे और दोनों तरफ पट्टे जैसा दबाव (Band-like around forehead)", labelEn: "Forehead / Band-like tension" },
          { value: "OCCIPITAL_NECK", labelHi: "सिर के पिछले हिस्से व गर्दन में (Back of head & neck)", labelEn: "Back of head & neck" },
        ],
      },
      {
        id: "ha_neuro_deficit",
        text: lang === "hi"
          ? "क्या चेहरे में टेढ़ापन, हाथ-पैर में कमजोरी, बोलने में लड़खड़ाहट या देखने में धुंधलापन है?"
          : "Is there any facial drooping, limb weakness, slurred speech, or vision changes?",
        textEn: "Is there any facial drooping, limb weakness, slurred speech, or vision changes?",
        type: "yes_no",
        priority: "high",
        clinicalPurpose: "red_flag",
        options: [
          { value: "YES_WEAKNESS_FAST", labelHi: "हाँ, कमजोरी / बोली लड़खड़ाना / धुंधलापन (Yes, FAST signs)", labelEn: "Yes, weakness/slurred speech", isRedFlag: true },
          { value: "NO_DEFICIT", labelHi: "नहीं, ऐसी कोई कमजोरी नहीं (No weakness)", labelEn: "No weakness" },
        ],
      },
      {
        id: "ha_associated_meningism",
        text: lang === "hi"
          ? "क्या सिरदर्द के साथ तेज बुखार, गर्दन में अकड़न या रोशनी से असहजता (Photophobia) है?"
          : "Is the headache accompanied by fever, stiff neck, or sensitivity to light/sound?",
        textEn: "Is the headache accompanied by fever, stiff neck, or sensitivity to light/sound?",
        type: "single_choice",
        priority: "high",
        clinicalPurpose: "associated",
        options: [
          { value: "FEVER_STIFF_NECK", labelHi: "तेज बुखार व गर्दन में अकड़न (Fever & Stiff Neck)", labelEn: "Fever & Stiff Neck", isRedFlag: true },
          { value: "NAUSEA_LIGHT_SENSITIVITY", labelHi: "उल्टी का मन व रोशनी/आवाज से परेशानी (Nausea & Light sensitivity)", labelEn: "Nausea & Light sensitivity" },
          { value: "NONE", labelHi: "कोई नहीं (None)", labelEn: "None" },
        ],
      },
      {
        id: "ha_triggers_sleep_stress",
        text: lang === "hi"
          ? "क्या नींद की कमी, मानसिक तनाव, भूखे रहने या धूप से सिरदर्द बढ़ता है?"
          : "Does lack of sleep, emotional stress, fasting, or bright sunlight trigger the headache?",
        textEn: "Does lack of sleep, emotional stress, fasting, or bright sunlight trigger the headache?",
        type: "single_choice",
        priority: "medium",
        clinicalPurpose: "aggravating",
        options: [
          { value: "STRESS_LACK_SLEEP", labelHi: "तनाव व अनिद्रा से (Stress / Lack of sleep)", labelEn: "Stress / Lack of sleep" },
          { value: "FASTING_SUNLIGHT", labelHi: "धूप व भूखे रहने से (Sunlight / Irregular meals)", labelEn: "Sunlight / Fasting" },
          { value: "NO_CLEAR_TRIGGER", labelHi: "कोई स्पष्ट कारण नहीं (No clear trigger)", labelEn: "No clear trigger" },
        ],
      },
      {
        id: "ha_severity_scale",
        text: lang === "hi"
          ? "१ से १० के पैमाने पर दर्द कितना तीव्र है?"
          : "On a scale of 1 to 10, how severe is the headache?",
        textEn: "On a scale of 1 to 10, how severe is the headache?",
        type: "single_choice",
        priority: "medium",
        clinicalPurpose: "severity",
        options: [
          { value: "MILD_1_3", labelHi: "हल्का (१ से ३)", labelEn: "Mild (1-3)" },
          { value: "MODERATE_4_6", labelHi: "मध्यम (४ से ६)", labelEn: "Moderate (4-6)" },
          { value: "SEVERE_7_10", labelHi: "अत्यधिक असहनीय (७ से १०)", labelEn: "Severe (7-10)", isRedFlag: true },
        ],
      },
    ],
    redFlagHints: [
      "Sudden explosive thunderclap onset (Suspected Subarachnoid Hemorrhage)",
      "Unilateral limb weakness or facial drooping (Suspected Acute Stroke / FAST)",
      "Headache with neck rigidity and high fever (Suspected Meningitis)"
    ],
  },

  "Abdominal Pain": {
    category: "Abdominal Pain",
    keywords: [
      "abdomen", "stomach", "belly", "tummy", "gastric", "acidity", "gas", "constipation",
      "diarrhea", "vomiting", "nausea", "cramps", "pet dard", "petdard", "jalan", "kabz",
      "dast", "ulti", "amlapitta", "udarashoola", "bloating", "apacha",
      "पेट", "पेट दर्द", "उदरशूल", "अम्लपित्त", "कब्ज", "दस्त", "उल्टी", "गैस", "अफरा", "जलन", "अपच"
    ],
    problemsDetector: (text: string) => {
      const problems: string[] = [];
      const lower = text.toLowerCase();
      if (lower.includes("acid") || lower.includes("jalan") || text.includes("अम्लपित्त") || text.includes("जलन")) {
        problems.push("Hyperacidity / GERD (अम्लपित्त)");
      }
      if (lower.includes("gas") || lower.includes("bloat") || text.includes("गैस") || text.includes("अफरा")) {
        problems.push("Abdominal Distension & Flatulence (आध्मान / गैस)");
      }
      if (lower.includes("constipat") || lower.includes("kabz") || text.includes("कब्ज")) {
        problems.push("Constipation (विबन्ध / मलबद्धता)");
      }
      if (lower.includes("diarrhea") || lower.includes("loose") || lower.includes("dast") || text.includes("दस्त")) {
        problems.push("Acute Diarrhea / Gastroenteritis (अतिसार)");
      }
      if (problems.length === 0) problems.push("Abdominal Pain / Colic (उदरशूल)");
      return problems;
    },
    questionTemplates: (lang, detected) => [
      {
        id: "abd_location_quadrant",
        text: lang === "hi"
          ? "पेट में दर्द मुख्य रूप से कहाँ हो रहा है? (ऊपरी पेट, नाभि के पास, नीचे दाईं तरफ या पूरे पेट में?)"
          : "Where is the pain located? (Upper abdomen, around navel, lower right side, or generalized?)",
        textEn: "Where is the pain located? (Upper abdomen, around navel, lower right side, or generalized?)",
        type: "single_choice",
        priority: "high",
        clinicalPurpose: "location",
        options: [
          { value: "EPIGASTRIC_UPPER", labelHi: "ऊपरी पेट व छाती के नीचे (Upper epigastric / under ribs)", labelEn: "Upper epigastric" },
          { value: "LOWER_RIGHT_RIF", labelHi: "पेट के निचले दाहिने हिस्से में (Lower right abdomen)", labelEn: "Lower right abdomen (RLQ)", isRedFlag: true },
          { value: "PERIUMBILICAL_NAVEL", labelHi: "नाभि के आसपास मरोड़ (Around the navel)", labelEn: "Around the navel" },
          { value: "GENERALIZED_DIFFUSE", labelHi: "पूरे पेट में फैला हुआ (Entire abdomen)", labelEn: "Entire abdomen" },
        ],
      },
      {
        id: "abd_rigidity_guarding",
        text: lang === "hi"
          ? "क्या पेट छूने पर लकड़ी के तख्ते जैसा अत्यधिक सख्त (Rigid) और छूने नहीं दे रहा है?"
          : "Is your abdomen extremely hard/rigid like a wooden board or tender to slight touch?",
        textEn: "Is your abdomen extremely hard/rigid like a wooden board or tender to slight touch?",
        type: "yes_no",
        priority: "high",
        clinicalPurpose: "red_flag",
        options: [
          { value: "BOARD_LIKE_RIGID", labelHi: "हाँ, तख्ते जैसा सख्त व छूने पर असहनीय दर्द (Board-like rigidity)", labelEn: "Board-like rigid & extremely tender", isRedFlag: true },
          { value: "SOFT_MILD_TENDER", labelHi: "नहीं, पेट नरम है (Soft abdomen)", labelEn: "Soft / Mild tenderness only" },
        ],
      },
      {
        id: "abd_bleeding_signs",
        text: lang === "hi"
          ? "क्या आपको खून की उल्टी (Hematemesis) हुई है या काले रंग का बदबूदार मल (Black tarry stool) आया है?"
          : "Have you had blood in vomit (red/coffee-ground) or passed black tarry stools?",
        textEn: "Have you had blood in vomit (red/coffee-ground) or passed black tarry stools?",
        type: "single_choice",
        priority: "high",
        clinicalPurpose: "red_flag",
        options: [
          { value: "VOMITING_BLOOD", labelHi: "खून की उल्टी (Blood in vomit)", labelEn: "Blood in vomit", isRedFlag: true },
          { value: "BLACK_TARRY_STOOL", labelHi: "काले रंग का मल (Black tarry stools / Melena)", labelEn: "Black stools (Melena)", isRedFlag: true },
          { value: "NO_BLEEDING", labelHi: "नहीं, कोई खून नहीं (No bleeding)", labelEn: "No bleeding" },
        ],
      },
      {
        id: "abd_food_relation",
        text: lang === "hi"
          ? "क्या खाना खाने के तुरंत बाद दर्द बढ़ता है या खाली पेट रहने पर अधिक होता है?"
          : "Does the pain worsen immediately after meals or when stomach is empty?",
        textEn: "Does the pain worsen immediately after meals or when stomach is empty?",
        type: "single_choice",
        priority: "medium",
        clinicalPurpose: "aggravating",
        options: [
          { value: "WORSE_AFTER_MEALS", labelHi: "खाना खाने के तुरंत बाद बढ़ता है (Postprandial)", labelEn: "Worse after meals" },
          { value: "WORSE_ON_EMPTY_STOMACH", labelHi: "खाली पेट या रात में बढ़ता है, खाने पर आराम (Empty stomach)", labelEn: "Worse on empty stomach" },
          { value: "NO_RELATION_FOOD", labelHi: "खाने से कोई संबंध नहीं (No food relation)", labelEn: "No relation to food" },
        ],
      },
      {
        id: "abd_bowel_habits",
        text: lang === "hi"
          ? "शौच (Bowel movement) की क्या स्थिति है? (दस्त, कब्ज या गैस न निकलना?)"
          : "How are your bowel habits? (Diarrhea, constipation, or inability to pass gas/stool?)",
        textEn: "How are your bowel habits? (Diarrhea, constipation, or inability to pass gas/stool?)",
        type: "single_choice",
        priority: "medium",
        clinicalPurpose: "character",
        options: [
          { value: "CONSTIPATION_NO_GAS", labelHi: "गंभीर कब्ज व गैस पास न होना (Constipated / Obstipation)", labelEn: "Severe constipation / No gas passed", isRedFlag: true },
          { value: "WATERY_DIARRHEA", labelHi: "पतले दस्त व मरोड़ (Watery diarrhea & cramps)", labelEn: "Watery loose stools" },
          { value: "NORMAL_BOWEL", labelHi: "शौच सामान्य है (Normal regular bowel)", labelEn: "Normal bowel habits" },
        ],
      },
      {
        id: "abd_ayush_agni_assessment",
        text: lang === "hi"
          ? "आपकी भूख और भोजन पचने की क्षमता (अग्नि) कैसी है?"
          : "How is your digestive fire (Agni) and appetite?",
        textEn: "How is your digestive fire (Agni) and appetite?",
        type: "single_choice",
        priority: "medium",
        clinicalPurpose: "associated",
        options: [
          { value: "MANDAGNI_HEAVY", labelHi: "मंदाग्नि - भूख बिल्कुल नहीं, पेट भारी रहता है", labelEn: "Low appetite / Sluggish digestion" },
          { value: "TIKSHNAGNI_BURNING", labelHi: "तीक्ष्णाग्नि - बहुत तेज भूख व खट्टी डकारें", labelEn: "Excessive hunger & burning reflux" },
          { value: "VISHAMAGNI_IRREGULAR", labelHi: "विषमाग्नि - कभी तेज भूख कभी बिल्कुल नहीं, गैस", labelEn: "Irregular appetite & bloating" },
        ],
      },
    ],
    redFlagHints: [
      "Rigid board-like abdomen with guarding (Suspected Peritonitis / Perforation)",
      "Hematemesis or Melena (Upper GI Bleed Red Flag)",
      "Severe localized right lower quadrant pain with fever (Suspected Acute Appendicitis)"
    ],
  },

  Fever: {
    category: "Fever",
    keywords: [
      "fever", "pyrexia", "temperature", "chills", "rigors", "shivering", "body ache",
      "bodyache", "bukhar", "taap", "jvara", "thand", "sheet", "kampa", "badan dard",
      "बुखार", "ताप", "ज्वर", "ठंड", "कंपकंपी", "बदन दर्द", "हरारत", "पसीना"
    ],
    problemsDetector: (text: string) => {
      const problems: string[] = [];
      const lower = text.toLowerCase();
      if (lower.includes("chill") || lower.includes("thand") || lower.includes("shiver") || text.includes("ठंड") || text.includes("कंपकंपी")) {
        problems.push("Fever with Chills & Rigors (शीतपूर्वक ज्वर / मलेरिया शंका)");
      }
      if (lower.includes("body") || lower.includes("badan") || lower.includes("ache") || text.includes("बदन दर्द")) {
        problems.push("Generalized Myalgia & Malaise (अंगमर्द / बदन दर्द)");
      }
      if (lower.includes("rash") || text.includes("चकत्ते")) {
        problems.push("Fever with Cutaneous Rash (ज्वरयुक्त विस्फोत)");
      }
      if (problems.length === 0) problems.push("Acute Febrile Illness (नवज्वर / तीव्र बुखार)");
      return problems;
    },
    questionTemplates: (lang, detected) => [
      {
        id: "fev_duration_days",
        text: lang === "hi"
          ? "बुखार कितने दिनों से आ रहा है?"
          : "How many days have you had this fever?",
        textEn: "How many days have you had this fever?",
        type: "single_choice",
        priority: "high",
        clinicalPurpose: "onset",
        options: [
          { value: "ACUTE_1_3_DAYS", labelHi: "१ से ३ दिन (1-3 days)", labelEn: "1-3 days (Acute)" },
          { value: "MODERATE_4_7_DAYS", labelHi: "४ से ७ दिन (4-7 days)", labelEn: "4-7 days" },
          { value: "PROLONGED_OVER_1_WEEK", labelHi: "१ सप्ताह से अधिक (Over 1 week)", labelEn: "Over 1 week (Prolonged)" },
        ],
      },
      {
        id: "fev_pattern_chills",
        text: lang === "hi"
          ? "क्या बुखार तेज कंपकंपी/ठंड लगकर आता है और किसी निश्चित समय पर बढ़ता है?"
          : "Does the fever come with severe shivering/chills, or spike at specific times?",
        textEn: "Does the fever come with severe shivering/chills, or spike at specific times?",
        type: "single_choice",
        priority: "high",
        clinicalPurpose: "character",
        options: [
          { value: "CHILLS_RIGORS_SPIKES", labelHi: "तेज ठंड व कंपकंपी के साथ (High fever with shaking chills)", labelEn: "High fever with chills & rigors" },
          { value: "CONTINUOUS_HIGH", labelHi: "लगातार तेज बना रहता है (Continuous sustained high fever)", labelEn: "Continuous high fever" },
          { value: "LOW_GRADE_EVENING", labelHi: "हल्का बुखार, शाम को बढ़ता है (Low-grade evening rise)", labelEn: "Low-grade evening rise" },
        ],
      },
      {
        id: "fev_neuro_sensorium",
        text: lang === "hi"
          ? "क्या मरीज को अत्यधिक बेहोशी, भ्रम, असामान्य बातचीत या दौरे (Fits) की समस्या है?"
          : "Is the patient drowsy, confused, delirious, or having convulsions/seizures?",
        textEn: "Is the patient drowsy, confused, delirious, or having convulsions/seizures?",
        type: "yes_no",
        priority: "high",
        clinicalPurpose: "red_flag",
        options: [
          { value: "CONFUSION_DROWSINESS", labelHi: "हाँ, भ्रम / बेहोशी / दौरे हैं (Yes, altered sensorium/seizures)", labelEn: "Yes, confusion/drowsiness/seizures", isRedFlag: true },
          { value: "FULLY_CONSCIOUS", labelHi: "पूर्णतः होश में और सचेत हैं (Fully alert & oriented)", labelEn: "Fully alert & oriented" },
        ],
      },
      {
        id: "fev_respiratory_breathing",
        text: lang === "hi"
          ? "क्या बुखार के साथ सांस बहुत तेजी से फूल रही है, सीने में दर्द या खांसी में कफ है?"
          : "Is there rapid breathing, chest pain on breathing, or cough with sputum?",
        textEn: "Is there rapid breathing, chest pain on breathing, or cough with sputum?",
        type: "single_choice",
        priority: "high",
        clinicalPurpose: "associated",
        options: [
          { value: "SEVERE_DYSPNEA", labelHi: "सांस बहुत तेज फूल रही है (Severe breathlessness)", labelEn: "Severe breathlessness / Rapid breathing", isRedFlag: true },
          { value: "MILD_COUGH_COLD", labelHi: "केवल सामान्य खांसी-जुकाम (Mild cough / Cold)", labelEn: "Mild cough / Runny nose" },
          { value: "NO_COUGH", labelHi: "कोई खांसी-सांस की तकलीफ नहीं (No respiratory symptoms)", labelEn: "No cough or dyspnea" },
        ],
      },
      {
        id: "fev_bleeding_petechiae",
        text: lang === "hi"
          ? "क्या त्वचा पर लाल चकत्ते, नाक/मसूड़ों से खून आना या अत्यधिक कमजोरी है?"
          : "Are there red skin rashes/spots, bleeding from nose/gums, or severe prostration?",
        textEn: "Are there red skin rashes/spots, bleeding from nose/gums, or severe prostration?",
        type: "single_choice",
        priority: "high",
        clinicalPurpose: "red_flag",
        options: [
          { value: "BLEEDING_PETECHIAE", labelHi: "हाँ, नाक से खून या लाल चकत्ते (Bleeding signs / Dengue warning)", labelEn: "Bleeding spots / Nose bleed", isRedFlag: true },
          { value: "NO_BLEEDING_SIGNS", labelHi: "नहीं, कोई खून या चकत्ते नहीं (No bleeding signs)", labelEn: "No bleeding signs" },
        ],
      },
      {
        id: "fev_ayush_jvara_sweating",
        text: lang === "hi"
          ? "क्या बुखार में पसीना आ रहा है और स्वाद कड़वा/फीका लग रहा है? (स्वेद प्रवृत्ति)"
          : "Is there natural sweating during fever and loss of taste/bitter mouth?",
        textEn: "Is there natural sweating during fever and loss of taste/bitter mouth?",
        type: "single_choice",
        priority: "medium",
        clinicalPurpose: "associated",
        options: [
          { value: "SVEDA_ABSENT_AMA", labelHi: "पसीना बिल्कुल नहीं आता, त्वचा सूखी व गर्म है (No sweat / Ama jvara)", labelEn: "No sweating, dry hot skin (Ama)" },
          { value: "SVEDA_PRESENT_NIRAMA", labelHi: "पसीना आने पर बुखार उतरता है (Sweating breaks fever)", labelEn: "Profuse sweating with relief" },
        ],
      },
    ],
    redFlagHints: [
      "Fever with altered sensorium, neck stiffness, or seizures (Meningitis/Encephalitis/Sepsis)",
      "Fever with spontaneous bleeding or petechial rash (Suspected Severe Dengue / Thrombocytopenia)",
      "High fever with marked tachypnea and respiratory distress (Severe Pneumonia Red Flag)"
    ],
  },

  Respiratory: {
    category: "Respiratory",
    keywords: [
      "cough", "breath", "breathing", "dyspnea", "asthma", "wheezing", "sputum", "phlegm",
      "chest congestion", "khansi", "saans", "dama", "balgam", "shwasa", "kasa", "throat",
      "throat pain", "sore throat", "gala", "gale me dard", "khash-khash", "tonsil", "pharyngitis",
      "खांसी", "सांस", "सांस फूलना", "दमा", "कफ", "बलगम", "श्वास", "कास", "घरघराहट", "गले में दर्द", "गला", "गले में खराश"
    ],
    problemsDetector: (text: string) => {
      const problems: string[] = [];
      const lower = text.toLowerCase();
      if (lower.includes("throat") || lower.includes("gala") || text.includes("गले") || text.includes("गला")) {
        problems.push("Sore Throat / Pharyngeal Irritation (गले में दर्द / कंठशूल)");
      }
      if (lower.includes("cough") || lower.includes("khansi") || text.includes("खांसी")) {
        problems.push("Productive / Dry Cough (कास / खांसी)");
      }
      if (lower.includes("breath") || lower.includes("saans") || text.includes("सांस")) {
        problems.push("Dyspnea / Breathlessness (श्वास कष्ट)");
      }
      if (lower.includes("asthma") || lower.includes("wheez") || text.includes("दमा") || text.includes("घरघराहट")) {
        problems.push("Bronchial Wheezing / Asthma (तमक श्वास)");
      }
      if (problems.length === 0) problems.push("Respiratory Tract Symptoms (प्राणवह स्रोतस विकार)");
      return problems;
    },

    questionTemplates: (lang, detected) => [
      {
        id: "resp_cough_type",
        text: lang === "hi"
          ? "खांसी किस प्रकार की है? (सूखी खांसी या कफ/बलगम वाली?)"
          : "What type of cough do you have? (Dry cough or with phlegm/sputum?)",
        textEn: "What type of cough do you have? (Dry cough or with phlegm/sputum?)",
        type: "single_choice",
        priority: "high",
        clinicalPurpose: "character",
        options: [
          { value: "DRY_IRRITATING", labelHi: "सूखी खांसी व गले में खराश (Dry irritating cough)", labelEn: "Dry cough / Throat irritation" },
          { value: "WET_YELLOW_GREEN", labelHi: "पीला या हरा गाढ़ा कफ (Productive with yellow/green sputum)", labelEn: "Productive with thick sputum" },
          { value: "BLOOD_IN_SPUTUM", labelHi: "कफ में खून के अंश (Blood in sputum / Hemoptysis)", labelEn: "Blood in sputum (Hemoptysis)", isRedFlag: true },
        ],
      },
      {
        id: "resp_dyspnea_rest",
        text: lang === "hi"
          ? "क्या आराम से बैठे रहने पर या लेटने पर भी सांस फूलती है?"
          : "Do you feel short of breath even at complete rest or when lying flat (Orthopnea)?",
        textEn: "Do you feel short of breath even at complete rest or when lying flat (Orthopnea)?",
        type: "single_choice",
        priority: "high",
        clinicalPurpose: "severity",
        options: [
          { value: "BREATHLESS_AT_REST", labelHi: "हाँ, बैठे या लेटने पर भी गंभीर सांस फूलती है", labelEn: "Yes, breathless at rest / unable to speak full sentence", isRedFlag: true },
          { value: "BREATHLESS_ON_WALKING", labelHi: "चलने या सीढ़ियां चढ़ने पर फूलती है", labelEn: "Breathless only on walking / climbing stairs" },
          { value: "NO_BREATHLESSNESS", labelHi: "सांस फूलने की समस्या नहीं है", labelEn: "No breathlessness" },
        ],
      },
      {
        id: "resp_wheezing_stridor",
        text: lang === "hi"
          ? "क्या सांस लेते समय सीटी जैसी आवाज (Wheezing) या घरघराहट आती है?"
          : "Is there a whistling sound (wheezing) or rattling noise when breathing?",
        textEn: "Is there a whistling sound (wheezing) or rattling noise when breathing?",
        type: "yes_no",
        priority: "medium",
        clinicalPurpose: "associated",
        options: [
          { value: "YES_WHEEZING", labelHi: "हाँ, सीने में सीटी/घरघराहट की आवाज (Yes, wheezing/whistling)", labelEn: "Yes, wheezing sounds" },
          { value: "NO_WHEEZING", labelHi: "नहीं, कोई सीटी जैसी आवाज नहीं (No wheezing)", labelEn: "No wheezing" },
        ],
      },
      {
        id: "resp_cyanosis_airway",
        text: lang === "hi"
          ? "क्या होठ या नाखून नीले पड़ रहे हैं अथवा सांस लेने में अत्यधिक जोर लगाना पड़ रहा है?"
          : "Are your lips or nails turning bluish, or is there extreme struggling to breathe?",
        textEn: "Are your lips or nails turning bluish, or is there extreme struggling to breathe?",
        type: "yes_no",
        priority: "high",
        clinicalPurpose: "red_flag",
        options: [
          { value: "YES_CYANOSIS_STRUGGLE", labelHi: "हाँ, होठ नीले पड़ रहे हैं / सांस में अत्यधिक कष्ट (Cyanosis / Severe distress)", labelEn: "Yes, bluish lips / severe respiratory distress", isRedFlag: true },
          { value: "NO_CYANOSIS", labelHi: "नहीं, ऐसा कुछ नहीं है (Normal color / No distress)", labelEn: "No bluish discoloration" },
        ],
      },
      {
        id: "resp_triggers_cold_dust",
        text: lang === "hi"
          ? "क्या ठंडी हवा, धूल, परागकण या मौसम बदलने से तकलीफ बढ़ती है?"
          : "Does cold air, dust, pollution, or weather change aggravate symptoms?",
        textEn: "Does cold air, dust, pollution, or weather change aggravate symptoms?",
        type: "single_choice",
        priority: "medium",
        clinicalPurpose: "aggravating",
        options: [
          { value: "COLD_DUST_ALLERGENS", labelHi: "हाँ, धूल, धुएं व ठंड से बढ़ती है (Dust / Cold air trigger)", labelEn: "Dust / Cold / Smoke triggers" },
          { value: "NIGHT_EARLY_MORNING", labelHi: "रात में या सुबह तड़के अधिक होती है (Night / Early morning)", labelEn: "Worse in night/early morning" },
          { value: "NO_SPECIFIC_TRIGGER", labelHi: "कोई विशेष ट्रिगर नहीं (No specific trigger)", labelEn: "No specific trigger" },
        ],
      },
      {
        id: "resp_duration_onset",
        text: lang === "hi"
          ? "यह खांसी या सांस की समस्या कितने समय से है?"
          : "How long have you had this cough or breathing difficulty?",
        textEn: "How long have you had this cough or breathing difficulty?",
        type: "single_choice",
        priority: "medium",
        clinicalPurpose: "onset",
        options: [
          { value: "ACUTE_FEW_DAYS", labelHi: "कुछ ही दिनों से (Less than 2 weeks)", labelEn: "Less than 2 weeks" },
          { value: "SUBACUTE_2_8_WEEKS", labelHi: "२ से ८ सप्ताह से (2 to 8 weeks)", labelEn: "2 to 8 weeks" },
          { value: "CHRONIC_OVER_8_WEEKS", labelHi: "२ महीने से अधिक समय से (Over 8 weeks / Chronic)", labelEn: "Over 8 weeks" },
        ],
      },
    ],
    redFlagHints: [
      "Cyanosis (bluish lips) or severe respiratory distress at rest (Acute Respiratory Failure)",
      "Hemoptysis (Blood in sputum - Suspected TB / Bronchiectasis / Pulmonary Embolism)",
      "Stridor or sudden acute airway obstruction (Emergency Airway Compromise)"
    ],
  },

  General: {
    category: "General",
    keywords: [
      "weakness", "tired", "fatigue", "weight loss", "appetite", "sleep", "insomnia", "stress",
      "anxiety", "dizziness", "kamzori", "thakan", "vazan kam", "neend", "bhukh", "chinta",
      "कमजोरी", "थकान", "सुस्ती", "वजन कम होना", "भूख न लगना", "नींद न आना", "तनाव", "चिंता"
    ],
    problemsDetector: (text: string) => {
      const problems: string[] = [];
      const lower = text.toLowerCase();
      if (lower.includes("weak") || lower.includes("kamzor") || lower.includes("fatigue") || lower.includes("thak") || text.includes("कमजोरी") || text.includes("थकान")) {
        problems.push("Generalized Fatigue & Weakness (दौर्बल्य / क्लम)");
      }
      if (lower.includes("weight") || lower.includes("vazan") || text.includes("वजन")) {
        problems.push("Unexplained Weight Change (कार्श्य / वजन में कमी)");
      }
      if (lower.includes("sleep") || lower.includes("neend") || text.includes("नींद") || lower.includes("insomnia")) {
        problems.push("Sleep Disturbance / Insomnia (अनिद्रा)");
      }
      if (lower.includes("appetite") || lower.includes("bhukh") || text.includes("भूख")) {
        problems.push("Loss of Appetite (अरोचक / मन्दाग्नि)");
      }
      if (problems.length === 0) problems.push("Constitutional / General Symptoms (सामान्य स्वास्थ्य लक्षण)");
      return problems;
    },
    questionTemplates: (lang, detected) => [
      {
        id: "gen_energy_fatigue",
        text: lang === "hi"
          ? "आपकी कमजोरी और थकान का स्तर कैसा है? क्या सामान्य दैनिक कार्य करने में भी असमर्थता होती है?"
          : "How would you describe your fatigue? Does it interfere with routine daily activities?",
        textEn: "How would you describe your fatigue? Does it interfere with routine daily activities?",
        type: "single_choice",
        priority: "high",
        clinicalPurpose: "severity",
        options: [
          { value: "MILD_AFTER_WORK", labelHi: "हल्की थकान, शाम को आराम से ठीक होती है", labelEn: "Mild tiredness relieved by rest" },
          { value: "MODERATE_TIRED_ALL_DAY", labelHi: "दिनभर सुस्ती व कमजोरी बनी रहती है", labelEn: "Moderate constant fatigue throughout day" },
          { value: "SEVERE_BED_BOUND", labelHi: "अत्यधिक कमजोरी, बिस्तर से उठना भी कठिन", labelEn: "Severe exhaustion, bed-bound", isRedFlag: true },
        ],
      },
      {
        id: "gen_weight_loss_fever",
        text: lang === "hi"
          ? "क्या पिछले कुछ महीनों में बिना प्रयास के अचानक वजन कम हुआ है या रात में पसीना आता है?"
          : "Have you had unexplained significant weight loss, night sweats, or prolonged low fever?",
        textEn: "Have you had unexplained significant weight loss, night sweats, or prolonged low fever?",
        type: "single_choice",
        priority: "high",
        clinicalPurpose: "red_flag",
        options: [
          { value: "WEIGHT_LOSS_NIGHT_SWEATS", labelHi: "हाँ, काफी वजन घटा है व रात में पसीना आता है", labelEn: "Yes, marked weight loss & night sweats", isRedFlag: true },
          { value: "STABLE_WEIGHT", labelHi: "नहीं, वजन और तापमान सामान्य है", labelEn: "No, weight is stable" },
        ],
      },
      {
        id: "gen_sleep_quality",
        text: lang === "hi"
          ? "रात में आपकी नींद की गुणवत्ता कैसी रहती है?"
          : "How is your quality and duration of sleep at night?",
        textEn: "How is your quality and duration of sleep at night?",
        type: "single_choice",
        priority: "medium",
        clinicalPurpose: "associated",
        options: [
          { value: "SOUND_RESTFUL", labelHi: "गहरी व आरामदायक नींद (६-८ घंटे)", labelEn: "Sound, restful sleep (6-8 hours)" },
          { value: "INTERRUPTED_INSOMNIA", labelHi: "देर से नींद आना या बार-बार खुलना", labelEn: "Difficulty falling asleep or frequent waking" },
          { value: "EXCESSIVE_DROWSINESS", labelHi: "अत्यधिक नींद व दिनभर आलस्य", labelEn: "Excessive daytime sleepiness" },
        ],
      },
      {
        id: "gen_appetite_digestion",
        text: lang === "hi"
          ? "आपकी भूख और भोजन पचने की क्षमता कैसी है?"
          : "How is your appetite and meal digestion?",
        textEn: "How is your appetite and meal digestion?",
        type: "single_choice",
        priority: "medium",
        clinicalPurpose: "associated",
        options: [
          { value: "GOOD_BALANCED", labelHi: "अच्छी भूख व समय पर भोजन", labelEn: "Good appetite & regular digestion" },
          { value: "POOR_LOSS_APPETITE", labelHi: "भूख बिल्कुल नहीं लगती या खाने की इच्छा नहीं", labelEn: "Loss of appetite / Aversion to food" },
        ],
      },
      {
        id: "gen_stress_mental",
        text: lang === "hi"
          ? "क्या आप काम, परिवार या स्वास्थ्य को लेकर अत्यधिक मानसिक तनाव या घबराहट महसूस करते हैं?"
          : "Are you experiencing significant mental stress, worry, or anxiety?",
        textEn: "Are you experiencing significant mental stress, worry, or anxiety?",
        type: "single_choice",
        priority: "medium",
        clinicalPurpose: "associated",
        options: [
          { value: "MILD_MANAGEABLE", labelHi: "शांत व सामान्य (Calm / Manageable)", labelEn: "Calm / Well-managed" },
          { value: "HIGH_STRESS_ANXIETY", labelHi: "अत्यधिक तनाव, घबराहट या चिंता", labelEn: "High stress / Constant anxiety" },
        ],
      },
      {
        id: "gen_medical_history",
        text: lang === "hi"
          ? "क्या आपको पहले से कोई पुरानी बीमारी (डायबिटीज, थायरॉइड, एनीमिया या बीपी) है?"
          : "Do you have any existing chronic medical conditions (Diabetes, Thyroid, Anemia, Hypertension)?",
        textEn: "Do you have any existing chronic medical conditions (Diabetes, Thyroid, Anemia, Hypertension)?",
        type: "single_choice",
        priority: "medium",
        clinicalPurpose: "history",
        options: [
          { value: "YES_CHRONIC_CONDITIONS", labelHi: "हाँ, पुरानी बीमारी की दवा चल रही है", labelEn: "Yes, on regular medication" },
          { value: "NO_PRIOR_ILLNESS", labelHi: "नहीं, कोई पुरानी बीमारी नहीं है", labelEn: "No prior chronic illness" },
        ],
      },
    ],
    redFlagHints: [
      "Unexplained rapid weight loss with drenching night sweats (B-symptom red flag)",
      "Severe prostrating fatigue with pallor / postural collapse (Suspected Severe Anemia / Systemic Illness)"
    ],
  },

  Other: {
    category: "Other",
    keywords: [],
    problemsDetector: (text: string) => [
      `Reported Symptom: ${text.slice(0, 60)}`
    ],
    questionTemplates: (lang, detected) => [
      {
        id: "oth_onset",
        text: lang === "hi" ? "यह समस्या कब से शुरू हुई और कितनी बार होती है?" : "When did this problem start and how frequently does it occur?",
        textEn: "When did this problem start and how frequently does it occur?",
        type: "single_choice",
        priority: "high",
        clinicalPurpose: "onset",
        options: [
          { value: "ACUTE_FEW_DAYS", labelHi: "हाल ही में (पिछले कुछ दिनों से)", labelEn: "Recent (Few days)" },
          { value: "CHRONIC_WEEKS_MONTHS", labelHi: "लंबे समय से (हफ्तों या महीनों से)", labelEn: "Chronic (Weeks or months)" },
        ],
      },
      {
        id: "oth_severity",
        text: lang === "hi" ? "१ से १० के पैमाने पर यह समस्या कितनी गंभीर है?" : "On a scale of 1 to 10, how severe is this condition?",
        textEn: "On a scale of 1 to 10, how severe is this condition?",
        type: "single_choice",
        priority: "high",
        clinicalPurpose: "severity",
        options: [
          { value: "MILD_1_3", labelHi: "हल्की (१ से ३)", labelEn: "Mild (1-3)" },
          { value: "MODERATE_4_6", labelHi: "मध्यम (४ से ६)", labelEn: "Moderate (4-6)" },
          { value: "SEVERE_7_10", labelHi: "अत्यधिक गंभीर (७ से १०)", labelEn: "Severe (7-10)", isRedFlag: true },
        ],
      },
      {
        id: "oth_associated",
        text: lang === "hi" ? "क्या इसके साथ बुखार, चक्कर, कमजोरी या दर्द जैसे अन्य लक्षण भी हैं?" : "Are there other associated symptoms like fever, dizziness, weakness, or pain?",
        textEn: "Are there other associated symptoms like fever, dizziness, weakness, or pain?",
        type: "single_choice",
        priority: "medium",
        clinicalPurpose: "associated",
        options: [
          { value: "FEVER_PRESENT", labelHi: "हाँ, साथ में बुखार व बदन दर्द है", labelEn: "Yes, fever & body ache" },
          { value: "NO_OTHER_SYMPTOMS", labelHi: "नहीं, केवल यही मुख्य समस्या है", labelEn: "No other symptoms" },
        ],
      },
      {
        id: "oth_red_flag",
        text: lang === "hi" ? "क्या आपको सांस फूलने, बेहोशी, अत्यधिक दर्द या रक्तस्राव की कोई आपात स्थिति महसूस हो रही है?" : "Are you having any shortness of breath, loss of consciousness, severe pain, or bleeding?",
        textEn: "Are you having any shortness of breath, loss of consciousness, severe pain, or bleeding?",
        type: "yes_no",
        priority: "high",
        clinicalPurpose: "red_flag",
        options: [
          { value: "YES_EMERGENCY", labelHi: "हाँ, आपातकालीन लक्षण हैं", labelEn: "Yes, emergency signs present", isRedFlag: true },
          { value: "NO_EMERGENCY", labelHi: "नहीं, कोई आपातकालीन लक्षण नहीं", labelEn: "No emergency signs" },
        ],
      },
      {
        id: "oth_history",
        text: lang === "hi" ? "क्या आपको पहले कभी ऐसी समस्या हुई थी या कोई दवा ले रहे हैं?" : "Have you had this issue before or are you taking any medications?",
        textEn: "Have you had this issue before or are you taking any medications?",
        type: "single_choice",
        priority: "medium",
        clinicalPurpose: "history",
        options: [
          { value: "PAST_HISTORY_YES", labelHi: "हाँ, पहले भी हो चुका है", labelEn: "Yes, recurred from past" },
          { value: "FIRST_TIME", labelHi: "नहीं, पहली बार हुआ है", labelEn: "First episode" },
        ],
      },
    ],
    redFlagHints: ["Assess for any unexplained acute hemodynamic or respiratory instability"],
  },
};

export class AdaptiveQuestionGenerator {
  /**
   * Classifies the free-text chief complaint into one of the clinical categories
   */
  static classifyChiefComplaint(text: string): ClinicalCategory {
    if (!text || !text.trim()) return "General";

    const normalized = text.toLowerCase().trim();

    // Priority evaluation with specific anatomical keyword checks
    const categories: ClinicalCategory[] = [
      "Chest Pain",
      "Headache",
      "Abdominal Pain",
      "Respiratory",
      "Fever",
      "Musculoskeletal",
      "General",
    ];

    // Direct strong phrase matches
    if (
      normalized.includes("chest") ||
      normalized.includes("seena") ||
      normalized.includes("chhati") ||
      text.includes("छाती") ||
      text.includes("सीना") ||
      normalized.includes("heart") ||
      text.includes("हृदय") ||
      normalized.includes("angina") ||
      normalized.includes("cardiac") ||
      normalized.includes("palpitation")
    ) {
      return "Chest Pain";
    }

    if (
      normalized.includes("head") ||
      normalized.includes("sir dard") ||
      normalized.includes("sirdard") ||
      normalized.includes("sar dard") ||
      normalized.includes("sardard") ||
      text.includes("सिर") ||
      text.includes("सर दर्द") ||
      text.includes("सिरदर्द") ||
      normalized.includes("migraine") ||
      text.includes("माइग्रेन") ||
      normalized.includes("cephalea")
    ) {
      return "Headache";
    }

    if (
      normalized.includes("stomach") ||
      normalized.includes("abdomen") ||
      normalized.includes("pet") ||
      text.includes("पेट") ||
      normalized.includes("belly") ||
      normalized.includes("gastric") ||
      normalized.includes("acidity") ||
      normalized.includes("acid") ||
      normalized.includes("jalan") ||
      text.includes("जलन") ||
      normalized.includes("gas") ||
      text.includes("गैस") ||
      normalized.includes("constipat") ||
      normalized.includes("kabz") ||
      text.includes("कब्ज") ||
      normalized.includes("diarrhea") ||
      normalized.includes("dast") ||
      text.includes("दस्त") ||
      normalized.includes("vomit") ||
      normalized.includes("ulti") ||
      text.includes("उल्टी")
    ) {
      return "Abdominal Pain";
    }

    if (
      normalized.includes("cough") ||
      normalized.includes("khansi") ||
      text.includes("खांसी") ||
      normalized.includes("breath") ||
      normalized.includes("saans") ||
      text.includes("सांस") ||
      normalized.includes("asthma") ||
      normalized.includes("wheez") ||
      normalized.includes("throat") ||
      normalized.includes("gala") ||
      text.includes("गला") ||
      normalized.includes("phlegm") ||
      normalized.includes("sputum") ||
      normalized.includes("balgam") ||
      text.includes("बलगम")
    ) {
      return "Respiratory";
    }

    if (
      normalized.includes("fever") ||
      normalized.includes("bukhar") ||
      text.includes("बुखार") ||
      normalized.includes("temperature") ||
      normalized.includes("chill") ||
      normalized.includes("thand") ||
      text.includes("ठंड") ||
      normalized.includes("shiver") ||
      normalized.includes("pyrexia") ||
      normalized.includes("taap") ||
      text.includes("ताप")
    ) {
      return "Fever";
    }

    if (
      normalized.includes("knee") ||
      normalized.includes("ghutn") ||
      text.includes("घुटने") ||
      text.includes("घुटना") ||
      normalized.includes("joint") ||
      normalized.includes("jod") ||
      text.includes("जोड़") ||
      normalized.includes("back") ||
      normalized.includes("kamar") ||
      text.includes("कमर") ||
      text.includes("पीठ") ||
      normalized.includes("leg") ||
      normalized.includes("taang") ||
      text.includes("टांग") ||
      normalized.includes("pair") ||
      text.includes("पैर") ||
      normalized.includes("foot") ||
      normalized.includes("feet") ||
      normalized.includes("hand") ||
      normalized.includes("hath") ||
      text.includes("हाथ") ||
      normalized.includes("arm") ||
      normalized.includes("shoulder") ||
      normalized.includes("kandha") ||
      text.includes("कंधा") ||
      normalized.includes("neck") ||
      normalized.includes("gardan") ||
      text.includes("गर्दन") ||
      normalized.includes("ankle") ||
      normalized.includes("wrist") ||
      normalized.includes("elbow") ||
      normalized.includes("heel") ||
      normalized.includes("bone") ||
      text.includes("हड्डी") ||
      normalized.includes("muscle") ||
      text.includes("मांसपेशी") ||
      normalized.includes("stiff") ||
      normalized.includes("jakdan") ||
      text.includes("जकड़न") ||
      normalized.includes("swelling") ||
      normalized.includes("sujan") ||
      text.includes("सूजन") ||
      normalized.includes("arthritis") ||
      normalized.includes("gathiya") ||
      text.includes("गठिया") ||
      normalized.includes("pain") ||
      normalized.includes("dard") ||
      text.includes("दर्द") ||
      normalized.includes("body ache") ||
      normalized.includes("body pain") ||
      text.includes("बदन दर्द")
    ) {
      return "Musculoskeletal";
    }

    let bestCategory: ClinicalCategory = "General";
    let maxScore = 0;

    for (const cat of categories) {
      const profile = CATEGORY_PROFILES[cat];
      if (!profile) continue;

      let score = 0;
      for (const kw of profile.keywords) {
        const kwLower = kw.toLowerCase();
        if (normalized.includes(kwLower) || text.includes(kw)) {
          score += kwLower.length >= 5 ? 3 : 1;
        }
      }

      if (score > maxScore) {
        maxScore = score;
        bestCategory = cat;
      }
    }

    return bestCategory;
  }


  /**
   * Generates dynamic, structured adaptive questions for a patient encounter
   */
  static async generateQuestions(
    input: AdaptiveQuestionGeneratorInput
  ): Promise<AdaptiveQuestionGeneratorOutput> {
    const rawText = input.chiefComplaint?.trim() || "";
    const lang = input.language === "en" ? "en" : "hi";

    const category = this.classifyChiefComplaint(rawText);
    const profile = CATEGORY_PROFILES[category] || CATEGORY_PROFILES.General;

    const detectedProblems = profile.problemsDetector(rawText);
    if (detectedProblems.length === 0) {
      detectedProblems.push(rawText ? `Symptom: ${rawText}` : "General Clinical Consultation");
    }

    // Generate core questions according to SOCRATES / Dashavidha clinical domains
    const coreQuestions = profile.questionTemplates(lang, detectedProblems);

    const isAyushMode = input.intakeMode === "AYURVEDA" || !input.intakeMode;

    let tailoredCoreQuestions: AdaptiveQuestion[] = [];

    if (isAyushMode) {
      // AYUSH Mode: Emphasize Dosha dynamics, Agni (digestive fire), Prakriti, and Ama indicators
      const ayushQuestions: AdaptiveQuestion[] = [
        {
          id: "AYU_PRAKRITI_DYNAMIC",
          text: lang === "hi"
            ? "आपकी शारीरिक प्रकृति और स्वभाव कैसा है? (वात: दुबला/चंचल, पित्त: मध्यम/गर्मी सहन न होना, कफ: भारी/शांत)"
            : "What is your primary physical constitution (Prakriti)? (Vata: Lean/Dry, Pitta: Medium/Heat-sensitive, Kapha: Solid/Calm)",
          textEn: "What is your primary physical constitution (Prakriti)? (Vata: Lean/Dry, Pitta: Medium/Heat-sensitive, Kapha: Solid/Calm)",
          type: "single_choice",
          priority: "high",
          clinicalPurpose: "associated",
          options: [
            { value: "VATA_DOMINANT", labelHi: "वात प्रधान (रूखी त्वचा, ठंड लगना, जोड़ों में चटकन)", labelEn: "Vata Dominant (Dry skin, joint crackling, cold sensitive)" },
            { value: "PITTA_DOMINANT", labelHi: "पित्त प्रधान (जलन, पसीना, गुस्सा/चिड़चिड़ापन, खट्टी डकार)", labelEn: "Pitta Dominant (Burning sensation, sweating, acidity)" },
            { value: "KAPHA_DOMINANT", labelHi: "कफ प्रधान (भारीपन, सुस्ती, कफ/बलगम, धीमी भूख)", labelEn: "Kapha Dominant (Heaviness, sluggishness, phlegm)" },
            { value: "SAMA_BALANCED", labelHi: "सम प्रकृति (संतुलित स्वभाव)", labelEn: "Balanced (Samadosha)" },
          ],
        },
        {
          id: "AYU_AGNI_DYNAMIC",
          text: lang === "hi"
            ? "आपकी जठराग्नि (भूख व पाचन शक्ति) की वर्तमान स्थिति क्या है?"
            : "What is the state of your digestive fire (Agni) and appetite?",
          textEn: "What is the state of your digestive fire (Agni) and appetite?",
          type: "single_choice",
          priority: "high",
          clinicalPurpose: "associated",
          options: [
            { value: "SAMAGNI", labelHi: "समाग्नि - समय पर नियमित भूख व उत्तम पाचन", labelEn: "Samagni (Balanced, regular appetite & digestion)" },
            { value: "MANDAGNI", labelHi: "मंदाग्नि - भूख कम लगना, भोजन देर से पचना व पेट भारी रहना", labelEn: "Mandagni (Low appetite, delayed digestion, heaviness)" },
            { value: "TIKSHNAGNI", labelHi: "तीक्ष्णाग्नि - बहुत तेज भूख, सीने व गले में तीखी जलन", labelEn: "Tikshnagni (Intense hunger, severe burning reflux)" },
            { value: "VISHAMAGNI", labelHi: "विषमाग्नि - कभी तेज भूख कभी बिल्कुल नहीं, पेट में गैस/अफरा", labelEn: "Vishamagni (Irregular hunger, gas & bloating)" },
          ],
        },
        {
          id: "AYU_AMA_LAKSHANA",
          text: lang === "hi"
            ? "क्या जीभ पर सफेद मैल (लिप्तता), सुबह उठने पर भारीपन, शरीर में जकड़न या मुंह में अरुचि है? (साम लक्षण)"
            : "Do you notice a coated tongue, morning stiffness/sluggishness, or metallic/foul taste? (Ama signs)",
          textEn: "Do you notice a coated tongue, morning stiffness/sluggishness, or metallic/foul taste? (Ama signs)",
          type: "single_choice",
          priority: "high",
          clinicalPurpose: "associated",
          options: [
            { value: "AMA_PRESENT", labelHi: "हाँ, जीभ पर सफेद परत व शरीर में भारीपन/आलस्य है (Ama present)", labelEn: "Yes, coated tongue & sluggish heaviness (Ama+)" },
            { value: "NIRAMA_CLEAR", labelHi: "नहीं, जीभ साफ है और शरीर हल्का महसूस होता है (Nirama / Clear)", labelEn: "No, clean tongue & light body (Nirama)" },
          ],
        },
      ];

      tailoredCoreQuestions = [...coreQuestions, ...ayushQuestions];
    } else {
      // GENERAL Clinic Mode: Standard clinical organ/pain triage (SOCRATES, Radiation, Aggravating triggers, General history)
      const clinicQuestions: AdaptiveQuestion[] = [
        {
          id: "GEN_ORGAN_DAILY_IMPACT",
          text: lang === "hi"
            ? "इस दर्द/लक्षण से आपकी दैनिक दिनचर्या या काम पर कितना असर पड़ रहा है?"
            : "How much does this symptom or pain interfere with your daily routine and work?",
          textEn: "How much does this symptom or pain interfere with your daily routine and work?",
          type: "single_choice",
          priority: "medium",
          clinicalPurpose: "severity",
          options: [
            { value: "MILD_INTERFERENCE", labelHi: "हल्का असर - काम सामान्य रूप से कर पाते हैं (Mild)", labelEn: "Mild - Can perform normal activities" },
            { value: "MODERATE_INTERFERENCE", labelHi: "मध्यम असर - काम में रुकावट व आराम की जरूरत (Moderate)", labelEn: "Moderate - Daily activities affected" },
            { value: "SEVERE_BEDREST", labelHi: "गंभीर असर - सामान्य चलना-फिरना या काम करना असंभव (Severe)", labelEn: "Severe - Unable to perform basic tasks" },
          ],
        },
        {
          id: "GEN_MEDICATION_RELIEF",
          text: lang === "hi"
            ? "क्या आपने इस दर्द के लिए कोई पेनकिलर, एंटासिड या अन्य दवा ली और क्या उससे आराम मिला?"
            : "Have you taken any painkiller, antacid, or other medication for relief?",
          textEn: "Have you taken any painkiller, antacid, or other medication for relief?",
          type: "single_choice",
          priority: "medium",
          clinicalPurpose: "relieving",
          options: [
            { value: "RELIEF_WITH_MEDS", labelHi: "हाँ, दवा लेने पर कुछ समय के लिए आराम मिला", labelEn: "Yes, temporary relief with medication" },
            { value: "NO_RELIEF_WITH_MEDS", labelHi: "दवा ली लेकिन कोई आराम नहीं मिला", labelEn: "Took medication, but no relief" },
            { value: "NO_MEDICATION_TAKEN", labelHi: "कोई दवा नहीं ली", labelEn: "No medication taken yet" },
          ],
        },
      ];

      // Filter out any purely ayurvedic specific tokens from core questions for General mode
      const generalCore = coreQuestions.filter((q) => !q.id.includes("ayush_ama"));
      tailoredCoreQuestions = [...generalCore, ...clinicQuestions];
    }

    // Append structured modular history questions:
    // 1. Family History
    // 2. Social & Habits History
    const historyQuestions: AdaptiveQuestion[] = [
      {
        id: "FH_DIABETES_HTN",
        text: lang === "hi"
          ? "क्या आपके परिवार (माता-पिता, भाई-बहन) में किसी को शुगर (डायबिटीज) या उच्च रक्तचाप (BP) है?"
          : "Does anyone in your direct family (Parents, Siblings) have Diabetes or High Blood Pressure (Hypertension)?",
        textEn: "Does anyone in your direct family (Parents, Siblings) have Diabetes or High Blood Pressure (Hypertension)?",
        type: "single_choice",
        priority: "medium",
        clinicalPurpose: "family_history",
        options: [
          { value: "YES_PARENTS", labelHi: "हाँ, माता या पिता को (Yes, Parents)", labelEn: "Yes, Parents" },
          { value: "YES_SIBLINGS", labelHi: "हाँ, भाई या बहन को (Yes, Siblings)", labelEn: "Yes, Siblings" },
          { value: "NO", labelHi: "नहीं, किसी को नहीं (No family history)", labelEn: "No" },
          { value: "SKIP", labelHi: "छोड़ें / पता नहीं (Skip)", labelEn: "Skip" },
        ],
      },
      {
        id: "SOC_HABITS",
        text: lang === "hi"
          ? "क्या आप तंबाकू/गुटखा, बीड़ी/सिगरेट या शराब का सेवन करते हैं?"
          : "Do you consume Tobacco/Gutka, Smoke Bidi/Cigarettes, or drink Alcohol?",
        textEn: "Do you consume Tobacco/Gutka, Smoke Bidi/Cigarettes, or drink Alcohol?",
        type: "single_choice",
        priority: "medium",
        clinicalPurpose: "social_history",
        options: [
          { value: "NONE_CLEAN", labelHi: "कोई व्यसन नहीं (No habits - Clean)", labelEn: "No habits (Clean)" },
          { value: "SMOKING", labelHi: "बीड़ी / सिगरेट (Smoking)", labelEn: "Smoking" },
          { value: "TOBACCO_GUTKA", labelHi: "तंबाकू / गुटखा (Tobacco / Gutka)", labelEn: "Tobacco / Gutka" },
          { value: "ALCOHOL", labelHi: "मद्यपान / शराब (Alcohol)", labelEn: "Alcohol" },
          { value: "SKIP", labelHi: "छोड़ें (Skip)", labelEn: "Skip" },
        ],
      },
    ];

    const questions = [...tailoredCoreQuestions, ...historyQuestions];

    return {
      detectedProblems,
      category,
      questions,
      redFlagHints: profile.redFlagHints,
    };
  }
}
