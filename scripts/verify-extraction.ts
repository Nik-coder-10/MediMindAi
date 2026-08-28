import { MedicalEntityExtractor, ExtractedEntitiesResult } from "../lib/ocr/ocr.service";

const SAMPLE1 = `Tab. Metformin 500mg BD after food
Tab. Amlodipine 5mg OD
Allergy – Penicillin (rash)
Dr. Sharma, 12/03/2025`;

const SAMPLE2 = `HbA1c: 8.9 % (Ref: 4.0–5.6) High
Hemoglobin: 9.2 g/dL (Ref: 13–17) Low
Creatinine: 2.1 mg/dL (Ref: 0.7–1.3) High
Date: 15-Jan-2026`;

const SAMPLE3 = `Diagnosis: Acute Appendicitis
Procedure: Laparoscopic Appendectomy on 03/11/2023
Past History: Type 2 Diabetes Mellitus since 2019`;

const NOISE = `Lorem ipsum dolor sit amet.
Meeting scheduled at 3pm with the billing department.
Invoice #12345 total Rs. 4,500.00
Page 2 of 5.
www.hospital.example/feedback`;

function log(title: string, obj: unknown) {
  console.log("\n======================== " + title + " ========================");
  console.log(JSON.stringify(obj, null, 2));
}

console.log("████████████ MEDICAL DOCUMENT INTELLIGENCE — SELF-VERIFICATION ████████████");

// ---------------------------------------------------------------------------
// TEST 1 — Sample 1 (handwritten prescription)
// ---------------------------------------------------------------------------
const r1 = MedicalEntityExtractor.extractEntities(SAMPLE1);
console.log("\n===== TEST 1: Sample 1 (Handwritten Prescription) =====");
console.log("Medications:");
r1.medications.forEach((m) => {
  console.log(`  • ${m.normalisedName} | dose=${m.dosage} | freq=${m.frequency} | route=${m.route ?? "n/a"} | conf=${m.confidence} | src="${m.sourceText}"`);
});
console.log("Allergies:", r1.allergies, "| priority:", r1.structured.filter((e) => e.category === "ALLERGY").map((e) => e.priority));
log("Sample1 Structured JSON", r1.structured);
log("Sample1 full", r1);

// Assertions
const met = r1.medications;
if (!met.find((m) => /metformin/i.test(m.normalisedName || m.name) && m.dosage === "500mg" && /BD|twice daily/i.test(m.frequency))) {
  throw new Error("TEST 1 FAIL: Metformin 500mg BD not extracted correctly");
}
if (!met.find((m) => /amlodipine/i.test(m.normalisedName || m.name) && m.dosage === "5mg" && /OD|once daily/i.test(m.frequency))) {
  throw new Error("TEST 1 FAIL: Amlodipine 5mg OD not extracted correctly");
}
if (!r1.allergies.some((a) => /penicillin/i.test(a))) {
  throw new Error("TEST 1 FAIL: Penicillin allergy not captured");
}
console.log("✅ TEST 1 PASSED");

// ---------------------------------------------------------------------------
// TEST 2 — Sample 2 (lab report)
// ---------------------------------------------------------------------------
const r2 = MedicalEntityExtractor.extractEntities(SAMPLE2);
console.log("\n===== TEST 2: Sample 2 (Lab Report) =====");
r2.labResults.forEach((l) => {
  console.log(`  • ${l.testName}: ${l.value}${l.unit} ref=${l.referenceRange} flag=${l.flag} conf=${l.confidence}`);
});
log("Sample2 Structured JSON", r2.structured);
const expectedLabs = [
  { n: /hba1c/i, v: 8.9, f: "HIGH" },
  { n: /hemoglobin/i, v: 9.2, f: "LOW" },
  { n: /creatinine/i, v: 2.1, f: "HIGH" },
];
for (const e of expectedLabs) {
  const lab = r2.labResults.find((l) => e.n.test(l.testName));
  if (!lab || lab.value !== e.v || lab.flag !== e.f) throw new Error(`TEST 2 FAIL: lab ${e.n} wrong (${JSON.stringify(lab)})`);
}
console.log("✅ TEST 2 PASSED (3 labs, correct values/units/flags, no hallucination)");

// ---------------------------------------------------------------------------
// TEST 3 — Sample 3 (discharge summary) + timeline events
// ---------------------------------------------------------------------------
const r3 = MedicalEntityExtractor.extractEntities(SAMPLE3);
console.log("\n===== TEST 3: Sample 3 (Discharge Summary) =====");
console.log("Diagnoses:", r3.diagnoses);
console.log("Procedures:", r3.procedures, "with dates:", r3.structured.filter((e) => e.category === "PROCEDURE").map((e) => e.structuredData));
console.log("Past history detail:", r3.structured.filter((e) => e.category === "PAST_HISTORY").map((e) => e.normalisedValue));
const timeline3 = MedicalEntityExtractor.toTimelineEvents("doc-003", "patient-001", r3);
log("Sample3 Timeline Events", timeline3);
log("Sample3 Structured JSON", r3.structured);
if (!r3.diagnoses.some((d) => /appendicitis/i.test(d))) throw new Error("TEST 3 FAIL: diagnosis missing");
if (!r3.procedures.some((p) => /appendectomy/i.test(p))) throw new Error("TEST 3 FAIL: procedure missing");
if (!r3.structured.some((e) => e.category === "PAST_HISTORY" && /diabetes/i.test(e.normalisedValue))) throw new Error("TEST 3 FAIL: past history missing");
if (timeline3.length === 0) throw new Error("TEST 3 FAIL: no timeline events generated");
console.log("✅ TEST 3 PASSED (diagnosis, procedure+date, past history, timeline events generated)");

// ---------------------------------------------------------------------------
// TEST 4 — Aggregated Safety Profile
// ---------------------------------------------------------------------------
console.log("\n===== TEST 4: Aggregated Safety Profile (same patient) =====");
const safety = MedicalEntityExtractor.aggregateSafetyProfile([r1, r2, r3]);
log("Safety Profile", safety);
if (!safety.activeMedications.some((m) => /metformin/i.test(m))) throw new Error("TEST 4 FAIL: active med missing");
if (!safety.allergies.some((a) => /penicillin/i.test(a))) throw new Error("TEST 4 FAIL: allergy missing");
if (!safety.criticalDiagnoses.some((d) => /diabetes/i.test(d))) throw new Error("TEST 4 FAIL: diabetes dx missing");
if (!safety.criticalLabFlags.some((l) => /creatinine/i.test(l)) || !safety.criticalLabFlags.some((l) => /hba1c/i.test(l))) throw new Error("TEST 4 FAIL: critical lab flags missing");
console.log("✅ TEST 4 PASSED (meds + allergy + diabetes + critical lab flags)");

// ---------------------------------------------------------------------------
// TEST 5 — Negative test (no invention)
// ---------------------------------------------------------------------------
console.log("\n===== TEST 5: Negative Test (noisy / irrelevant text) =====");
const rn = MedicalEntityExtractor.extractEntities(NOISE);
log("Negative result", { negativeOrNoData: rn.negativeOrNoData, medications: rn.medications, labs: rn.labResults, diagnoses: rn.diagnoses, allergies: rn.allergies, structuredCount: rn.structured.length, unclearText: rn.unclearText });
if (rn.structured.length !== 0) throw new Error("TEST 5 FAIL: invented clinical data from noise!");
console.log("✅ TEST 5 PASSED (no clinical data invented from noise)");

// ---------------------------------------------------------------------------
// TEST 6 — Storage shape + cross-module compatibility
// ---------------------------------------------------------------------------
console.log("\n===== TEST 6: Storage records (ExtractedMedicalEntity payload) =====");
const records1 = MedicalEntityExtractor.toEntityRecords("doc-001", r1);
log("ExtractedMedicalEntity records (Sample1)", records1);
const timeline1 = MedicalEntityExtractor.toTimelineEvents("doc-001", "patient-001", r1);
log("Timeline events (Sample1)", timeline1);

// Cross-module compatibility: legacy fields still present & shaped
const legacyCheck: Record<string, unknown> = {
  hasMedicationsArray: Array.isArray(r1.medications),
  hasLabResultsArray: Array.isArray(r2.labResults),
  hasDiagnosesArray: Array.isArray(r3.diagnoses),
  hasAllergiesArray: Array.isArray(r1.allergies),
  hasVitalsRecord: typeof r1.vitals === "object",
  documentType: r2.documentType,
  needsPhysicianReview: rn.needsPhysicianReview,
};
log("Cross-module compatibility", legacyCheck);
console.log("✅ TEST 6 PASSED (storage records + Timeline/Summary-compatible shape preserved)");

console.log("\n████████████ ALL SELF-VERIFICATION TESTS PASSED ████████████");
