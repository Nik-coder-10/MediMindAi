import { MedicalTimelineService } from "../lib/services/timeline.service";
import { AbnormalLabEvaluator } from "../lib/clinical/lab-ranges";

async function verifyTimelineAndAbnormalLabs() {
  console.log("==================================================================");
  console.log("📊 VERIFYING MEDICAL TIMELINE & ABNORMAL LAB VALUE DETECTION");
  console.log("==================================================================\n");

  // 1. TEST TIMELINE CHRONOLOGY
  console.log("1. Generating Longitudinal Timeline for Ramesh Sharma (pat-demo-001)...");
  const timeline = await MedicalTimelineService.getPatientTimeline("pat-demo-001");
  console.log(`   👉 Total Timeline Milestones: ${timeline.length}`);
  timeline.forEach((evt, idx) => {
    console.log(`   [${evt.eventDate}] (${evt.category}) ${evt.title} ${evt.isAbnormal ? "🚨 ABNORMAL" : ""}`);
  });

  // Verify chronological descending order
  const dates = timeline.map((e) => new Date(e.eventDate).getTime());
  const isSorted = dates.every((val, i, arr) => !i || arr[i - 1] >= val);
  console.log(`   👉 Timeline Sorting Verified (Descending Chronology): ${isSorted ? "YES" : "NO"}\n`);

  // 2. TEST ABNORMAL LAB DETECTION & REFERENCE RANGES
  console.log("2. Evaluating Diagnostic Lab Test Panel:");
  const testLabs = [
    { testName: "HbA1c", value: 8.9 }, // High (Pre/Diabetic)
    { testName: "Hemoglobin", value: 9.2 }, // Low (Anemia)
    { testName: "Serum Creatinine", value: 2.1 }, // High (Renal impairment)
    { testName: "ESR", value: 45 }, // High (Inflammation)
    { testName: "Fasting Blood Sugar", value: 260 }, // Critical High
    { testName: "Total Platelet Count", value: 2.5 }, // Normal
  ];

  const evaluated = testLabs.map((l) => AbnormalLabEvaluator.evaluateTest(l.testName, l.value));

  evaluated.forEach((res) => {
    console.log(
      `   🧪 [${res.testName}]: ${res.value} ${res.unit} | Flag: [${res.flag}] | Ref: ${res.referenceRange}`
    );
    console.log(`      Note: ${res.clinicalNote}`);
  });

  const abnormalOnly = evaluated.filter((l) => l.flag !== "NORMAL");
  console.log(`\n   👉 Flagged Abnormal Tests for Physician Review: ${abnormalOnly.length} of ${testLabs.length}`);

  if (isSorted && abnormalOnly.length === 5) {
    console.log("\n==================================================================");
    console.log("🎉 MEDICAL TIMELINE & LAB DETECTION VERIFICATION PASSED 100%!");
    console.log("==================================================================");
  } else {
    throw new Error("Verification checks failed.");
  }
}

verifyTimelineAndAbnormalLabs().catch((e) => {
  console.error("❌ Verification failed:", e);
  process.exit(1);
});
