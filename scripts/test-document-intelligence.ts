import fs from "fs";
import path from "path";
import { OCRService } from "../lib/ocr/ocr.service";

async function verifyDocumentIntelligence() {
  console.log("==================================================================");
  console.log("📄 VERIFYING MEDICAL DOCUMENT INTELLIGENCE & OCR EXTRACTION");
  console.log("==================================================================\n");

  const samplePath = path.join(process.cwd(), "public", "sample-documents", "sample_prescription_aiia.txt");
  console.log(`1. Reading Sample AIIA Prescription: ${samplePath}`);
  const sampleContent = fs.readFileSync(samplePath, "utf-8");
  const fileBuffer = Buffer.from(sampleContent);

  console.log("2. Running OCR & Medical Entity Extraction Pipeline...");
  const { ocr, entities } = await OCRService.processDocument(fileBuffer, "text/plain");

  console.log(`   👉 Raw OCR Text Extracted (${ocr.rawText.length} characters)`);
  console.log(`   👉 OCR Confidence: ${(ocr.confidence * 100).toFixed(1)}%\n`);

  console.log("3. Extracted Medications:");
  entities.medications.forEach((m, idx) => {
    console.log(`   ${idx + 1}. [${m.name}] Dose: ${m.dosage} | Freq: ${m.frequency} | Duration: ${m.duration}`);
  });

  console.log("\n4. Extracted Lab Investigations:");
  entities.labResults.forEach((lab, idx) => {
    console.log(`   ${idx + 1}. [${lab.testName}]: ${lab.value} ${lab.unit} | Flag: ${lab.flag}`);
  });

  console.log("\n5. Extracted Diagnoses & Vitals:");
  console.log(`   Diagnoses: ${entities.diagnoses.join(", ")}`);
  console.log(`   Vitals: ${JSON.stringify(entities.vitals)}`);
  console.log(`   Allergies: ${entities.allergies.join(", ")}`);

  if (entities.medications.length > 0 && entities.labResults.length > 0) {
    console.log("\n==================================================================");
    console.log("🎉 MEDICAL DOCUMENT INTELLIGENCE VERIFICATION PASSED 100%!");
    console.log("==================================================================");
  } else {
    throw new Error("Entity extraction returned incomplete results.");
  }
}

verifyDocumentIntelligence().catch((e) => {
  console.error("❌ Document intelligence verification failed:", e);
  process.exit(1);
});
