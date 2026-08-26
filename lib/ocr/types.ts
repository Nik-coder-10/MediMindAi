export interface OCRExtractionResult {
  rawText: string;
  confidence: number;
  extractedFields: {
    patientName?: string;
    date?: string;
    doctorName?: string;
    diagnosis?: string;
    prescriptions?: string[];
  };
  tables?: Array<Array<string>>;
}

export interface DocumentOCRService {
  extractText(fileBuffer: Buffer, mimeType: string): Promise<OCRExtractionResult>;
}
