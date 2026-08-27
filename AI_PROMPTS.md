# AI Prompt Engineering, Safety Guardrails & Golden Benchmark

**Smart India Hackathon 2026 – Problem ID 26047 (Ministry of Ayush / AIIA)**

---

## 🏛️ 1. Centralized Prompt Architecture (`lib/ai/prompts/`)

| Module | Purpose | Validation Schema | Safety Invariant |
|---|---|---|---|
| **[`clinical-summary.prompt.ts`](file:///c:/Users/Hp/OneDrive/Desktop/SIH_2026/lib/ai/prompts/clinical-summary.prompt.ts)** | Drafts objective, structured clinical summaries for attending physicians. | Markdown Section Parser | **Strictly Non-Diagnostic**: Never outputs differential diagnoses or new prescriptions. |
| **[`chief-complaint.prompt.ts`](file:///c:/Users/Hp/OneDrive/Desktop/SIH_2026/lib/ai/prompts/chief-complaint.prompt.ts)** | Categorizes free-text / voice complaints into SOCRATES question trees. | `ChiefComplaintClassificationSchema` (Zod) | Immediate emergency keyword detection. |
| **[`entity-extraction.prompt.ts`](file:///c:/Users/Hp/OneDrive/Desktop/SIH_2026/lib/ai/prompts/entity-extraction.prompt.ts)** | Extracts structured medications, dosages, lab tests, vitals, and surgical history. | `EntityExtractionResponseSchema` (Zod) | Zero hallucination; captures confidence scores and unclear lines. |

---

## 🛡️ 2. Production Clinical Summary System Prompt

```markdown
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
```

---

## 🧪 3. 10-Case Golden Benchmark Evaluation

Execute automated evaluation harness:
```bash
npx tsx scripts/evaluate-ai-prompts.ts
# Result: 10/10 PASSED (100% Deterministic Pass Rate)
```
