import { prisma } from "@/lib/db/prisma";

export type InteractionSeverity = "CRITICAL" | "MAJOR" | "MODERATE" | "MINOR";
export type AlertCategory = "DRUG_ALLERGY" | "DRUG_DRUG" | "HERB_DRUG" | "CONTRAINDICATION";

export interface DrugInteractionRule {
  id: string;
  drugA: string[]; // Generic / brand aliases (lowercase)
  drugB: string[]; // Generic / brand aliases (lowercase)
  severity: InteractionSeverity;
  category: AlertCategory;
  titleEn: string;
  titleHi: string;
  clinicalMechanism: string;
  physicianAdvisory: string;
  recommendedAction: string;
}

export interface DrugAllergyRule {
  id: string;
  allergenKeywords: string[]; // e.g. ["penicillin", "amoxicillin", "sulfa", "aspirin", "nsaid"]
  contraindicatedDrugs: string[]; // drugs triggering this allergy
  severity: InteractionSeverity;
  titleEn: string;
  titleHi: string;
  clinicalMechanism: string;
  physicianAdvisory: string;
}

export interface DrugSafetyAlert {
  id: string;
  ruleId: string;
  category: AlertCategory;
  severity: InteractionSeverity;
  title: string;
  titleHindi: string;
  involvedSubstances: string[];
  clinicalMechanism: string;
  physicianAdvisory: string;
  recommendedAction: string;
  isDismissed?: boolean;
  dismissalReason?: string | null;
  reviewedByDoctorId?: string | null;
  reviewedAt?: string | null;
}

/**
 * CURATED CLINICAL INTERACTION & ALLERGY REGISTRY
 * -----------------------------------------------
 * Covers common Indian OPD Allopathic and Ayurvedic medications.
 * Structured with extensible interface for external API (OpenFDA, DrugBank) swap.
 */
export const DRUG_INTERACTION_RULES: DrugInteractionRule[] = [
  // 1. Warfarin / Anticoagulants + NSAIDs
  {
    id: "DDI-001",
    drugA: ["warfarin", "acenocoumarol", "coumadin", "heparin", "dabigatran", "rivaroxaban", "apixaban"],
    drugB: ["aspirin", "ibuprofen", "diclofenac", "naproxen", "aceclofenac", "mefenamic acid", "piroxicam", "combiflam", "voveran"],
    severity: "CRITICAL",
    category: "DRUG_DRUG",
    titleEn: "High Risk of Severe Gastrointestinal & Systemic Bleeding",
    titleHi: "गंभीर आंतरिक रक्तस्राव (Bleeding) का उच्च जोखिम",
    clinicalMechanism: "Co-administration of NSAIDs with oral anticoagulants impairs platelet aggregation and damages gastric mucosa, dramatically escalating bleeding risk.",
    physicianAdvisory: "Concomitant use is strongly discouraged. If analgesia is mandatory, consider Paracetamol with gastroprotection or adjust anticoagulant monitoring (INR).",
    recommendedAction: "Review analgesic prescription; switch to Paracetamol or monitor PT/INR closely.",
  },

  // 2. ACE Inhibitors / ARBs + Potassium Supplements or Potassium-sparing Diuretics
  {
    id: "DDI-002",
    drugA: ["enalapril", "ramipril", "lisinopril", "telmisartan", "losartan", "olmesartan", "valsartan"],
    drugB: ["spironolactone", "aldactone", "eplerenone", "potassium chloride", "potklor", "k-bind"],
    severity: "MAJOR",
    category: "DRUG_DRUG",
    titleEn: "Potential Life-Threatening Hyperkalemia",
    titleHi: "घातक हाइपरकेलेमिया (पोटेशियम वृद्धि) का जोखिम",
    clinicalMechanism: "Both ACE inhibitors/ARBs and potassium-sparing agents reduce renal potassium excretion, risking cardiac arrhythmias.",
    physicianAdvisory: "Monitor serum electrolytes (potassium and creatinine) within 1-2 weeks of concurrent therapy.",
    recommendedAction: "Check Serum Electrolytes; adjust potassium dosage or monitor ECG.",
  },

  // 3. Metformin + Iodinated Radiocontrast / Severe Renal Impairment
  {
    id: "DDI-003",
    drugA: ["metformin", "glycomet", "gluformin", "cetapin"],
    drugB: ["iodinated contrast", "contrast media", "radiopaque contrast", "iohexol", "iopamidol"],
    severity: "MAJOR",
    category: "DRUG_DRUG",
    titleEn: "Risk of Contrast-Induced Lactic Acidosis",
    titleHi: "लैक्टिक एसिडोसिस (Lactic Acidosis) का संभावित जोखिम",
    clinicalMechanism: "Intravascular administration of iodinated contrast media in patients taking metformin may lead to acute renal failure and accumulation of metformin.",
    physicianAdvisory: "Withhold metformin prior to or at the time of contrast study, and resume only after 48 hours post-procedure following normal renal function re-evaluation.",
    recommendedAction: "Hold Metformin 48 hours prior to contrast imaging; verify eGFR/Creatinine.",
  },

  // 4. Clopidogrel + Omeprazole (CYP2C19 Inhibition)
  {
    id: "DDI-004",
    drugA: ["clopidogrel", "plavix", "clopilet", "deplatt"],
    drugB: ["omeprazole", "esomeprazole", "omez", "nexpro"],
    severity: "MODERATE",
    category: "DRUG_DRUG",
    titleEn: "Reduced Antiplatelet Efficacy of Clopidogrel",
    titleHi: "क्लोपिडोग्रेल की प्रभावशीलता में कमी (CYP2C19 Interaction)",
    clinicalMechanism: "Omeprazole competitively inhibits CYP2C19, significantly diminishing active metabolite formation of clopidogrel and increasing cardiovascular event risk.",
    physicianAdvisory: "Switch to Pantoprazole or Rabeprazole, which exhibit significantly less CYP2C19 inhibition.",
    recommendedAction: "Switch Omeprazole to Pantoprazole 40mg or Rabeprazole 20mg.",
  },

  // 5. Methotrexate + NSAIDs
  {
    id: "DDI-005",
    drugA: ["methotrexate", "folitrax", "mexate"],
    drugB: ["aspirin", "ibuprofen", "diclofenac", "naproxen", "aceclofenac", "combiflam", "voveran"],
    severity: "MAJOR",
    category: "DRUG_DRUG",
    titleEn: "Increased Methotrexate Toxicity (Bone Marrow Suppression)",
    titleHi: "मेथोट्रेक्सेट विषाक्तता (Methotrexate Toxicity) का खतरा",
    clinicalMechanism: "NSAIDs reduce renal tubular excretion of methotrexate, increasing serum levels and bone marrow/hepatic toxicity.",
    physicianAdvisory: "Avoid concurrent high-dose NSAIDs. Monitor Complete Blood Count (CBC) and LFT regularly.",
    recommendedAction: "Avoid NSAIDs; monitor CBC, platelets, and LFT.",
  },

  // 6. Allopathic Antidiabetics + Ayurvedic Guggulu / Gymnema (Gurmar) - Additive Hypoglycemia
  {
    id: "DDI-006",
    drugA: ["glimepiride", "gliclazide", "glibenclamide", "metformin", "insulin", "vildagliptin", "sitagliptin"],
    drugB: ["yogaraj guggulu", "kaishore guggulu", "gurmar", "gymnema", "madhumehari", "vijaysar", "jambu", "meshashringi", "chandraprabha vati"],
    severity: "MODERATE",
    category: "HERB_DRUG",
    titleEn: "Herb-Drug Additive Hypoglycemic Synergy",
    titleHi: "दवा व आयुर्वेदिक औषधि संयोजन से हाइपोग्लाइसीमिया (निम्न शर्करा) जोखिम",
    clinicalMechanism: "Ayurvedic anti-glycemic herbs enhance peripheral glucose uptake and insulin sensitivity, synergizing with allopathic agents and occasionally precipitating hypoglycemia.",
    physicianAdvisory: "Advise patient regarding regular blood glucose self-monitoring (SMBG) and early signs of hypoglycemia (sweating, tremors, dizziness).",
    recommendedAction: "Monitor Fasting & Post-prandial blood glucose; adjust allopathic dosage if needed.",
  },

  // 7. Statins + Macrolide Antibiotics (Azithromycin / Clarithromycin) / Ayurvedic Shilajit
  {
    id: "DDI-007",
    drugA: ["atorvastatin", "rosuvastatin", "simvastatin", "atorva", "rosuvas"],
    drugB: ["clarithromycin", "erythromycin", "azithromycin", "ketoconazole", "itraconazole"],
    severity: "MODERATE",
    category: "DRUG_DRUG",
    titleEn: "Risk of Increased Statin Exposure & Myopathy / Rhabdomyolysis",
    titleHi: "मायोपैथी व मांसपेशियों में दर्द का जोखिम (Myopathy Risk)",
    clinicalMechanism: "Strong CYP3A4 inhibitors increase plasma concentrations of statins, elevating the risk of skeletal muscle toxicity.",
    physicianAdvisory: "Temporarily withhold statin during short courses of macrolides or monitor for unexplained muscle pain/weakness and CPK levels.",
    recommendedAction: "Assess for muscle pain/dark urine; consider pausing statin during antimicrobial course.",
  },

  // 8. Digoxin + Ayurvedic Arjuna / Heart Formulations or Diuretics (Hypokalemia-induced Digoxin Toxicity)
  {
    id: "DDI-008",
    drugA: ["digoxin", "lanoxin"],
    drugB: ["furosemide", "lasix", "torsemide", "hydrochlorothiazide", "arjunarishta", "arjuna kashaya"],
    severity: "MAJOR",
    category: "HERB_DRUG",
    titleEn: "Electrolyte-Mediated Digoxin Arrhythmogenic Risk",
    titleHi: "डिगॉक्सिन विषाक्तता व अतालता (Arrhythmia) का खतरा",
    clinicalMechanism: "Loop and thiazide diuretics cause hypokalemia, sensitizing the myocardium to digoxin toxicity.",
    physicianAdvisory: "Check serum potassium and digoxin levels. Maintain potassium levels in high-normal range (> 4.0 mEq/L).",
    recommendedAction: "Check Serum Potassium & Digoxin level; obtain baseline ECG.",
  },
];

export const DRUG_ALLERGY_RULES: DrugAllergyRule[] = [
  // 1. Penicillin / Beta-lactam Allergy
  {
    id: "ALG-001",
    allergenKeywords: ["penicillin", "amoxicillin", "ampicillin", "augmentin", "moxikind", "beta-lactam", "पेनिसिलिन", "एमोक्सिसिलिन"],
    contraindicatedDrugs: ["amoxicillin", "ampicillin", "augmentin", "moxikind", "cloxacillin", "piperacillin", "penicillin v", "amoxyclav"],
    severity: "CRITICAL",
    titleEn: "Severe Beta-Lactam Cross-Reactivity Alert (Anaphylaxis Risk)",
    titleHi: "गंभीर पेनिसिलिन एलर्जी चेतावनी (एनाफिलेक्सिस जोखिम)",
    clinicalMechanism: "Patient has documented Penicillin / Beta-lactam allergy history. Re-exposure can precipitate Type I IgE-mediated anaphylaxis, bronchospasm, or severe angioedema.",
    physicianAdvisory: "Absolute contraindication unless formally desensitized under ICU supervision. Switch to alternative class (e.g. Macrolides, Fluoroquinolones, or Doxycycline).",
  },

  // 2. NSAID / Aspirin Exacerbated Respiratory Disease (AERD / Triad Asthma)
  {
    id: "ALG-002",
    allergenKeywords: ["aspirin", "nsaid", "ibuprofen", "diclofenac", "combiflam", "voveran", "दर्द निवारक", "एस्पिरिन"],
    contraindicatedDrugs: ["aspirin", "ibuprofen", "diclofenac", "naproxen", "aceclofenac", "mefenamic acid", "piroxicam", "combiflam", "voveran", "ketorolac"],
    severity: "CRITICAL",
    titleEn: "NSAID-Induced Bronchospasm & Urticaria Contraindication",
    titleHi: "दर्द निवारक (NSAID) एलर्जी चेतावनी",
    clinicalMechanism: "Inhibition of COX-1 shunts arachidonic acid metabolism into the 5-lipoxygenase pathway, driving severe leukotriene-mediated bronchoconstriction or urticaria.",
    physicianAdvisory: "Avoid non-selective NSAIDs. Prefer Paracetamol (at doses <= 1000mg) or selective COX-2 inhibitors with caution if permissible.",
  },

  // 3. Sulfonamide / Sulfa Allergy
  {
    id: "ALG-003",
    allergenKeywords: ["sulfa", "sulfonamide", "septran", "bactrim", "सल्फा"],
    contraindicatedDrugs: ["sulfamethoxazole", "septran", "bactrim", "cotrimoxazole", "sulfasalazine", "dapsone"],
    severity: "MAJOR",
    titleEn: "Sulfonamide Hypersensitivity Conflict",
    titleHi: "सल्फोनामाइड (Sulfa) एलर्जी संघर्ष",
    clinicalMechanism: "Cross-reactivity with arylamine sulfonamides may cause severe cutaneous adverse reactions (SCAR / Stevens-Johnson Syndrome).",
    physicianAdvisory: "Avoid sulfonamide antibiotics and related compounds.",
  },
];

export class DrugSafetyService {
  /**
   * Helper to normalize drug and allergy strings for comparison
   */
  private static normalizeTerm(term: string): string {
    return term
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Evaluates safety matrix for a list of medications against known allergies and co-prescriptions.
   * Pure clinical calculation method (provider-agnostic).
   */
  static evaluateSafety({
    medications,
    allergies = [],
    ayurvedicFormulations = [],
  }: {
    medications: string[];
    allergies?: string[];
    ayurvedicFormulations?: string[];
  }): DrugSafetyAlert[] {
    const alerts: DrugSafetyAlert[] = [];
    const allMeds = [...medications, ...ayurvedicFormulations].map((m) => this.normalizeTerm(m));
    const cleanAllergies = allergies.map((a) => this.normalizeTerm(a));

    // 1. DRUG-ALLERGY CHECK
    for (const allergyText of cleanAllergies) {
      if (!allergyText || allergyText.includes("nkda") || allergyText.includes("no known")) continue;

      for (const rule of DRUG_ALLERGY_RULES) {
        const matchesAllergen = rule.allergenKeywords.some((kw) => allergyText.includes(kw));
        if (matchesAllergen) {
          for (const med of allMeds) {
            const isContraindicated = rule.contraindicatedDrugs.some((cd) => med.includes(cd));
            if (isContraindicated) {
              alerts.push({
                id: `ALERT-ALG-${rule.id}-${Date.now().toString(36).slice(-4)}`,
                ruleId: rule.id,
                category: "DRUG_ALLERGY",
                severity: rule.severity,
                title: rule.titleEn,
                titleHindi: rule.titleHi,
                involvedSubstances: [med, allergyText],
                clinicalMechanism: rule.clinicalMechanism,
                physicianAdvisory: rule.physicianAdvisory,
                recommendedAction: `Avoid ${med}; patient reported allergy to '${allergyText}'.`,
              });
            }
          }
        }
      }
    }

    // 2. DRUG-DRUG & HERB-DRUG INTERACTION CHECK
    for (let i = 0; i < allMeds.length; i++) {
      for (let j = i + 1; j < allMeds.length; j++) {
        const medA = allMeds[i];
        const medB = allMeds[j];

        for (const rule of DRUG_INTERACTION_RULES) {
          const matchAInRuleA = rule.drugA.some((d) => medA.includes(d));
          const matchBInRuleB = rule.drugB.some((d) => medB.includes(d));

          const matchBInRuleA = rule.drugA.some((d) => medB.includes(d));
          const matchAInRuleB = rule.drugB.some((d) => medA.includes(d));

          if ((matchAInRuleA && matchBInRuleB) || (matchBInRuleA && matchAInRuleB)) {
            // Deduplicate if already added
            const exists = alerts.some((a) => a.ruleId === rule.id && a.involvedSubstances.includes(medA) && a.involvedSubstances.includes(medB));
            if (!exists) {
              alerts.push({
                id: `ALERT-DDI-${rule.id}-${Date.now().toString(36).slice(-4)}`,
                ruleId: rule.id,
                category: rule.category,
                severity: rule.severity,
                title: rule.titleEn,
                titleHindi: rule.titleHi,
                involvedSubstances: [medA, medB],
                clinicalMechanism: rule.clinicalMechanism,
                physicianAdvisory: rule.physicianAdvisory,
                recommendedAction: rule.recommendedAction,
              });
            }
          }
        }
      }
    }

    return alerts;
  }

  /**
   * Authoritative method to evaluate medication safety for a given clinical session ID from PostgreSQL.
   */
  static async evaluateSessionSafety(sessionId: string): Promise<DrugSafetyAlert[]> {
    try {
      const session = await prisma.clinicalSession.findUnique({
        where: { id: sessionId },
        include: {
          medicalDocuments: {
            include: {
              extractedEntities: true,
            },
          },
          patient: true,
          ayurvedaAssessment: true,
        },
      });

      if (!session) return [];

      const medications: string[] = [];
      const allergies: string[] = [];
      const ayurvedicMeds: string[] = [];

      // Extract entities from documents
      session.medicalDocuments.forEach((doc) => {
        doc.extractedEntities.forEach((ent) => {
          if (ent.type === "MEDICATION") {
            const medName = ent.structuredData && (ent.structuredData as any).normalisedName
              ? (ent.structuredData as any).normalisedName
              : ent.rawText;
            medications.push(medName);
          }
          if (ent.type === "ALLERGY") {
            allergies.push(ent.rawText);
          }
        });
      });

      // Extract patient baseline medical history allergies if present
      if (session.patient?.medicalHistory && (session.patient.medicalHistory as any).allergies) {
        const histAllergies = (session.patient.medicalHistory as any).allergies;
        if (Array.isArray(histAllergies)) {
          allergies.push(...histAllergies);
        } else if (typeof histAllergies === "string") {
          allergies.push(histAllergies);
        }
      }

      return this.evaluateSafety({
        medications,
        allergies,
        ayurvedicFormulations: ayurvedicMeds,
      });
    } catch (e) {
      console.warn(`[DrugSafetyService] Session safety evaluation fallback: ${(e as Error).message}`);
      return [];
    }
  }
}
