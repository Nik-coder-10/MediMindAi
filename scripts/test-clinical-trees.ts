import { AdaptiveEngineService } from "../lib/engine/adaptive-engine.service";

async function runComprehensiveSafetyTests() {
  console.log("==================================================================");
  console.log("🩺 CLINICAL RED-FLAG & MULTI-TREE COMPREHENSIVE TEST SUITE");
  console.log("==================================================================\n");

  // TEST 1: CHEST PAIN -> EMERGENCY ACS CRITICAL RED FLAG
  console.log("TEST 1: Chest Pain with Radiation & Cold Sweating");
  const cpSession = `test-cp-${Date.now()}`;
  await AdaptiveEngineService.startSession(cpSession, "Chest heaviness and sweating");
  await AdaptiveEngineService.processAnswer(cpSession, "CP_SEVERITY", "SEVERE_7_10");
  await AdaptiveEngineService.processAnswer(cpSession, "CP_CHARACTER", "PRESSURE_HEAVINESS");
  const cpRes = await AdaptiveEngineService.processAnswer(cpSession, "CP_RADIATION", "YES");
  console.log(`   👉 Triage Level: ${cpRes.state.triageLevel} (Expected: EMERGENCY)`);
  console.log(`   👉 Triggered Rule: ${cpRes.redFlagAlert?.ruleId}`);
  if (cpRes.state.triageLevel !== "EMERGENCY") throw new Error("Test 1 Failed");

  // TEST 2: MILD TENSION HEADACHE -> ZERO RED FLAGS (ROUTINE)
  console.log("\nTEST 2: Mild Gradual Tension Headache");
  const haSession = `test-ha-${Date.now()}`;
  await AdaptiveEngineService.startSession(haSession, "Mild headache since evening");
  await AdaptiveEngineService.processAnswer(haSession, "HA_ONSET", "GRADUAL_HOURS");
  const haRes = await AdaptiveEngineService.processAnswer(haSession, "HA_NEURO_DEFICIT", "NO");
  console.log(`   👉 Triage Level: ${haRes.state.triageLevel} (Expected: ROUTINE)`);
  console.log(`   👉 Red Flag Alert: ${haRes.redFlagAlert ? "TRIGGERED" : "NONE"}`);
  if (haRes.state.triageLevel !== "ROUTINE" || haRes.redFlagAlert) throw new Error("Test 2 Failed");

  // TEST 3: FEVER WITH ALTERED SENSORIUM -> CRITICAL RED FLAG
  console.log("\nTEST 3: High Fever with Confusion / Drowsiness (Sepsis / Encephalitis)");
  const feverSession = `test-fev-${Date.now()}`;
  await AdaptiveEngineService.startSession(feverSession, "High fever with chills for 2 days");
  await AdaptiveEngineService.processAnswer(feverSession, "FEVER_DURATION", "ACUTE_1_3_DAYS");
  const fevRes = await AdaptiveEngineService.processAnswer(feverSession, "FEVER_NEURO", "CONFUSION_DROWSINESS");
  console.log(`   👉 Triage Level: ${fevRes.state.triageLevel} (Expected: EMERGENCY)`);
  console.log(`   👉 Triggered Rule: ${fevRes.redFlagAlert?.ruleId}`);
  if (fevRes.state.triageLevel !== "EMERGENCY") throw new Error("Test 3 Failed");

  // TEST 4: ABDOMINAL PAIN WITH HEMATEMESIS (VOMITING BLOOD) -> CRITICAL
  console.log("\nTEST 4: Abdominal Pain with Vomiting Blood");
  const abdSession = `test-abd-${Date.now()}`;
  await AdaptiveEngineService.startSession(abdSession, "Severe burning stomach pain");
  await AdaptiveEngineService.processAnswer(abdSession, "ABD_LOCATION", "EPIGASTRIC_UPPER");
  await AdaptiveEngineService.processAnswer(abdSession, "ABD_CHARACTER", "SOFT_TENDER");
  const abdRes = await AdaptiveEngineService.processAnswer(abdSession, "ABD_BLEEDING", "VOMITING_BLOOD");
  console.log(`   👉 Triage Level: ${abdRes.state.triageLevel} (Expected: EMERGENCY)`);
  console.log(`   👉 Triggered Rule: ${abdRes.redFlagAlert?.ruleId}`);
  if (abdRes.state.triageLevel !== "EMERGENCY") throw new Error("Test 4 Failed");

  console.log("\n==================================================================");
  console.log("🎉 ALL 4 CLINICAL SAFETY & MULTI-TREE SCENARIOS PASSED 100%!");
  console.log("==================================================================");
}

runComprehensiveSafetyTests().catch((e) => {
  console.error("❌ Test suite failed:", e);
  process.exit(1);
});
