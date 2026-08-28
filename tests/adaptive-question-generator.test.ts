import { AdaptiveQuestionGenerator } from "../lib/engine/adaptive-question-generator";
import { AdaptiveEngineService } from "../lib/engine/adaptive-engine.service";

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

async function runAdaptiveGeneratorTestSuite() {
  console.log("==================================================================");
  console.log("🧪 RUNNING ADAPTIVE QUESTION GENERATOR (SIH 2026) SUITE");
  console.log("==================================================================\n");

  // TEST 1: Knee pain in English & Hindi
  console.log("--- 1. Case: 'knee pain' / 'घुटने में दर्द' (Musculoskeletal) ---");
  const kneeResultEn = await AdaptiveQuestionGenerator.generateQuestions({
    chiefComplaint: "Severe knee pain since last week and difficulty walking",
    language: "en",
  });

  assert(kneeResultEn.category === "Musculoskeletal", "Knee pain classifies as 'Musculoskeletal'");
  assert(kneeResultEn.detectedProblems.some(p => p.toLowerCase().includes("knee")), "Detects Knee Joint Pain problem");
  assert(kneeResultEn.questions.length >= 5 && kneeResultEn.questions.length <= 8, "Generates 5-8 questions");
  assert(!kneeResultEn.questions.some(q => q.textEn.toLowerCase().includes("chest pain")), "Does NOT include chest pain questions");
  assert(kneeResultEn.questions.some(q => q.clinicalPurpose === "severity"), "Contains severity scale question");
  assert(kneeResultEn.questions.some(q => q.clinicalPurpose === "red_flag"), "Contains red_flag safety question");
  assert(kneeResultEn.redFlagHints.length > 0, "Provides relevant red flag safety hints");

  const kneeResultHi = await AdaptiveQuestionGenerator.generateQuestions({
    chiefComplaint: "घुटने में दर्द और चलने में परेशानी",
    language: "hi",
  });
  assert(kneeResultHi.category === "Musculoskeletal", "Hindi 'घुटने में दर्द' classifies as 'Musculoskeletal'");
  assert(kneeResultHi.questions[0].text.length > 0, "Hindi question text is populated");
  assert(kneeResultHi.questions[0].textEn.length > 0, "English version textEn is always present");

  // TEST 2: Fever & Body ache
  console.log("\n--- 2. Case: 'fever and body ache' / 'तेज बुखार' (Fever) ---");
  const feverResult = await AdaptiveQuestionGenerator.generateQuestions({
    chiefComplaint: "High fever and body ache with shivering since 3 days",
    language: "hi",
  });
  assert(feverResult.category === "Fever", "Fever and body ache classifies as 'Fever'");
  assert(feverResult.detectedProblems.some(p => p.toLowerCase().includes("fever") || p.includes("ज्वर")), "Detects fever problem");
  assert(feverResult.questions.some(q => q.id.includes("fev_duration") || q.clinicalPurpose === "onset"), "Contains fever duration question");
  assert(!feverResult.questions.some(q => q.id.includes("cp_")), "Does NOT contain cardiac questions");

  // TEST 3: Chest Pain
  console.log("\n--- 3. Case: 'chest pain radiating to left arm' (Chest Pain) ---");
  const cpResult = await AdaptiveQuestionGenerator.generateQuestions({
    chiefComplaint: "Severe crushing chest pain radiating to left arm and sweating",
    language: "en",
  });
  assert(cpResult.category === "Chest Pain", "Chest pain classifies as 'Chest Pain'");
  assert(cpResult.questions.some(q => q.clinicalPurpose === "location"), "Evaluates radiation location");
  assert(cpResult.redFlagHints.some(h => h.includes("Acute Coronary Syndrome")), "Contains ACS red flag safety cue");

  // TEST 4: Abdominal Pain / Acidity
  console.log("\n--- 4. Case: 'पेट में तेज दर्द व उल्टी' (Abdominal Pain) ---");
  const abdResult = await AdaptiveQuestionGenerator.generateQuestions({
    chiefComplaint: "पेट में तेज दर्द व उल्टी और जलन",
    language: "hi",
  });
  assert(abdResult.category === "Abdominal Pain", "Abdominal complaint classifies as 'Abdominal Pain'");
  assert(abdResult.questions.some(q => q.clinicalPurpose === "red_flag"), "Checks for rigidity / GI bleed red flags");

  // TEST 5: Headache
  console.log("\n--- 5. Case: 'severe migraine headache' (Headache) ---");
  const haResult = await AdaptiveQuestionGenerator.generateQuestions({
    chiefComplaint: "Severe migraine headache on left side of head with nausea",
    language: "en",
  });
  assert(haResult.category === "Headache", "Headache classifies as 'Headache'");
  assert(haResult.questions.some(q => q.clinicalPurpose === "onset"), "Checks for thunderclap onset");

  // TEST 6: Respiratory
  console.log("\n--- 6. Case: 'खांसी और सांस फूलना' (Respiratory) ---");
  const respResult = await AdaptiveQuestionGenerator.generateQuestions({
    chiefComplaint: "खांसी और सांस फूलना (Cough and breathlessness)",
    language: "hi",
  });
  assert(respResult.category === "Respiratory", "Breathlessness classifies as 'Respiratory'");
  assert(respResult.questions.some(q => q.clinicalPurpose === "character"), "Evaluates cough character & sputum");

  // TEST 7: End-to-end Session Engine with Knee Pain
  console.log("\n--- 7. INTEGRATION: AdaptiveEngineService with Knee Pain ---");
  const testSessionId = `sess-msk-${Date.now()}`;
  const { state: mskSession, firstQuestion } = await AdaptiveEngineService.startSession(
    testSessionId,
    "घुटने में तेज दर्द और सूजन (Severe knee pain and swelling)"
  );
  assert(mskSession.category === "JOINT_PAIN", "Session category mapped to JOINT_PAIN");
  assert(firstQuestion !== null, "First question generated");
  assert(Boolean(firstQuestion?.nodeCode.startsWith("msk_")), `First question is knee-specific (${firstQuestion?.nodeCode})`);
  assert(Boolean(!firstQuestion?.nodeCode.startsWith("CP_")), "First question is NOT static chest pain (CP_SEVERITY)");

  const turnResult = await AdaptiveEngineService.processAnswer(
    testSessionId,
    firstQuestion!.nodeCode,
    "BILATERAL_KNEES"
  );
  assert(turnResult.nextQuestion !== null, "Engine seamlessly advances to next tailored question");
  assert(Boolean(turnResult.nextQuestion?.nodeCode.startsWith("msk_")), `Next question is in MSK sequence (${turnResult.nextQuestion?.nodeCode})`);


  // Summary
  console.log("\n==================================================================");
  console.log(`🏁 ADAPTIVE GENERATOR RESULTS: ${passedCount} PASSED | ${failedCount} FAILED`);
  console.log("==================================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runAdaptiveGeneratorTestSuite().catch((e) => {
  console.error("Test execution error:", e);
  process.exit(1);
});
