import { EngineQuestionDefinition } from "./types";

export const AYURVEDA_DASHAVIDHA_TREES: Record<string, EngineQuestionDefinition> = {
  // 1. PRAKRITI (CONSTITUTIONAL DOSHA)
  AYU_PRAKRITI: {
    nodeCode: "AYU_PRAKRITI",
    chiefComplaintCategory: "GENERAL",
    clinicalDomain: "PRAKRITI_PARIKSHA",
    questionText: "Which best describes your natural body frame and skin texture?",
    questionTextHindi: "आपकी प्राकृतिक शारीरिक बनावट और त्वचा का स्वभाव कैसा है?",
    questionType: "SINGLE_CHOICE",
    options: [
      { value: "VATA", labelHi: "पतला शरीर, रूखी त्वचा व चंचल स्वभाव (Vata: Lean, Dry skin)", labelEn: "Lean / Dry skin (Vata)" },
      { value: "PITTA", labelHi: "मध्यम शरीर, गर्म त्वचा व अधिक पसीना (Pitta: Medium build, Warm)", labelEn: "Medium build (Pitta)" },
      { value: "KAPHA", labelHi: "मजबूत चौड़ा शरीर, चिकनी व ठंडी त्वचा (Kapha: Broad, Moist skin)", labelEn: "Solid / Moist skin (Kapha)" },
    ],
    nextRules: [{ targetNodeCode: "AYU_AGNI" }],
  },

  // 2. AGNI (DIGESTIVE METABOLIC FIRE)
  AYU_AGNI: {
    nodeCode: "AYU_AGNI",
    chiefComplaintCategory: "GENERAL",
    clinicalDomain: "AGNI_PARIKSHA",
    questionText: "How is your appetite and digestion after meals?",
    questionTextHindi: "आपकी भूख और भोजन पचने की क्षमता कैसी रहती है?",
    questionType: "SINGLE_CHOICE",
    options: [
      { value: "SAMAGNI", labelHi: "नियमित व संतुलित पाचन (Samagni: Regular digestion)", labelEn: "Balanced (Samagni)" },
      { value: "MANDAGNI", labelHi: "धीमी भूख, पेट में भारीपन व सुस्ती (Mandagni: Heavy, Sluggish)", labelEn: "Sluggish (Mandagni)" },
      { value: "TIKSHNAGNI", labelHi: "अत्यधिक तेज भूख, सीने में जलन (Tikshnagni: Excessive hunger/Acidity)", labelEn: "Intense (Tikshnagni)" },
      { value: "VISHAMAGNI", labelHi: "कभी तेज भूख कभी बिल्कुल नहीं, गैस व अफरा (Vishamagni: Irregular)", labelEn: "Irregular (Vishamagni)" },
    ],
    nextRules: [{ targetNodeCode: "AYU_KOSHTHA" }],
  },

  // 3. KOSHTHA (BOWEL HABITS)
  AYU_KOSHTHA: {
    nodeCode: "AYU_KOSHTHA",
    chiefComplaintCategory: "GENERAL",
    clinicalDomain: "KOSHTHA_PARIKSHA",
    questionText: "How are your bowel evacuation habits?",
    questionTextHindi: "पेट साफ होने (शौच) की स्थिति कैसी रहती है?",
    questionType: "SINGLE_CHOICE",
    options: [
      { value: "MRIDU", labelHi: "दिन में कई बार या आसानी से साफ (Mridu: Soft / Frequent)", labelEn: "Soft / Rapid (Mridu)" },
      { value: "MADHYAMA", labelHi: "दिन में १-२ बार सामान्य रूप से (Madhyama: Normal regular)", labelEn: "Normal (Madhyama)" },
      { value: "KRURA", labelHi: "कड़ा मल या कब्जियत की प्रवृत्ति (Krura: Hard stool / Constipation)", labelEn: "Hard / Constipated (Krura)" },
    ],
    nextRules: [{ targetNodeCode: "AYU_SATTVA" }],
  },

  // 4. SATTVA (MENTAL TEMPERAMENT)
  AYU_SATTVA: {
    nodeCode: "AYU_SATTVA",
    chiefComplaintCategory: "GENERAL",
    clinicalDomain: "SATTVA_PARIKSHA",
    questionText: "How do you respond to stress, anxiety, or illness?",
    questionTextHindi: "तनाव, चिंता या बीमारी के समय आपका मानसिक संतुलन कैसा रहता है?",
    questionType: "SINGLE_CHOICE",
    options: [
      { value: "PRAVARA", labelHi: "धैर्यवान व शांत रहते हैं (Pravara: Resilient & calm)", labelEn: "High Resilience (Pravara)" },
      { value: "MADHYAMA", labelHi: "थोड़ा समय लगता है फिर संभल जाते हैं (Madhyama: Moderate)", labelEn: "Moderate (Madhyama)" },
      { value: "AVARA", labelHi: "जल्दी घबरा जाते हैं या डर लगता है (Avara: Easily anxious)", labelEn: "Low Resilience (Avara)" },
    ],
    nextRules: [{ targetNodeCode: "AYU_VYAYAMA_BALA" }],
  },

  // 5. VYAYAMA SHAKTI & BALA (PHYSICAL CAPACITY)
  AYU_VYAYAMA_BALA: {
    nodeCode: "AYU_VYAYAMA_BALA",
    chiefComplaintCategory: "GENERAL",
    clinicalDomain: "BALA_VYAYAMA_PARIKSHA",
    questionText: "What is your physical endurance and capacity for daily exertion?",
    questionTextHindi: "आपकी शारीरिक शक्ति और परिश्रम करने की क्षमता कैसी है?",
    questionType: "SINGLE_CHOICE",
    options: [
      { value: "PRAVARA_BALA", labelHi: "उत्तम शक्ति, भारी काम भी आसानी से (High stamina)", labelEn: "High Stamina" },
      { value: "MADHYAMA_BALA", labelHi: "मध्यम शक्ति, सामान्य काम कर लेते हैं (Moderate)", labelEn: "Moderate Stamina" },
      { value: "AVARA_BALA", labelHi: "जल्दी थकान व कमजोरी महसूस होती है (Low stamina / Fatigue)", labelEn: "Low Stamina / Fatigue" },
    ],
    nextRules: [{ targetNodeCode: "AYU_NIDRA" }],
  },

  // 6. NIDRA & AHARA-VIHARA (SLEEP & LIFESTYLE)
  AYU_NIDRA: {
    nodeCode: "AYU_NIDRA",
    chiefComplaintCategory: "GENERAL",
    clinicalDomain: "NIDRA_LIFESTYLE_PARIKSHA",
    questionText: "How is your quality of sleep at night?",
    questionTextHindi: "रात में आपकी नींद की गुणवत्ता कैसी रहती है?",
    questionType: "SINGLE_CHOICE",
    options: [
      { value: "SUKHA_NIDRA", labelHi: "गहरी व आरामदायक नींद (Sound restful sleep)", labelEn: "Sound sleep" },
      { value: "ALPA_NIDRA", labelHi: "कम नींद, बार-बार खुलना (Interrupted / Insomnia)", labelEn: "Interrupted / Insomnia" },
      { value: "ATI_NIDRA", labelHi: "अत्यधिक नींद व दिन में आलस्य (Excessive sleep / Heaviness)", labelEn: "Excessive sleep" },
    ],
    nextRules: [],
  },
};
