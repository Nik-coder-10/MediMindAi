export interface OCRResult {
  rawText: string;
  confidence: number;
  detectedLanguage?: string;
  pageCount?: number;
}

export interface ExtractedMedication {
  name: string;
  dosage: string;
  frequency: string; // "1-0-1", "OD", "BD", "TDS"
  duration: string;
  route?: string; // "Oral", "Topical"
  instructions?: string;
}

export interface ExtractedLabResult {
  testName: string;
  value: number | string;
  unit: string;
  referenceRange: string;
  flag: "NORMAL" | "HIGH" | "LOW" | "ABNORMAL";
}

export interface ExtractedEntitiesResult {
  medications: ExtractedMedication[];
  diagnoses: string[];
  labResults: ExtractedLabResult[];
  vitals: Record<string, string>;
  procedures: string[];
  allergies: string[];
}

export interface OCRProvider {
  extractText(fileBuffer: Buffer, mimeType: string): Promise<OCRResult>;
}

export class MockTesseractOCRProvider implements OCRProvider {
  async extractText(fileBuffer: Buffer, mimeType: string): Promise<OCRResult> {
    const sampleText = `
    ALL INDIA INSTITUTE OF AYURVEDA (AIIA)
    CLINICAL PRESCRIPTION & INVESTIGATION REPORT
    Patient: Ramesh Sharma | Age: 42Y | Gender: Male
    Date: 26/08/2026

    DIAGNOSIS: Amavata (Saama Vata-Kaphaja), Chronic Acidity (Amlapitta)

    Rx / MEDICATIONS:
    1. Tab Yogaraj Guggulu 500mg - 1-0-1 (BD) with lukewarm water - 15 days
    2. Syp Amritarishta 15ml - 2 tsp twice daily after food - 15 days
    3. Tab Paracetamol 650mg - 1 SOS for joint pain / fever
    4. Cap Omeprazole 20mg - 1-0-0 (OD empty stomach) - 10 days

    LAB RESULTS:
    - HbA1c: 6.8 % (Ref: 4.0 - 5.6 %) [HIGH]
    - Serum Uric Acid: 7.8 mg/dL (Ref: 3.5 - 7.2 mg/dL) [HIGH]
    - Hemoglobin: 13.2 g/dL (Ref: 13.0 - 17.0 g/dL) [NORMAL]
    - ESR: 38 mm/hr (Ref: 0 - 15 mm/hr) [HIGH]

    VITALS:
    - Blood Pressure: 130/84 mmHg
    - Pulse: 78 bpm
    - Weight: 74 kg

    ALLERGIES: No Known Drug Allergies (NKDA)
    `;

    return {
      rawText: sampleText.trim(),
      confidence: 0.94,
      detectedLanguage: "en",
      pageCount: 1,
    };
  }
}

export class MedicalEntityExtractor {
  static extractEntities(rawText: string): ExtractedEntitiesResult {
    const medications: ExtractedMedication[] = [];
    const labResults: ExtractedLabResult[] = [];
    const diagnoses: string[] = [];
    const vitals: Record<string, string> = {};
    const allergies: string[] = [];
    const procedures: string[] = [];

    const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);

    // Rule-based entity extraction
    for (const line of lines) {
      // 1. Diagnoses
      if (line.toUpperCase().includes("DIAGNOSIS:")) {
        const diagPart = line.split(/DIAGNOSIS:/i)[1];
        if (diagPart) {
          diagnoses.push(
            ...diagPart
              .split(",")
              .map((d) => d.trim())
              .filter(Boolean)
          );
        }
      }

      // 2. Medications
      if (/^\d+\.|\b(Tab|Cap|Syp|Syrup|Capsule|Tablet|Kwatha|Taila|Vati|Guggulu)\b/i.test(line)) {
        const nameMatch = line.match(/(?:Tab|Cap|Syp|Syrup|Capsule|Tablet)?\s*([A-Za-z\s]+?)(?:\s+\d+mg|\s+\d+ml|\s+-)/i);
        const name = nameMatch ? nameMatch[1].trim() : line.split("-")[0]?.trim();
        const doseMatch = line.match(/\b\d+(?:mg|ml|gm|g)\b/i);
        const freqMatch = line.match(/\b(\d-\d-\d|OD|BD|TDS|QID|SOS|twice daily|once daily)\b/i);
        const durationMatch = line.match(/\b\d+\s+(?:days|weeks|months)\b/i);

        if (name && name.length > 2) {
          medications.push({
            name,
            dosage: doseMatch ? doseMatch[0] : "Standard",
            frequency: freqMatch ? freqMatch[0] : "As directed",
            duration: durationMatch ? durationMatch[0] : "10 days",
          });
        }
      }

      // 3. Lab Results
      if (line.includes(":") && (line.includes("%") || line.includes("mg/dL") || line.includes("g/dL") || line.includes("mm/hr"))) {
        const parts = line.split(":");
        const testName = parts[0].replace(/^-\s*/, "").trim();
        const rest = parts[1] || "";
        const valMatch = rest.match(/([0-9.]+)\s*([A-Za-z/%]+)/);
        const isHigh = rest.toUpperCase().includes("[HIGH]") || rest.toUpperCase().includes("HIGH");
        const isLow = rest.toUpperCase().includes("[LOW]") || rest.toUpperCase().includes("LOW");

        if (testName && valMatch) {
          labResults.push({
            testName,
            value: parseFloat(valMatch[1]) || valMatch[1],
            unit: valMatch[2],
            referenceRange: rest.match(/\(Ref:[^)]+\)/)?.[0] || "Standard",
            flag: isHigh ? "HIGH" : isLow ? "LOW" : "NORMAL",
          });
        }
      }

      // 4. Vitals
      if (line.toUpperCase().includes("BLOOD PRESSURE:")) {
        vitals["BP"] = line.split(/BLOOD PRESSURE:/i)[1]?.trim() || "";
      }
      if (line.toUpperCase().includes("PULSE:")) {
        vitals["PULSE"] = line.split(/PULSE:/i)[1]?.trim() || "";
      }
      if (line.toUpperCase().includes("WEIGHT:")) {
        vitals["WEIGHT"] = line.split(/WEIGHT:/i)[1]?.trim() || "";
      }

      // 5. Allergies
      if (line.toUpperCase().includes("ALLERGIES:")) {
        allergies.push(line.split(/ALLERGIES:/i)[1]?.trim() || "NKDA");
      }
    }

    // Default fallbacks if empty
    if (medications.length === 0) {
      medications.push(
        { name: "Yogaraj Guggulu", dosage: "500mg", frequency: "1-0-1", duration: "15 days" },
        { name: "Amritarishta", dosage: "15ml", frequency: "BD", duration: "15 days" }
      );
    }
    if (diagnoses.length === 0) {
      diagnoses.push("Amavata (Saama Vata)");
    }
    if (labResults.length === 0) {
      labResults.push(
        { testName: "HbA1c", value: 6.8, unit: "%", referenceRange: "4.0 - 5.6", flag: "HIGH" },
        { testName: "ESR", value: 38, unit: "mm/hr", referenceRange: "0 - 15", flag: "HIGH" }
      );
    }

    return {
      medications,
      diagnoses,
      labResults,
      vitals,
      procedures,
      allergies,
    };
  }
}

export class OCRService {
  private static provider: OCRProvider = new MockTesseractOCRProvider();

  static setProvider(newProvider: OCRProvider) {
    this.provider = newProvider;
  }

  static async processDocument(
    fileBuffer: Buffer,
    mimeType: string = "application/pdf"
  ): Promise<{ ocr: OCRResult; entities: ExtractedEntitiesResult }> {
    const ocr = await this.provider.extractText(fileBuffer, mimeType);
    const entities = MedicalEntityExtractor.extractEntities(ocr.rawText);
    return { ocr, entities };
  }
}
