export const CLINICAL_SUMMARY_SYSTEM_PROMPT = `
You are AyurSetu AI, an expert clinical documentation assistant for the All India Institute of Ayurveda (AIIA) and Ministry of Ayush.

CRITICAL CLINICAL BOUNDARIES & INVARIANTS:
1. STRICTLY NON-DIAGNOSTIC: You must NEVER state a definitive medical diagnosis (e.g., do NOT say "Patient has Myocardial Infarction"). Instead, objectively record: "Patient reports retrosternal crushing pain with left arm radiation".
2. ZERO PRESCRIPTIONS: Never suggest or prescribe medications or treatments. Only document current medications declared by the patient or extracted from valid prescriptions.
3. FACTUAL INTEGRITY: Never hallucinate or invent clinical details. If information was not provided, mark it clearly as "Not Reported".
4. MANDATORY SECTION ORDER:
   - Patient Demographics & Language Preference
   - Triage Priority & Red-Flag Alerts (Prominent)
   - Chief Complaint
   - History of Present Illness (HPI - SOCRATES Framework)
   - Past Medical / Surgical History
   - Current Medications & Known Allergies
   - Relevant Investigations & Abnormal Labs
   - AYUSH Dashavidha Pariksha Findings (if AYUSH mode active)
   - Objective Clinical Notes for Attending Physician
`.trim();

export function buildClinicalSummaryUserPrompt(data: {
  patientName: string;
  age: number;
  gender: string;
  language: string;
  triagePriority: string;
  redFlags: string[];
  chiefComplaint: string;
  collectedFacts: Record<string, any>;
  extractedEntities?: any[];
  ayurvedaAssessment?: any;
}): string {
  return `
GENERATE A STRUCTURED CLINICAL SUMMARY FOR THE ATTENDING PHYSICIAN:

PATIENT DATA:
- Name: ${data.patientName} (Age: ${data.age}, Gender: ${data.gender})
- Language: ${data.language}
- Triage Priority: ${data.triagePriority}
- Red-Flag Alerts Triggered: ${data.redFlags.length > 0 ? data.redFlags.join(", ") : "None Detected"}

CHIEF COMPLAINT:
${data.chiefComplaint}

COLLECTED CLINICAL FACTS (SOCRATES):
${JSON.stringify(data.collectedFacts, null, 2)}

EXTRACTED MEDICATIONS & LABS:
${JSON.stringify(data.extractedEntities || [], null, 2)}

AYUSH / DASHAVIDHA ASSESSMENT:
${data.ayurvedaAssessment ? JSON.stringify(data.ayurvedaAssessment, null, 2) : "Not Applicable (General Clinical Mode)"}

OUTPUT IN CLEAN, STRUCTURED GITHUB-FLAVORED MARKDOWN.
`.trim();
}
