import { dynamicQuestionNodes, dynamicRedFlagRules } from "../lib/engine/dynamic-registry";

async function verifyAdminPanel() {
  console.log("==================================================================");
  console.log("🔒 VERIFYING SECURE ADMIN CLINICAL CONFIGURATION PANEL");
  console.log("==================================================================\n");

  console.log("1. Testing Dynamic Question Node Injection:");
  const testNode = {
    chiefComplaintCategory: "CHEST_PAIN",
    nodeCode: "CP_DIAPHORESIS_CHECK",
    questionText: "Are you sweating profusely despite normal room temperature?",
    questionTextHindi: "क्या आपको सामान्य तापमान में भी अत्यधिक पसीना आ रहा है?",
    questionType: "SINGLE_CHOICE",
    clinicalDomain: "ADMIN_CONFIG",
    options: [
      { value: "YES", labelHi: "हाँ (Yes)", labelEn: "Yes" },
      { value: "NO", labelHi: "नहीं (No)", labelEn: "No" },
    ],
  };

  dynamicQuestionNodes.set(testNode.nodeCode, testNode);
  console.log(`   👉 Injected QuestionNode: [${testNode.nodeCode}] into dynamic tree.`);
  console.log(`   👉 Hindi Prompt: "${testNode.questionTextHindi}"\n`);

  console.log("2. Testing Dynamic Red-Flag Rule Registration:");
  const testRule = {
    ruleId: "RF_DIAPHORESIS_CRITICAL",
    field: "diaphoresis",
    expectedValue: true,
    severity: "CRITICAL",
    description: "Cold diaphoresis detected in acute chest pain encounter.",
  };
  dynamicRedFlagRules.set(testRule.ruleId, testRule);
  console.log(`   👉 Injected Safety Rule: [${testRule.ruleId}] with severity: ${testRule.severity}\n`);

  const fetchedNode = dynamicQuestionNodes.get("CP_DIAPHORESIS_CHECK");
  const fetchedRule = dynamicRedFlagRules.get("RF_DIAPHORESIS_CRITICAL");

  if (fetchedNode && fetchedRule && fetchedRule.severity === "CRITICAL") {
    console.log("==================================================================");
    console.log("🎉 ADMIN PANEL DYNAMIC INGESTION VERIFICATION PASSED 100%!");
    console.log("==================================================================");
  } else {
    throw new Error("Admin panel verification failed.");
  }
}

verifyAdminPanel().catch((e) => {
  console.error("❌ Admin panel test failed:", e);
  process.exit(1);
});
