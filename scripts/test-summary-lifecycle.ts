import { SummaryService } from "../lib/services/summary.service";

async function verifySummaryLifecycle() {
  console.log("==================================================================");
  console.log("📝 VERIFYING AI CLINICAL SUMMARY GENERATION & DOCTOR LIFECYCLE");
  console.log("==================================================================\n");

  const sessionId = `test-sum-sess-${Date.now()}`;

  // 1. GENERATE SUMMARY
  console.log(`1. Generating Structured Clinical Summary for Session: ${sessionId}`);
  const summary = await SummaryService.generateSummary({ sessionId });
  console.log(`   👉 Summary Created ID: ${summary.id} | Initial Status: ${summary.status} | Version: ${summary.version}`);
  console.log(`   👉 Markdown Length: ${summary.aiGeneratedMarkdown.length} characters\n`);

  // Verify Mandatory Sections
  const mandatorySections = [
    "Patient Demographics & Encounter Details",
    "Triage Priority & Safety Red Flags",
    "Chief Complaint",
    "History of Present Illness (HPI)",
    "Current Medications & Allergies",
    "Relevant Investigations & Abnormal Labs",
    "Longitudinal Medical Timeline",
    "AYUSH & Dashavidha Pariksha Findings",
    "Clinical Notes & Physician Attention Areas",
  ];

  console.log("2. Verifying Mandatory Section Sequence:");
  mandatorySections.forEach((section, idx) => {
    const exists = summary.aiGeneratedMarkdown.includes(section);
    console.log(`   ${idx + 1}. [${exists ? "✓ PRESENT" : "✗ MISSING"}] ${section}`);
    if (!exists) throw new Error(`Mandatory section "${section}" is missing.`);
  });

  // 2. TEST PHYSICIAN EDIT
  console.log("\n3. Testing Physician Edit & Version Bump:");
  const editedNote = summary.aiGeneratedMarkdown + "\n\n*Physician Addendum: ECG ordered stat. Referred to Emergency Vaidya on-duty.*";
  const updated = await SummaryService.updateDoctorSummary({
    sessionId,
    doctorEditedMarkdown: editedNote,
    status: "REVISED",
  });
  console.log(`   👉 Updated Version: ${updated.version} | Status: ${updated.status}`);
  if (updated.version <= summary.version) throw new Error("Version increment failed on edit.");

  // 3. TEST SUMMARY ACCEPTANCE
  console.log("\n4. Testing Doctor Sign-off & Acceptance:");
  const accepted = await SummaryService.acceptSummary(sessionId);
  console.log(`   👉 Final Signed-off Status: ${accepted.status} | ReviewedAt: ${accepted.reviewedAt}`);
  if (accepted.status !== "ACCEPTED") throw new Error("Summary acceptance failed.");

  // 4. TEST SUMMARY REJECTION
  console.log("\n5. Testing Summary Rejection Flow:");
  const rejected = await SummaryService.rejectSummary(sessionId, "Incomplete vital signs recorded.");
  console.log(`   👉 Final Rejection Status: ${rejected.status}`);
  if (rejected.status !== "REJECTED") throw new Error("Summary rejection failed.");

  console.log("\n==================================================================");
  console.log("🎉 ALL CLINICAL SUMMARY GENERATION & LIFECYCLE CHECKS PASSED 100%!");
  console.log("==================================================================");
}

verifySummaryLifecycle().catch((e) => {
  console.error("❌ Summary verification failed:", e);
  process.exit(1);
});
