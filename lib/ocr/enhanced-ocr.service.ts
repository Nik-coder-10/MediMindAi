export type DocumentClass = "PRESCRIPTION" | "LAB_REPORT" | "DISCHARGE_SUMMARY" | "OTHER";

export interface StructuredLabRow {
  testName: string;
  observedValue: string;
  unit: string;
  referenceRange: string;
  flag?: "HIGH" | "LOW" | "NORMAL" | "CRITICAL";
  confidence: number;
}

export interface EnhancedExtractionResult {
  documentClass: DocumentClass;
  documentConfidence: number;
  medications: Array<{
    name: string;
    dosage?: string;
    frequency?: string;
    instructions?: string;
    confidence: number;
    needsReview: boolean;
  }>;
  labRows: StructuredLabRow[];
  vitals: Array<{ name: string; value: string; unit: string }>;
  unclearText: string[];
}

export class EnhancedOcrService {
  /**
   * Auto-classifies document type based on structural and clinical keywords.
   */
  static classifyDocument(text: string): { classification: DocumentClass; confidence: number } {
    const lower = text.toLowerCase();

    if (lower.includes("rx") || lower.includes("tablet") || lower.includes("syrup") || lower.includes("guggulu") || lower.includes("mg bd")) {
      return { classification: "PRESCRIPTION", confidence: 0.95 };
    }
    if (lower.includes("reference range") || lower.includes("biological interval") || lower.includes("hba1c") || lower.includes("creatinine") || lower.includes("investigation report")) {
      return { classification: "LAB_REPORT", confidence: 0.97 };
    }
    if (lower.includes("discharge") || lower.includes("date of admission") || lower.includes("course in hospital")) {
      return { classification: "DISCHARGE_SUMMARY", confidence: 0.92 };
    }
    return { classification: "OTHER", confidence: 0.70 };
  }

  /**
   * Processes raw text with classification, tabular lab extraction, and confidence scoring.
   */
  static processDocumentText(rawText: string): EnhancedExtractionResult {
    const { classification, confidence: docConf } = this.classifyDocument(rawText);
    const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);

    const medications: EnhancedExtractionResult["medications"] = [];
    const labRows: StructuredLabRow[] = [];
    const vitals: EnhancedExtractionResult["vitals"] = [];
    const unclearText: string[] = [];

    for (const line of lines) {
      const lower = line.toLowerCase();

      // Tabular Lab Extraction
      if (lower.includes("hba1c") || lower.includes("glucose") || lower.includes("creatinine") || lower.includes("hemoglobin")) {
        const parts = line.split(/[:|\t,]+/).map((p) => p.trim());
        const testName = parts[0] || "Blood Investigation";
        const valPart = parts[1] || "";
        const valMatch = valPart.match(/(\d+\.?\d*)\s*([a-zA-Z%/\^]*)/);

        const observedValue = valMatch ? valMatch[1] : valPart;
        const unit = valMatch && valMatch[2] ? valMatch[2] : "%";

        const numVal = parseFloat(observedValue);
        let flag: StructuredLabRow["flag"] = "NORMAL";
        if (testName.toLowerCase().includes("hba1c") && numVal > 6.5) flag = "HIGH";
        if (testName.toLowerCase().includes("creatinine") && numVal > 1.3) flag = "HIGH";

        labRows.push({
          testName,
          observedValue,
          unit,
          referenceRange: testName.toLowerCase().includes("hba1c") ? "4.0 - 5.6" : "0.7 - 1.3",
          flag,
          confidence: 0.96,
        });
        continue;
      }

      // Medication Extraction
      if (lower.includes("tab") || lower.includes("syp") || lower.includes("cap") || lower.includes("vati") || lower.includes("guggulu") || lower.includes("arighta") || lower.includes("metformin")) {
        const isHandwrittenLowClarity = line.length < 8 || line.includes("?");
        medications.push({
          name: line.replace(/^(tab|syp|cap|vati)\.?\s+/i, ""),
          dosage: lower.includes("500mg") ? "500mg" : lower.includes("2 bd") ? "2 tabs" : "1 tab",
          frequency: lower.includes("bd") ? "Twice daily" : lower.includes("od") ? "Once daily" : "As directed",
          confidence: isHandwrittenLowClarity ? 0.72 : 0.94,
          needsReview: isHandwrittenLowClarity,
        });
        continue;
      }

      // Vitals Extraction
      if (lower.includes("bp") || lower.includes("pulse") || lower.includes("spo2")) {
        const val = line.replace(/^[a-zA-Z0-9\s:]+/, "").trim();
        vitals.push({
          name: lower.includes("bp") ? "Blood Pressure" : lower.includes("spo2") ? "Oxygen Saturation" : "Pulse",
          value: val || line,
          unit: lower.includes("bp") ? "mmHg" : lower.includes("spo2") ? "%" : "bpm",
        });
        continue;
      }

      if (line.length > 20) {
        unclearText.push(line);
      }
    }

    return {
      documentClass: classification,
      documentConfidence: docConf,
      medications,
      labRows,
      vitals,
      unclearText,
    };
  }
}
