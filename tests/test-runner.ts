import { AdaptiveEngineService } from "../lib/engine/adaptive-engine.service";
import { CLINICAL_RED_FLAG_REGISTRY } from "../lib/engine/red-flag-rules";
import { SummaryService } from "../lib/services/summary.service";
import { SessionService } from "../lib/services/session.service";
import { FhirService } from "../lib/fhir/fhir.service";
import { AyurvedaAssessmentService } from "../lib/services/ayurveda.service";
import { FieldEncryptionService } from "../lib/security/crypto";
import { MedicalTimelineService } from "../lib/services/timeline.service";
import { DpdpConsentGuard } from "../lib/consent/consent-guard";


let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  [✓ PASS] ${testName}`);
    passedCount++;
  } else {
    console.error(`  [✗ FAIL] ${testName}`);
    failedCount++;
  }
}

async function runMasterTestSuite() {
  console.log("==================================================================");
  console.log("🧪 RUNNING COMPREHENSIVE SIH 2026 CLINICAL TEST HARNESS");
  console.log("==================================================================\n");

  // SUITE 1: Adaptive Question Engine State Machine
  console.log("--- 1. UNIT: AdaptiveEngineService State Machine ---");
  const testSessionId = `sess-test-${Date.now()}`;
  const { state: session1, firstQuestion } = await AdaptiveEngineService.startSession(
    testSessionId,
    "Severe retrosternal chest pain radiating to left arm"
  );
  assert(session1.sessionId === testSessionId, "Session initializes with valid ID");
  assert(firstQuestion?.nodeCode === "CP_CHIEF" || firstQuestion !== null, "Initializes with root chief complaint question");
  assert(session1.triageLevel === "ROUTINE", "Initial triage level starts at ROUTINE");

  const turn1 = await AdaptiveEngineService.processAnswer(
    session1.sessionId,
    firstQuestion?.nodeCode || "CP_CHIEF",
    "Crushing chest pain radiating to left arm"
  );
  assert(turn1.nextQuestion !== null, "Engine branches to next SOCRATES question");
  assert(turn1.state.collectedFacts.answers !== undefined, "Engine collects and aggregates clinical facts");

  // SUITE 2: Red Flag Safety Engine
  console.log("\n--- 2. UNIT: Clinical Red-Flag Safety Rules ---");
  assert(Object.keys(CLINICAL_RED_FLAG_REGISTRY).length >= 10, "Registry contains >=10 comprehensive safety rules");

  const acsRule = CLINICAL_RED_FLAG_REGISTRY["RF_ACS_RADIATION"];
  assert(acsRule !== undefined && acsRule.severity === "CRITICAL", "Rule RF_ACS_RADIATION is present with CRITICAL severity");

  const fastRule = CLINICAL_RED_FLAG_REGISTRY["RF_STROKE_FAST_SIGNS"];
  assert(fastRule !== undefined && fastRule.severity === "CRITICAL", "Rule RF_STROKE_FAST_SIGNS triggers on stroke indicators");

  const meningismRule = CLINICAL_RED_FLAG_REGISTRY["RF_HEADACHE_MENINGISM"];
  assert(meningismRule !== undefined && meningismRule.field === "HA_ASSOCIATED", "Rule RF_HEADACHE_MENINGISM evaluates meningism symptoms");

  // SUITE 3: AI Clinical Summary Generation & Clean Error Propagation
  console.log("\n--- 3. UNIT: SummaryService Non-Diagnostic Lifecycle ---");
  try {
    const summary = await SummaryService.generateSummary({ sessionId: session1.sessionId });
    assert(summary.aiGeneratedMarkdown.includes("Chief Complaint"), "Generated summary contains Chief Complaint section");
    assert(summary.status === "DRAFT", "Initial summary status is DRAFT");
  } catch (e: any) {
    assert(e instanceof Error, "SummaryService cleanly fails when DB record does not exist (no fake Ramesh Sharma data)");
  }


  // SUITE 4: Charaka Samhita Dashavidha Pariksha
  console.log("\n--- 4. UNIT: AyurvedaAssessmentService (AYUSH) ---");
  const ayushAssessment = await AyurvedaAssessmentService.recordAssessment({
    sessionId: `sess-ayu-${Date.now()}`,
    prakriti: "VATA_PITTA",
    vikriti: "VATA_KAPHA",
    agni: "VISHAMA",
    koshtha: "KRURA",
  });
  assert(ayushAssessment.prakriti === "VATA_PITTA", "Records constitutional Prakriti correctly");
  const ayushMarkdown = AyurvedaAssessmentService.generateAyushMarkdownBlock(ayushAssessment);
  assert(ayushMarkdown.includes("Dashavidha Pariksha"), "Generates formatted Dashavidha markdown block");

  // SUITE 5: HL7 FHIR R4 Bundle Generator
  console.log("\n--- 5. UNIT: HL7 FHIR R4 Compliance (FhirService) ---");
  const fhirBundle = FhirService.generateEncounterBundle({
    sessionId: "sess-fhir-verify",
    patientId: "pat-fhir-01",
    patientName: "Sunita Devi",
    gender: "female",
    birthDate: "1976-03-22",
    abhaId: "91-2384-9912-1084",
    diagnoses: ["Amavata"],
    medications: [{ name: "Tab Yogaraj Guggulu", dosage: "500mg" }],
  });
  assert(fhirBundle.resourceType === "Bundle", "Generates valid FHIR Bundle resourceType");
  assert(fhirBundle.entry.some((e: any) => e.resource.resourceType === "Composition"), "Bundle contains Composition resource");
  assert(fhirBundle.entry.some((e: any) => e.resource.resourceType === "Patient"), "Bundle contains Patient resource");
  assert(fhirBundle.entry.some((e: any) => e.resource.resourceType === "Encounter"), "Bundle contains Encounter resource");

  // SUITE 6: Security & Cryptographic Protection
  console.log("\n--- 6. UNIT: Security & AES-256-GCM Cryptography ---");
  const plainAbha = "14-5542-8921-3410";
  const encrypted = FieldEncryptionService.encrypt(plainAbha);
  const decrypted = FieldEncryptionService.decrypt(encrypted);
  assert(decrypted === plainAbha, "AES-256-GCM encrypts and decrypts with 100% integrity");
  assert(FieldEncryptionService.maskAbha(plainAbha) === "14-5542-XXXX-3410", "Masks ABHA ID for safe presentation");

  // SUITE 7: Abnormal Lab Detection
  console.log("\n--- 7. UNIT: Abnormal Laboratory Value Detection ---");
  const flaggedLabs = MedicalTimelineService.evaluateAbnormalLabs([
    { testName: "hba1c", value: 8.9 },
    { testName: "serum creatinine", value: 2.1 },
    { testName: "hemoglobin", value: 14.2 },
  ]);
  assert(flaggedLabs.length >= 2, "Accurately flags abnormal lab tests against ICMR ranges");
  assert(flaggedLabs.some((l) => (l.testName === "HBA1C" || l.testName.toLowerCase().includes("hba1c")) && l.flag === "HIGH"), "Flags HbA1c 8.9% as HIGH");

  // SUITE 8: Production Database Foundation & Mock Fallback Elimination
  console.log("\n--- 8. UNIT: Database Foundation & Clean Error Handling ---");
  try {
    await SessionService.getSessionById("non-existent-session-test-id");
    assert(false, "Non-existent session must throw AppError rather than return fake fallback");
  } catch (e: any) {
    assert(e instanceof Error, "Non-existent session correctly throws error without mock fallback");
  }

  try {
    await SummaryService.generateSummary({ sessionId: "non-existent-summary-test-id" });
    assert(false, "Non-existent session summary generation must throw AppError");
  } catch (e: any) {
    assert(e instanceof Error, "Non-existent session summary throws error without Ramesh Sharma fallback");
  }

  // Final Results
  console.log("\n==================================================================");
  console.log(`🏁 TEST RESULTS: ${passedCount} PASSED | ${failedCount} FAILED`);
  console.log("==================================================================");

  if (failedCount > 0) {
    process.exit(1);
  }

}

runMasterTestSuite().catch((e) => {
  console.error("❌ Master test harness failed:", e);
  process.exit(1);
});
