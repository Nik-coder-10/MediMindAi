import { prisma } from "@/lib/db/prisma";
import { DoshaDominance } from "@prisma/client";

export interface DashavidhaDataDTO {
  sessionId: string;
  prakriti: "VATA" | "PITTA" | "KAPHA" | "VATA_PITTA" | "PITTA_KAPHA" | "VATA_KAPHA" | "SAMADOSHA";
  vikriti?: "VATA" | "PITTA" | "KAPHA" | "VATA_PITTA" | "PITTA_KAPHA" | "VATA_KAPHA" | "SAMADOSHA";
  agni?: "SAMA" | "MANDA" | "TIKSHNA" | "VISHAMA";
  koshtha?: "MRIDU" | "MADHYAMA" | "KRURA";
  sattva?: "PRAVARA" | "MADHYAMA" | "AVARA";
  bala?: "PRAVARA" | "MADHYAMA" | "AVARA";
  vyayamaShakti?: string;
  aharaShakti?: string;
  nidra?: string;
  aharaVihara?: Record<string, unknown>;
  notes?: string;
}

export interface ClassifiedAyurvedicProfile {
  prakriti: "VATA" | "PITTA" | "KAPHA" | "VATA_PITTA" | "PITTA_KAPHA" | "VATA_KAPHA" | "SAMADOSHA";
  prakritiLabelHi: string;
  prakritiLabelEn: string;
  vikriti: "VATA" | "PITTA" | "KAPHA" | "VATA_PITTA" | "PITTA_KAPHA" | "VATA_KAPHA" | "SAMADOSHA";
  vikritiLabelHi: string;
  vikritiLabelEn: string;
  agni: "SAMA" | "MANDA" | "TIKSHNA" | "VISHAMA";
  agniLabelHi: string;
  agniLabelEn: string;
  koshtha: "MRIDU" | "MADHYAMA" | "KRURA";
  koshthaLabelHi: string;
  koshthaLabelEn: string;
  sattva: "PRAVARA" | "MADHYAMA" | "AVARA";
  sattvaLabelHi: string;
  sattvaLabelEn: string;
  bala: "PRAVARA" | "MADHYAMA" | "AVARA";
  balaLabelHi: string;
  balaLabelEn: string;
  doshicDistribution: {
    vata: number;
    pitta: number;
    kapha: number;
  };
  pathya: string[];
  apathya: string[];
  nidanaPanchakaNotes: string;
}

export class AyurvedaAssessmentService {
  /**
   * Dynamically and clinically classifies the patient's Ayurvedic & Dashavidha
   * profile based on the specific problem described (chief complaint, answers, & facts).
   * Adheres strictly to Charaka Samhita & Sushruta Samhita Rogi-Roga Pariksha principles.
   */
  static classifyFromProblem(
    complaintText: string = "",
    answers: Array<{ nodeCode: string; answerValue: unknown }> = [],
    collectedFacts: Record<string, any> = {}
  ): ClassifiedAyurvedicProfile {
    const text = `${complaintText} ${JSON.stringify(answers)} ${JSON.stringify(collectedFacts)}`.toLowerCase();
    const rawComplaint = complaintText.toLowerCase();

    // 1. Direct answer extraction if patient completed dynamic Ayush questions
    let explicitPrakriti: DoshaDominance | null = null;
    let explicitAgni: "SAMA" | "MANDA" | "TIKSHNA" | "VISHAMA" | null = null;
    let explicitAma: boolean = false;

    for (const ans of answers) {
      const val = String(ans.answerValue || "");
      if (ans.nodeCode.includes("PRAK")) {
        if (val.includes("VATA_DOMINANT")) explicitPrakriti = "VATA_PITTA";
        else if (val.includes("PITTA_DOMINANT")) explicitPrakriti = "PITTA_KAPHA";
        else if (val.includes("KAPHA_DOMINANT")) explicitPrakriti = "VATA_KAPHA";
        else if (val.includes("SAMA_BALANCED")) explicitPrakriti = "SAMADOSHA";
      }
      if (ans.nodeCode.includes("AGNI")) {
        if (val.includes("MANDAGNI")) explicitAgni = "MANDA";
        else if (val.includes("TIKSHNAGNI")) explicitAgni = "TIKSHNA";
        else if (val.includes("VISHAMAGNI")) explicitAgni = "VISHAMA";
        else if (val.includes("SAMAGNI")) explicitAgni = "SAMA";
      }
      if (ans.nodeCode.includes("AMA")) {
        if (val.includes("AMA_PRESENT")) explicitAma = true;
      }
    }

    // 2. Domain classification based on clinical keywords & organ system
    // A. Anorectal / Lower Pelvic / Sciatica / Buttock / Lower Back (Guda / Kati / Trika / Gridhrasi)
    const isAnorectalOrGluteal =
      text.includes("pichhwade") ||
      text.includes("pichwade") ||
      text.includes("buttock") ||
      text.includes("anus") ||
      text.includes("guda") ||
      text.includes("piles") ||
      text.includes("bawasir") ||
      text.includes("बवासीर") ||
      text.includes("fissure") ||
      text.includes("fistula") ||
      text.includes("bhagandar") ||
      text.includes("भगंदर") ||
      text.includes("anal") ||
      text.includes("rectal") ||
      text.includes("pelvic") ||
      text.includes("sciatica") ||
      text.includes("gridhrasi") ||
      text.includes("गृध्रसी") ||
      text.includes("coccyx") ||
      text.includes("hip pain") ||
      text.includes("koolhe") ||
      text.includes("कूल्हे");

    // B. Musculoskeletal / Joint / Bone / Lumbago (Sandhigata Vata / Asthi-Majja)
    const isMusculoskeletal =
      text.includes("knee") ||
      text.includes("ghutn") ||
      text.includes("घुटने") ||
      text.includes("घुटना") ||
      text.includes("घुटनों") ||
      text.includes("joint") ||
      text.includes("jod") ||
      text.includes("जोड़") ||
      text.includes("जोड़ों") ||
      text.includes("back") ||
      text.includes("kamar") ||
      text.includes("कमर") ||
      text.includes("peeth") ||
      text.includes("पीठ") ||
      text.includes("neck") ||
      text.includes("gardan") ||
      text.includes("गर्दन") ||
      text.includes("shoulder") ||
      text.includes("kandha") ||
      text.includes("कंधा") ||
      text.includes("cramp") ||
      text.includes("sprain") ||
      text.includes("gathiya") ||
      text.includes("गठिया") ||
      text.includes("arthritis") ||
      text.includes("amavata") ||
      text.includes("sandhivata") ||
      text.includes("body pain") ||
      text.includes("badan dard") ||
      text.includes("बदन दर्द");

    // C. Gastrointestinal / Abdominal / Digestion / Acidity / IBS (Annavaha / Purishavaha Srotas)
    const isDigestive =
      text.includes("pet") ||
      text.includes("पेट") ||
      text.includes("stomach") ||
      text.includes("abdomen") ||
      text.includes("abdominal") ||
      text.includes("gas") ||
      text.includes("bloat") ||
      text.includes("acidity") ||
      text.includes("acid") ||
      text.includes("jalan") ||
      text.includes("जलन") ||
      text.includes("heartburn") ||
      text.includes("constipat") ||
      text.includes("kabz") ||
      text.includes("कब्ज") ||
      text.includes("loose motion") ||
      text.includes("dast") ||
      text.includes("दस्त") ||
      text.includes("diarrhea") ||
      text.includes("ulcer") ||
      text.includes("vomit") ||
      text.includes("ulti") ||
      text.includes("उल्टी") ||
      text.includes("nausea") ||
      text.includes("indigestion") ||
      text.includes("apach") ||
      text.includes("अपच");

    // D. Respiratory / Chest / Cough / Cold / Asthma (Pranavaha Srotas / Shwasa-Kasa)
    const isRespiratory =
      text.includes("cough") ||
      text.includes("khansi") ||
      text.includes("खांसी") ||
      text.includes("cold") ||
      text.includes("zukam") ||
      text.includes("जुकाम") ||
      text.includes("breath") ||
      text.includes("saans") ||
      text.includes("सांस") ||
      text.includes("asthma") ||
      text.includes("dama") ||
      text.includes("दमा") ||
      text.includes("wheez") ||
      text.includes("throat") ||
      text.includes("gala") ||
      text.includes("गला") ||
      text.includes("chest") ||
      text.includes("chhati") ||
      text.includes("छाती") ||
      text.includes("balgam") ||
      text.includes("बलगम") ||
      text.includes("phlegm");

    // E. Fever / Infection / Pyrexia (Jwara)
    const isFever =
      text.includes("fever") ||
      text.includes("bukhar") ||
      text.includes("बुखार") ||
      text.includes("temperature") ||
      text.includes("chill") ||
      text.includes("thand") ||
      text.includes("ठंड") ||
      text.includes("shiver") ||
      text.includes("taap") ||
      text.includes("ताप") ||
      text.includes("jwara") ||
      text.includes("ज्वर");

    // F. Head / Mind / Neurological / Migraine / Sleep (Shiroroga / Manovaha Srotas)
    const isHeadNeurological =
      text.includes("headache") ||
      text.includes("head") ||
      text.includes("sir dard") ||
      text.includes("sar dard") ||
      text.includes("सिरदर्द") ||
      text.includes("सरदर्द") ||
      text.includes("migraine") ||
      text.includes("adhakpari") ||
      text.includes("dizziness") ||
      text.includes("chakkar") ||
      text.includes("चक्कर") ||
      text.includes("stress") ||
      text.includes("anxiety") ||
      text.includes("insomnia") ||
      text.includes("neend") ||
      text.includes("तनाव") ||
      text.includes("अनिद्रा");

    // G. Skin / Dermatology / Allergy / Rash (Kushtha / Twacha)
    const isDermatology =
      text.includes("skin") ||
      text.includes("khujli") ||
      text.includes("खुजली") ||
      text.includes("itching") ||
      text.includes("rash") ||
      text.includes("daane") ||
      text.includes("दाने") ||
      text.includes("allergy") ||
      text.includes("fungal") ||
      text.includes("eczema") ||
      text.includes("psoriasis");

    // 3. Synthesize Dashavidha metrics tailored to the problem
    let prakriti: DoshaDominance = explicitPrakriti || "VATA_PITTA";
    let prakritiLabelHi = "वात-पित्त (Vata-Pitta)";
    let prakritiLabelEn = "Vata-Pitta Dominant";

    let vikriti: DoshaDominance = "VATA";
    let vikritiLabelHi = "वात प्रकोप (Vata Dushti)";
    let vikritiLabelEn = "Vata Vitiation";

    let agni: "SAMA" | "MANDA" | "TIKSHNA" | "VISHAMA" = explicitAgni || "VISHAMA";
    let agniLabelHi = "विषमाग्नि (अस्थिर पाचन)";
    let agniLabelEn = "Vishamagni (Irregular Metabolism)";

    let koshtha: "MRIDU" | "MADHYAMA" | "KRURA" = "MADHYAMA";
    let koshthaLabelHi = "मध्यम कोष्ठ (सामान्य)";
    let koshthaLabelEn = "Madhyama (Normal Bowel)";

    let sattva: "PRAVARA" | "MADHYAMA" | "AVARA" = "MADHYAMA";
    let sattvaLabelHi = "मध्यम सत्त्व (सामान्य सहनशीलता)";
    let sattvaLabelEn = "Madhyama (Moderate Resilience)";

    let bala: "PRAVARA" | "MADHYAMA" | "AVARA" = "MADHYAMA";
    let balaLabelHi = "मध्यम बल";
    let balaLabelEn = "Madhyama (Moderate Endurance)";

    let doshicDistribution = { vata: 40, pitta: 35, kapha: 25 };
    let pathya: string[] = [];
    let apathya: string[] = [];
    let nidanaPanchakaNotes = "";

    // Specific Domain Logic
    if (isAnorectalOrGluteal) {
      // Guda / Pelvic / Lower Spine / Sciatic nerve pathway — Apana Vayu disturbance with localized stagnation
      prakriti = explicitPrakriti || "VATA_KAPHA";
      prakritiLabelHi = "वात-कफ (Vata-Kapha)";
      prakritiLabelEn = "Vata-Kapha Constitutional";

      vikriti = "VATA";
      vikritiLabelHi = "अपान वात दृष्टि (Apana Vata Dushti / Shoola)";
      vikritiLabelEn = "Apana Vayu Aggravation & Pelvic Pain";

      agni = explicitAgni || "MANDA";
      agniLabelHi = "मंदाग्नि (धीमा पाचन व मलावरोध)";
      agniLabelEn = "Mandagni (Hypo-metabolism & Sluggish Transit)";

      koshtha = "KRURA";
      koshthaLabelHi = "क्रूर कोष्ठ (कठिन मल / मलावरोध)";
      koshthaLabelEn = "Krura (Constipated / Hard Bowel Transit)";

      sattva = "MADHYAMA";
      sattvaLabelHi = "मध्यम सत्त्व (वेदना से विचलित)";
      sattvaLabelEn = "Madhyama (Discomfort-driven)";

      bala = "MADHYAMA";
      balaLabelHi = "मध्यम बल (बैठने व चलने में कष्ट)";
      balaLabelEn = "Madhyama (Impaired Sitting & Gait)";

      doshicDistribution = { vata: 58, pitta: 22, kapha: 20 };

      pathya = [
        "गुनगुना जल व त्रिफला क्वाथ अवगाहन (Warm water sitz bath)",
        "घी, पपीता, मुनक्का व रेशेदार सुपाच्य आहार (Ghee, papaya, soaked raisins)",
        "इसबगोल व गुनगुना दूध रात्रि में (Isabgol husk with lukewarm milk)",
      ];
      apathya = [
        "कठोर आसन पर देर तक बैठना (Prolonged sitting on hard surfaces)",
        "अति तीखा, मिर्च-मसाला व सूखा रुक्ष भोजन (Spicy, dry & pungent food)",
        "वेग विधारण - मल-मूत्र के वेग को रोकना (Suppression of natural urges)",
      ];
      nidanaPanchakaNotes =
        "अपान वायु विकृति एवं श्रोणि-गुद प्रदेश में वात शूल (Apana Vayu Dushti localized in pelvic/gluteal region with secondary bowel stagnation).";
    } else if (isMusculoskeletal) {
      // Sandhigata Vata / Asthi-Dhatu Kshaya / Vata-Vyadhi
      prakriti = explicitPrakriti || "VATA";
      prakritiLabelHi = "वात प्रधान (Vata Dominant)";
      prakritiLabelEn = "Vata Dominant";

      vikriti = text.includes("amavata") || text.includes("सूजन") || text.includes("swelling") ? "VATA_KAPHA" : "VATA";
      vikritiLabelHi = vikriti === "VATA_KAPHA" ? "वात-कफ (आमवात/शोथ)" : "वात प्रकोप (संधिवात शूल)";
      vikritiLabelEn = vikriti === "VATA_KAPHA" ? "Vata-Kapha (Inflammatory Amavata)" : "Pure Vata (Osteoarthritic Shoola)";

      agni = explicitAgni || (vikriti === "VATA_KAPHA" ? "MANDA" : "VISHAMA");
      agniLabelHi = agni === "MANDA" ? "मंदाग्नि (आम निर्मिति)" : "विषमाग्नि (अनियमित पाचन)";
      agniLabelEn = agni === "MANDA" ? "Mandagni (Ama formation)" : "Vishamagni (Irregular Appetite)";

      koshtha = "KRURA";
      koshthaLabelHi = "क्रूर कोष्ठ (वात शुष्कता)";
      koshthaLabelEn = "Krura (Vata Dryness)";

      sattva = "MADHYAMA";
      sattvaLabelHi = "मध्यम सत्त्व";
      sattvaLabelEn = "Madhyama";

      bala = "AVARA";
      balaLabelHi = "अवर बल (गतिशीलता प्रभावित)";
      balaLabelEn = "Avara (Mobility Restricted)";

      doshicDistribution = { vata: 65, pitta: 20, kapha: 15 };

      pathya = [
        "लहसुन, सोंठ व अजवाइन सिद्ध तेल से अभ्यंग (Medicated oil massage)",
        "गुनगुना पानी, मूंग दाल व दशमूल क्वाथ (Warm water & Dashamoola decoction)",
        "हल्का गर्म स्वेदन व विश्राम (Gentle fomentation & joint rest)",
      ];
      apathya = [
        "शीत जल स्नान व ठंडी हवा का सीधा स्पर्श (Cold water exposure)",
        "उड़द, चना, राजमा व बासी आहार (Heavy legumes & dry gas-forming meals)",
        "अत्यधिक वजन उठाना व अत्यधिक चलना (Heavy lifting & excessive exertion)",
      ];
      nidanaPanchakaNotes =
        "अस्थि-सन्धि आश्रित वात प्रकोप एवं गति-स्तम्भ (Vata Prakopa in joints causing stiffness, crepitus, and mobility deficit).";
    } else if (isDigestive) {
      // Annavaha Srotas / Agnimandya / Amlapitta / Grahani
      const isAcidity = text.includes("acid") || text.includes("jalan") || text.includes("जलन") || text.includes("heartburn");
      const isDiarrhea = text.includes("loose") || text.includes("dast") || text.includes("दस्त") || text.includes("diarrhea");

      prakriti = explicitPrakriti || (isAcidity ? "PITTA" : "VATA_PITTA");
      prakritiLabelHi = isAcidity ? "पित्त प्रधान (Pitta Dominant)" : "वात-पित्त (Vata-Pitta)";
      prakritiLabelEn = isAcidity ? "Pitta Dominant" : "Vata-Pitta";

      vikriti = isAcidity ? "PITTA" : isDiarrhea ? "PITTA_KAPHA" : "VATA_KAPHA";
      vikritiLabelHi = isAcidity ? "पित्त प्रकोप (अम्लपित्त/दाह)" : "कफ-वात (मंदाग्नि / अजीर्ण)";
      vikritiLabelEn = isAcidity ? "Pitta Prakopa (Amlapitta/Hyperacidity)" : "Kapha-Vata (Agnimandya/Dyspepsia)";

      agni = explicitAgni || (isAcidity ? "TIKSHNA" : "MANDA");
      agniLabelHi = isAcidity ? "तीक्ष्णाग्नि (अति अम्लता व दाह)" : "मंदाग्नि (अजीर्ण व भारीपन)";
      agniLabelEn = isAcidity ? "Tikshnagni (Hyperchlorhydria/Acid burn)" : "Mandagni (Hypochlorhydria/Indigestion)";

      koshtha = isDiarrhea ? "MRIDU" : isAcidity ? "MADHYAMA" : "KRURA";
      koshthaLabelHi = isDiarrhea ? "मृदु कोष्ठ (अतिसार प्रवणता)" : isAcidity ? "मध्यम कोष्ठ" : "क्रूर कोष्ठ (कब्ज)";
      koshthaLabelEn = isDiarrhea ? "Mridu (Hyperactive)" : isAcidity ? "Madhyama (Moderate)" : "Krura (Constipated)";

      sattva = "MADHYAMA";
      sattvaLabelHi = "मध्यम सत्त्व";
      sattvaLabelEn = "Madhyama";

      bala = "MADHYAMA";
      balaLabelHi = "मध्यम बल";
      balaLabelEn = "Madhyama";

      doshicDistribution = isAcidity
        ? { vata: 20, pitta: 65, kapha: 15 }
        : { vata: 45, pitta: 20, kapha: 35 };

      pathya = isAcidity
        ? [
            "ठंडा दूध, नारियल पानी, मिश्री व धनिया जल (Coriander water, coconut water)",
            "पुराना साठी चावल, मूंग दाल खिचड़ी व परवल (Moong khichdi & pointed gourd)",
            "आंवला चूर्ण व मुलेठी का क्वाथ (Amla & licorice decoction)",
          ]
        : [
            "सोंठ, हिंग्वाष्टक चूर्ण व गुनगुना पानी (Ginger, Hing & warm water)",
            "लघु व सुपाच्य भोजन (Light, easily digestible freshly cooked food)",
            "भोजनोपरांत जीरा व अजवाइन जल (Cumin & carom seed water after meals)",
          ];
      apathya = [
        "तले-भुने, खट्टे, चटपटे व बासी पदार्थ (Deep fried, sour, stale meals)",
        "चाय, कॉफी व कार्बोनेटेड पेय (Excessive tea, coffee & sodas)",
        "भोजन के तुरंत बाद शयन व असमय भोजन (Irregular meal times & sleeping right after meals)",
      ];
      nidanaPanchakaNotes =
        isAcidity
          ? "विदग्ध अजीर्ण एवं पित्त की उष्ण-तीक्ष्ण वृद्धि (Hyperacidic digestion with acute Pitta flare)."
          : "आमाशयगत कफ-वात संचय एवं अग्निमांद्य (Gastric sluggishness with Mandagni and Ama accumulation).";
    } else if (isRespiratory) {
      // Pranavaha Srotas / Shwasa-Kasa / Pratishyaya
      prakriti = explicitPrakriti || "KAPHA";
      prakritiLabelHi = "कफ प्रधान (Kapha Dominant)";
      prakritiLabelEn = "Kapha Dominant";

      vikriti = text.includes("dama") || text.includes("saans") || text.includes("सांस") ? "VATA_KAPHA" : "KAPHA";
      vikritiLabelHi = vikriti === "VATA_KAPHA" ? "वात-कफ प्रकोप (श्वास-कास)" : "कफ प्रकोप (प्रतिश्याय/बलगम)";
      vikritiLabelEn = vikriti === "VATA_KAPHA" ? "Vata-Kapha (Bronchial constriction & mucus)" : "Pure Kapha (Congestion)";

      agni = explicitAgni || "MANDA";
      agniLabelHi = "मंदाग्नि (कफ वृद्धि से क्षीण भूख)";
      agniLabelEn = "Mandagni (Suppressed appetite due to Kapha)";

      koshtha = "MADHYAMA";
      koshthaLabelHi = "मध्यम कोष्ठ";
      koshthaLabelEn = "Madhyama";

      sattva = "MADHYAMA";
      sattvaLabelHi = "मध्यम सत्त्व";
      sattvaLabelEn = "Madhyama";

      bala = "AVARA";
      balaLabelHi = "अवर बल (सांस फूलने से थकान)";
      balaLabelEn = "Avara (Respiratory fatigue)";

      doshicDistribution = { vata: 35, pitta: 15, kapha: 50 };

      pathya = [
        "तुलसी, कालीमिर्च, सोंठ व दालचीनी की चाय (Ayush Kwath / Herbal decoction)",
        "गुनगुना पानी व शहद (Lukewarm water with pure honey)",
        "स्टीम इनहेलेशन व अजवाइन भाप (Steam inhalation with eucalyptus/carom)",
      ];
      apathya = [
        "ठंडा पानी, आइसक्रीम, दही व केला (Cold water, yogurt, ice cream)",
        "धूल, धुआं व प्रदूषण का सीधा संपर्क (Dust, smoke & cold draft)",
        "दिन में सोना (Daytime sleeping)",
      ];
      nidanaPanchakaNotes =
        "प्राणवह स्रोतस अवरोध एवं कफ-वात अनुबंध (Obstruction of respiratory pathways with Kapha-Vata congestion).";
    } else if (isFever) {
      // Jwara (Pitta-Kapha with Ama at Amashaya level)
      prakriti = explicitPrakriti || "PITTA";
      prakritiLabelHi = "पित्त प्रधान (Pitta Dominant)";
      prakritiLabelEn = "Pitta Dominant";

      vikriti = "PITTA_KAPHA";
      vikritiLabelHi = "पित्त-कफ (साम ज्वर प्रकोप)";
      vikritiLabelEn = "Pitta-Kapha (Sama Jwara)";

      agni = explicitAgni || "MANDA";
      agniLabelHi = "मंदाग्नि (ज्वर के कारण पूर्ण अग्निमांद्य)";
      agniLabelEn = "Mandagni (Extinguished digestive fire in acute fever)";

      koshtha = "MADHYAMA";
      koshthaLabelHi = "मध्यम कोष्ठ";
      koshthaLabelEn = "Madhyama";

      sattva = "AVARA";
      sattvaLabelHi = "अवर सत्त्व (अशक्तता)";
      sattvaLabelEn = "Avara (Acute weakness)";

      bala = "AVARA";
      balaLabelHi = "अवर बल (दौर्बल्य)";
      balaLabelEn = "Avara (Bed-ridden weakness)";

      doshicDistribution = { vata: 20, pitta: 55, kapha: 25 };

      pathya = [
        "उबला हुआ सुदर्शन/गिलोय क्वाथ व षडंग पानीय (Boiled Shadanga Paniya water)",
        "पतला मूंग दाल का यूष व लाजा मण्ड (Light puffed rice gruel / Moong soup)",
        "पूर्ण शारीरिक विश्राम (Complete bed rest)",
      ];
      apathya = [
        "भारी, घी-युक्त व मांसाहारी भोजन (Heavy, oily & non-veg food)",
        "स्नान व ठंडे पानी का प्रयोग (Cold water bath)",
        "परिश्रम व मानसिक तनाव (Physical exertion & stress)",
      ];
      nidanaPanchakaNotes =
        "आमाशय समुत्थ ज्वर, स्वेद अवरोध एवं ऊष्मा का बहिर्गमन (Amashaya-origin febrile pathogenesis with impaired perspiration).";
    } else if (isHeadNeurological) {
      // Shiro-roga / Vata-Pitta / Suryavarta / Ardhavabhedaka
      prakriti = explicitPrakriti || "VATA_PITTA";
      prakritiLabelHi = "वात-पित्त (Vata-Pitta)";
      prakritiLabelEn = "Vata-Pitta";

      vikriti = "VATA_PITTA";
      vikritiLabelHi = "वात-पित्त प्रकोप (शिरःशूल)";
      vikritiLabelEn = "Vata-Pitta Dushti (Cephalalgia)";

      agni = explicitAgni || "VISHAMA";
      agniLabelHi = "विषमाग्नि (तनाव जनित अस्थिरता)";
      agniLabelEn = "Vishamagni (Stress-induced fluctuations)";

      koshtha = "KRURA";
      koshthaLabelHi = "क्रूर कोष्ठ";
      koshthaLabelEn = "Krura";

      sattva = "AVARA";
      sattvaLabelHi = "अवर सत्त्व (तीव्र सिरदर्द से क्षोभ)";
      sattvaLabelEn = "Avara (Pain-induced distress)";

      bala = "MADHYAMA";
      balaLabelHi = "मध्यम बल";
      balaLabelEn = "Madhyama";

      doshicDistribution = { vata: 50, pitta: 35, kapha: 15 };

      pathya = [
        "गाय का शुद्ध घी 2-2 बूंद नासिका में (Nasya with pure Cow Ghee)",
        "शांत व मंद प्रकाश वाले कमरे में विश्राम (Rest in dim, quiet room)",
        "शंखपुष्पी व ब्राह्मी क्वाथ (Brahmi & Shankhpushpi calming decoction)",
      ];
      apathya = [
        "तेज धूप, मोबाइल/कंप्यूटर स्क्रीन का अत्यधिक उपयोग (Bright sun & screen glare)",
        "रात्रि जागरण व मानसिक तनाव (Late nights & mental agitation)",
        "तीखे गंध व अत्यधिक शोरगुल (Pungent smells & loud noise)",
      ];
      nidanaPanchakaNotes =
        "मस्तिष्कगत वात-पित्त की गति एवं नाड़ी संकोच (Neurovascular Vata-Pitta aggravation with cranial tension).";
    } else if (isDermatology) {
      // Twak Roga / Kushtha / Rakta Dushti
      prakriti = explicitPrakriti || "PITTA_KAPHA";
      prakritiLabelHi = "पित्त-कफ (Pitta-Kapha)";
      prakritiLabelEn = "Pitta-Kapha";

      vikriti = "PITTA";
      vikritiLabelHi = "रक्त-पित्त दृष्टि (कंडू व शोथ)";
      vikritiLabelEn = "Rakta-Pitta Impairment (Pruritus & Erythema)";

      agni = explicitAgni || "MANDA";
      agniLabelHi = "मंदाग्नि (आमाशय में आम संचय)";
      agniLabelEn = "Mandagni (Systemic toxicity)";

      koshtha = "MADHYAMA";
      koshthaLabelHi = "मध्यम कोष्ठ";
      koshthaLabelEn = "Madhyama";

      sattva = "MADHYAMA";
      sattvaLabelHi = "मध्यम सत्त्व";
      sattvaLabelEn = "Madhyama";

      bala = "MADHYAMA";
      balaLabelHi = "मध्यम बल";
      balaLabelEn = "Madhyama";

      doshicDistribution = { vata: 15, pitta: 60, kapha: 25 };

      pathya = [
        "नीम, खदिर व मंजिष्ठा क्वाथ (Neem, Khadira & Manjistha blood purifiers)",
        "हल्का मूंग दाल व पुराना जौ का दलिया (Light barley & green gram porridge)",
        "सूती ढीले वस्त्र धारण करना (Loose, clean cotton clothing)",
      ];
      apathya = [
        "गुड़, खटाई, मछली व दूध-मिश्रित विरुद्ध आहार (Jaggery, sour foods, incompatible combinations)",
        "अत्यधिक साबुन व रासायनिक प्रसाधन (Harsh soaps & chemical lotions)",
        "धूप में घूमना व अत्यधिक पसीना (Sun exposure & excessive sweating)",
      ];
      nidanaPanchakaNotes =
        "रक्त धातुगत पित्त दृष्टि एवं त्वचारोग (Pitta dushti impacting Rakta & Twacha tissues).";
    } else {
      // General Clinical Mode: Balanced / Mild Vata
      prakriti = explicitPrakriti || "SAMADOSHA";
      prakritiLabelHi = "समदोष प्रकृति (संतुलित स्वभाव)";
      prakritiLabelEn = "Balanced Constitutional (Samadosha)";

      vikriti = "VATA";
      vikritiLabelHi = "सामान्य वात क्षोभ (Mild Vata Imbalance)";
      vikritiLabelEn = "Mild Vata Imbalance";

      agni = explicitAgni || "SAMA";
      agniLabelHi = "समाग्नि (संतुलित पाचन)";
      agniLabelEn = "Samagni (Balanced Digestion)";

      koshtha = "MADHYAMA";
      koshthaLabelHi = "मध्यम कोष्ठ";
      koshthaLabelEn = "Madhyama";

      sattva = "MADHYAMA";
      sattvaLabelHi = "मध्यम सत्त्व";
      sattvaLabelEn = "Madhyama";

      bala = "MADHYAMA";
      balaLabelHi = "मध्यम बल";
      balaLabelEn = "Madhyama";

      doshicDistribution = { vata: 34, pitta: 33, kapha: 33 };

      pathya = [
        "ताजा, पौष्टिक व सुपाच्य भोजन (Fresh, balanced, home-cooked food)",
        "पर्याप्त जलपान व नियमित दिनचर्या (Adequate hydration & disciplined routine)",
        "नियमित योग व प्राणायाम (Daily light yoga and Pranayama)",
      ];
      apathya = [
        "अनियमित समय पर खानपान (Irregular meal timings)",
        "अत्यधिक प्रसंस्कृत व पैकेटबंद भोजन (Processed & junk food)",
        "तनाव व देर रात तक जागना (Chronic stress & sleep deprivation)",
      ];
      nidanaPanchakaNotes =
        "सामान्य स्वास्थ्य परामर्श एवं जीवनशैली समन्वय (General health consultation & lifestyle optimization).";
    }

    return {
      prakriti,
      prakritiLabelHi,
      prakritiLabelEn,
      vikriti,
      vikritiLabelHi,
      vikritiLabelEn,
      agni,
      agniLabelHi,
      agniLabelEn,
      koshtha,
      koshthaLabelHi,
      koshthaLabelEn,
      sattva,
      sattvaLabelHi,
      sattvaLabelEn,
      bala,
      balaLabelHi,
      balaLabelEn,
      doshicDistribution,
      pathya,
      apathya,
      nidanaPanchakaNotes,
    };
  }

  /**
   * Records or updates Dashavidha Pariksha assessment for a clinical session
   */
  static async recordAssessment(dto: DashavidhaDataDTO) {
    const { sessionId, prakriti, vikriti = prakriti, agni, koshtha, sattva, bala, nidra, notes } = dto;

    const ashtavidhaData = {
      agni: agni || "VISHAMA",
      koshtha: koshtha || "MADHYAMA",
      sattva: sattva || "MADHYAMA",
      nidra: nidra || "SUKHA_NIDRA",
    };

    try {
      return await prisma.ayurvedaAssessment.upsert({
        where: { sessionId },
        create: {
          sessionId,
          prakriti: prakriti as DoshaDominance,
          vikriti: vikriti as DoshaDominance,
          anala: agni || "VISHAMA",
          sattva: sattva || "MADHYAMA",
          bala: bala || "MADHYAMA",
          aharaShakti: agni || "VISHAMA",
          vyayamaShakti: bala || "MADHYAMA",
          ashtavidhaData: ashtavidhaData as any,
          aharaVihara: { nidra } as any,
          notes: notes || "Dashavidha Pariksha completed via AyurSetu clinical engine.",
        },
        update: {
          prakriti: prakriti as DoshaDominance,
          vikriti: vikriti as DoshaDominance,
          anala: agni || "VISHAMA",
          sattva: sattva || "MADHYAMA",
          bala: bala || "MADHYAMA",
          ashtavidhaData: ashtavidhaData as any,
          notes,
        },
      });
    } catch {
      return {
        id: `ayu-${Date.now()}`,
        sessionId,
        prakriti,
        vikriti,
        anala: agni || "VISHAMA",
        sattva: sattva || "MADHYAMA",
        bala: bala || "MADHYAMA",
        ashtavidhaData,
        notes,
      };
    }
  }

  /**
   * Generates clean formatted Markdown block of Ayurvedic assessment
   */
  static generateAyushMarkdownBlock(assessment: any): string {
    return `
### 🌿 Classical Dashavidha Pariksha (Charaka Samhita Model)
- **देहा प्रकृति (Prakriti)**: ${assessment.prakriti || "Vata-Kapha"}
- **विकृति (Vikriti - Dosha Dushti)**: ${assessment.vikriti || "Vata-Pitta"}
- **अग्नि (Agni / Metabolic State)**: ${assessment.anala || "Vishamagni (Irregular)"}
- **कोष्ठ (Koshtha / Bowel Function)**: ${assessment.ashtavidhaData?.koshtha || "Madhyama"}
- **सत्त्व (Sattva / Mental Resilience)**: ${assessment.sattva || "Madhyama (Moderate)"}
- **व्यायाम व बल (Bala & Endurance)**: ${assessment.bala || "Madhyama"}
- **आहार-विहार व निद्रा (Diet & Sleep)**: ${assessment.aharaVihara?.nidra || "Sound Sleep"}
    `.trim();
  }
}
