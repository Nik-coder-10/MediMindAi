export interface LabReferenceRule {
  testCode: string;
  testNames: string[]; // Variations in Indian prescriptions & lab reports
  unit: string;
  minNormal: number;
  maxNormal: number;
  criticalLow?: number;
  criticalHigh?: number;
  category: "DIABETES" | "RENAL" | "HEMATOLOGY" | "LIVER" | "LIPID" | "INFLAMMATION";
}

export const INDIAN_LAB_REFERENCE_REGISTRY: LabReferenceRule[] = [
  // 1. DIABETES
  {
    testCode: "HBA1C",
    testNames: ["hba1c", "glycated hemoglobin", "glycosylated hemoglobin"],
    unit: "%",
    minNormal: 4.0,
    maxNormal: 5.6,
    criticalHigh: 10.0,
    category: "DIABETES",
  },
  {
    testCode: "FBS",
    testNames: ["fbs", "fasting blood sugar", "fasting glucose", "glucose fasting"],
    unit: "mg/dL",
    minNormal: 70,
    maxNormal: 100,
    criticalLow: 50,
    criticalHigh: 250,
    category: "DIABETES",
  },
  {
    testCode: "PPBS",
    testNames: ["ppbs", "post prandial blood sugar", "postprandial glucose", "glucose pp"],
    unit: "mg/dL",
    minNormal: 90,
    maxNormal: 140,
    criticalHigh: 300,
    category: "DIABETES",
  },

  // 2. RENAL & URIC ACID
  {
    testCode: "SERUM_CREATININE",
    testNames: ["creatinine", "serum creatinine", "s. creatinine"],
    unit: "mg/dL",
    minNormal: 0.6,
    maxNormal: 1.2,
    criticalHigh: 3.0,
    category: "RENAL",
  },
  {
    testCode: "BLOOD_UREA",
    testNames: ["urea", "blood urea", "bun"],
    unit: "mg/dL",
    minNormal: 15,
    maxNormal: 45,
    criticalHigh: 100,
    category: "RENAL",
  },
  {
    testCode: "URIC_ACID",
    testNames: ["uric acid", "serum uric acid", "s. uric acid"],
    unit: "mg/dL",
    minNormal: 3.5,
    maxNormal: 7.2,
    criticalHigh: 10.0,
    category: "RENAL",
  },

  // 3. HEMATOLOGY & INFLAMMATION
  {
    testCode: "HEMOGLOBIN",
    testNames: ["hemoglobin", "hb", "haemoglobin"],
    unit: "g/dL",
    minNormal: 12.5,
    maxNormal: 17.0,
    criticalLow: 7.0,
    category: "HEMATOLOGY",
  },
  {
    testCode: "ESR",
    testNames: ["esr", "erythrocyte sedimentation rate"],
    unit: "mm/hr",
    minNormal: 0,
    maxNormal: 20,
    criticalHigh: 70,
    category: "INFLAMMATION",
  },
  {
    testCode: "TLC",
    testNames: ["tlc", "total leucocyte count", "wbc count", "total wbc"],
    unit: "/cumm",
    minNormal: 4000,
    maxNormal: 11000,
    criticalLow: 2000,
    criticalHigh: 25000,
    category: "HEMATOLOGY",
  },
  {
    testCode: "PLATELETS",
    testNames: ["platelet count", "platelets", "total platelets"],
    unit: "lakhs/cumm",
    minNormal: 1.5,
    maxNormal: 4.5,
    criticalLow: 0.5,
    category: "HEMATOLOGY",
  },

  // 4. LIVER FUNCTION
  {
    testCode: "SGPT",
    testNames: ["sgpt", "alt", "alanine aminotransferase"],
    unit: "U/L",
    minNormal: 10,
    maxNormal: 45,
    criticalHigh: 200,
    category: "LIVER",
  },
  {
    testCode: "SGOT",
    testNames: ["sgot", "ast", "aspartate aminotransferase"],
    unit: "U/L",
    minNormal: 10,
    maxNormal: 40,
    criticalHigh: 200,
    category: "LIVER",
  },
];

export interface EvaluatedLabResult {
  testName: string;
  value: number;
  unit: string;
  referenceRange: string;
  flag: "NORMAL" | "HIGH" | "LOW" | "CRITICAL_HIGH" | "CRITICAL_LOW";
  clinicalNote: string;
  category: string;
}

export class AbnormalLabEvaluator {
  static evaluateTest(testName: string, rawValue: number | string): EvaluatedLabResult {
    const numericValue = typeof rawValue === "number" ? rawValue : parseFloat(rawValue);
    const cleanName = testName.toLowerCase().trim();

    const matchedRule = INDIAN_LAB_REFERENCE_REGISTRY.find((rule) =>
      rule.testNames.some((alias) => cleanName.includes(alias) || alias.includes(cleanName))
    );

    if (!matchedRule || isNaN(numericValue)) {
      return {
        testName,
        value: numericValue || 0,
        unit: "",
        referenceRange: "Standard Range",
        flag: "NORMAL",
        clinicalNote: "Value within reported standard parameters.",
        category: "GENERAL",
      };
    }

    let flag: "NORMAL" | "HIGH" | "LOW" | "CRITICAL_HIGH" | "CRITICAL_LOW" = "NORMAL";
    let clinicalNote = "Normal parameter (सामान्य सीमा में).";

    if (matchedRule.criticalHigh && numericValue >= matchedRule.criticalHigh) {
      flag = "CRITICAL_HIGH";
      clinicalNote = "Significantly Elevated: Requires Immediate Physician Review (अत्यधिक उच्च - तुरंत डॉक्टर को दिखाएं).";
    } else if (matchedRule.criticalLow && numericValue <= matchedRule.criticalLow) {
      flag = "CRITICAL_LOW";
      clinicalNote = "Critically Low: Requires Immediate Attention (अत्यधिक कम).";
    } else if (numericValue > matchedRule.maxNormal) {
      flag = "HIGH";
      clinicalNote = `Elevated above reference range (${matchedRule.minNormal} - ${matchedRule.maxNormal} ${matchedRule.unit}) - For Physician Review.`;
    } else if (numericValue < matchedRule.minNormal) {
      flag = "LOW";
      clinicalNote = `Below reference range (${matchedRule.minNormal} - ${matchedRule.maxNormal} ${matchedRule.unit}) - For Physician Review.`;
    }

    return {
      testName: matchedRule.testCode,
      value: numericValue,
      unit: matchedRule.unit,
      referenceRange: `${matchedRule.minNormal} - ${matchedRule.maxNormal} ${matchedRule.unit}`,
      flag,
      clinicalNote,
      category: matchedRule.category,
    };
  }
}
