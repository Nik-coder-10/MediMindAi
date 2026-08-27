import { z } from "zod";

export const ChiefComplaintClassificationSchema = z.object({
  category: z.enum(["CHEST_PAIN", "HEADACHE", "FEVER", "ABDOMINAL_PAIN", "JOINT_PAIN", "GENERAL"]),
  confidence: z.number().min(0).max(1),
  emergencyKeywordsDetected: z.array(z.string()),
  recommendedMode: z.enum(["GENERAL", "AYUSH"]),
});

export type ChiefComplaintClassification = z.infer<typeof ChiefComplaintClassificationSchema>;

export const CHIEF_COMPLAINT_SYSTEM_PROMPT = `
You are AyurSetu Clinical Triage Classifier. Classify incoming patient complaints into one of the 6 standard clinical intake categories:
- CHEST_PAIN
- HEADACHE
- FEVER
- ABDOMINAL_PAIN
- JOINT_PAIN
- GENERAL

Return strictly valid JSON conforming to the schema.
`.trim();
