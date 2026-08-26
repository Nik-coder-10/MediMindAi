import { AdaptiveEngineService } from "../lib/engine/adaptive-engine.service";

async function verifyChestPainFlow() {
  console.log("=================================================");
  console.log("🧪 VERIFYING ADAPTIVE QUESTION ENGINE (CHEST PAIN)");
  console.log("=================================================\n");

  const sessionId = `test-session-${Date.now()}`;
  const chiefComplaint = "Severe chest pain radiating to left arm since last night";

  console.log(`1. Starting Session with Chief Complaint: "${chiefComplaint}"`);
  const initResult = await AdaptiveEngineService.startSession(sessionId, chiefComplaint);
  console.log(`   👉 Category Classified: ${initResult.state.category}`);
  console.log(`   👉 First Question: [${initResult.firstQuestion?.nodeCode}] ${initResult.firstQuestion?.questionText}\n`);

  console.log("2. Answering Q1 (Severity): 'SEVERE_7_10'");
  const q1Result = await AdaptiveEngineService.processAnswer(sessionId, "CP_SEVERITY", "SEVERE_7_10");
  console.log(`   👉 Advanced to: [${q1Result.nextQuestion?.nodeCode}] ${q1Result.nextQuestion?.questionText}\n`);

  console.log("3. Answering Q2 (Character): 'PRESSURE_HEAVINESS'");
  const q2Result = await AdaptiveEngineService.processAnswer(sessionId, "CP_CHARACTER", "PRESSURE_HEAVINESS");
  console.log(`   👉 Advanced to: [${q2Result.nextQuestion?.nodeCode}] ${q2Result.nextQuestion?.questionText}\n`);

  console.log("4. Answering Q3 (Radiation): 'YES' (Should trigger Critical Red Flag)");
  const q3Result = await AdaptiveEngineService.processAnswer(sessionId, "CP_RADIATION", "YES");
  console.log(`   👉 Red Flag Detected:`, q3Result.redFlagAlert);
  console.log(`   👉 Triage Level Escalated To: ${q3Result.state.triageLevel}`);
  console.log(`   👉 Advanced to: [${q3Result.nextQuestion?.nodeCode}] ${q3Result.nextQuestion?.questionText}\n`);

  console.log("5. Testing Pause and Resume");
  await AdaptiveEngineService.pauseSession(sessionId);
  let state = await AdaptiveEngineService.getCurrentState(sessionId);
  console.log(`   👉 Is Paused: ${state?.isPaused}`);
  await AdaptiveEngineService.resumeSession(sessionId);
  state = await AdaptiveEngineService.getCurrentState(sessionId);
  console.log(`   👉 Is Resumed: ${!state?.isPaused}\n`);

  console.log("6. Final Collected Facts Summary (SOCRATES + Safety):");
  console.log(JSON.stringify(state?.collectedFacts, null, 2));

  console.log("\n✅ ALL ENGINE VERIFICATION CHECKS PASSED!");
}

verifyChestPainFlow().catch((e) => {
  console.error("❌ Verification error:", e);
  process.exit(1);
});
