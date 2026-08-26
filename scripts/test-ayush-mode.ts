import { AyurvedaAssessmentService } from "../lib/services/ayurveda.service";

async function verifyAyushMode() {
  console.log("==================================================================");
  console.log("🌿 VERIFYING AYUSH / AYURVEDA CLINICAL MODE & DASHAVIDHA PARIKSHA");
  console.log("==================================================================\n");

  const sessionId = `test-ayu-session-${Date.now()}`;

  console.log(`1. Ingesting Dashavidha Pariksha Data for Session: ${sessionId}`);
  const assessment = await AyurvedaAssessmentService.recordAssessment({
    sessionId,
    prakriti: "VATA_KAPHA",
    vikriti: "VATA_PITTA",
    agni: "VISHAMA",
    koshtha: "KRURA",
    sattva: "MADHYAMA",
    bala: "MADHYAMA",
    nidra: "Alpa Nidra (Interrupted sleep)",
    notes: "Saama Vata-Kaphaja Lakshana present in bilateral knee joints.",
  });

  console.log(`   👉 Assessment Created: ID = ${assessment.id}`);
  console.log(`   👉 Prakriti: ${assessment.prakriti} | Vikriti: ${assessment.vikriti}`);
  console.log(`   👉 Agni: ${(assessment as any).anala || (assessment as any).ashtavidhaData?.agni}\n`);

  console.log("2. Generating Formatted Ayurvedic Clinical Summary Block:");
  const ayushMarkdown = AyurvedaAssessmentService.generateAyushMarkdownBlock(assessment);
  console.log(ayushMarkdown);

  if (assessment.prakriti === "VATA_KAPHA" && ayushMarkdown.includes("Dashavidha Pariksha")) {
    console.log("\n==================================================================");
    console.log("🎉 AYUSH / AYURVEDA CLINICAL MODE VERIFICATION PASSED 100%!");
    console.log("==================================================================");
  } else {
    throw new Error("AYUSH mode verification failed.");
  }
}

verifyAyushMode().catch((e) => {
  console.error("❌ Verification failed:", e);
  process.exit(1);
});
