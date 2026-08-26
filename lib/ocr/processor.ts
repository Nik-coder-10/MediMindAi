import { DocumentOCRService, OCRExtractionResult } from "./types";

export class DocumentOCRProcessor implements DocumentOCRService {
  async extractText(fileBuffer: Buffer, mimeType: string): Promise<OCRExtractionResult> {
    // Placeholder interface ready for Tesseract.js / Azure Form Recognizer / Google DocAI
    return {
      rawText: "Sample extracted Ayurvedic prescription content...",
      confidence: 0.96,
      extractedFields: {
        patientName: "Ramesh Sharma",
        date: "2026-08-20",
        doctorName: "Dr. A. K. Joshi (BAMS, MD)",
        diagnosis: "Amavata (Rheumatoid Arthritis)",
        prescriptions: [
          "Simhanada Guggulu 2 tabs BD",
          "Rasnasaptaka Kwatha 20ml BD with lukewarm water",
        ],
      },
    };
  }
}

export const ocrProcessor = new DocumentOCRProcessor();
