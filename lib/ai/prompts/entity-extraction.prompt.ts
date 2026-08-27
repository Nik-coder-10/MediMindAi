import { z } from "zod";

export const ExtractedMedicalEntitySchema = z.object({
  category: z.enum(["MEDICATION", "LAB_TEST", "VITAL_SIGN", "DIAGNOSIS_HISTORIC"]),
  rawText: z.string(),
  standardName: z.string(),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  value: z.string().optional(),
  unit: z.string().optional(),
  confidence: z.number().min(0).max(1),
});

export const EntityExtractionResponseSchema = z.object({
  entities: z.array(ExtractedMedicalEntitySchema),
  unclearLines: z.array(z.string()),
});

export const ENTITY_EXTRACTION_SYSTEM_PROMPT = `
You are AyurSetu Clinical Entity Extractor. Extract structured clinical entities from OCR prescription text:
- Medications (Name, Dosage, Frequency e.g., "Tab Yogaraj Guggulu 2 tabs BD")
- Lab Tests (Name, Value, Unit e.g., "HbA1c 8.9%")
- Vital Signs (BP, Pulse, SpO2)
- Historic Diagnoses (Past diagnosed conditions)

Return strictly valid JSON conforming to the schema.
`.trim();
