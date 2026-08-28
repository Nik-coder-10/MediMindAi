import { prisma } from "../lib/db/prisma";
import { SummaryService } from "../lib/services/summary.service";
import { AyurvedaAssessmentService } from "../lib/services/ayurveda.service";
import { FhirService } from "../lib/fhir/fhir.service";

export async function seedDemoShowcase() {
  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_DEMO_SEED) {
    console.error("❌ CRITICAL SAFETY GUARD: seedDemoShowcase() cannot be executed in production environment.");
    console.error("Set ALLOW_DEMO_SEED=true explicitly if running in isolated staging.");
    process.exit(1);
  }

  console.log("==================================================================");
  console.log("🎭 SEEDING SIH 2026 REALISTIC CLINICAL DEMO SHOWCASE DATASET (DEV ONLY)");
  console.log("==================================================================\n");


  // 1. Showcase Sessions
  const sessions = [
    {
      id: "demo-case-01-emergency",
      patientName: "Ramesh Sharma",
      age: 42,
      gender: "MALE",
      triagePriority: "EMERGENCY",
      complaint: "Severe crushing retrosternal chest pain radiating to left arm",
      redFlag: "RF_ACS_RADIATION (Acute Coronary Syndrome Suspected)",
    },
    {
      id: "demo-case-02-ayush",
      patientName: "Sunita Devi",
      age: 56,
      gender: "FEMALE",
      triagePriority: "ROUTINE",
      complaint: "Bilateral knee joint stiffness and morning swelling (Amavata)",
      prakriti: "VATA_KAPHA",
      agni: "VISHAMA",
    },
    {
      id: "demo-case-03-routine",
      patientName: "Anil Kumar",
      age: 68,
      gender: "MALE",
      triagePriority: "ROUTINE",
      complaint: "Post-prandial heartburn and acid reflux (Amlapitta)",
    },
  ];

  console.log("1. Pre-generating AI Clinical Summaries & AYUSH Dashavidha Assessments:");
  for (const s of sessions) {
    const summary = await SummaryService.generateSummary({ sessionId: s.id });
    console.log(`   👉 Generated Summary for: [${s.id}] (Status: ${summary.status})`);

    if (s.prakriti) {
      const assessment = await AyurvedaAssessmentService.recordAssessment({
        sessionId: s.id,
        prakriti: s.prakriti as any,
        agni: s.agni as any,
        koshtha: "KRURA",
        sattva: "MADHYAMA",
        bala: "MADHYAMA",
      });
      console.log(`   👉 Created Dashavidha Pariksha for: [${s.id}] (Prakriti: ${assessment.prakriti})`);
    }
  }

  console.log("\n==================================================================");
  console.log("🎉 REALISTIC DEMO SHOWCASE DATASET SEEDED 100% SUCCESSFULLY!");
  console.log("==================================================================");
}

seedDemoShowcase().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});
