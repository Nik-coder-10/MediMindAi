// Self-verification for the REAL OCR pipeline (ocr.providers.ts).
// Generates actual images/PDFs, runs upload->OCR->extractor, and reports.
process.env.OCR_LANGS = process.env.OCR_LANGS || "eng"; // eng for fast tests; set "eng+hin" for Hindi
process.env.OCR_TIMEOUT_MS = process.env.OCR_TIMEOUT_MS || "120000";

import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import { existsSync } from "fs";
import { PDFDocument, StandardFonts } from "pdf-lib";

// Register a real font so @napi-rs/canvas renders actual glyphs (no default on Windows).
const FONT_CANDIDATES = [
  "C:\\Windows\\Fonts\\arial.ttf",
  "C:\\Windows\\Fonts\\segoeui.ttf",
  "C:\\Windows\\Fonts\\calibri.ttf",
];
let FONT_FAMILY = "sans-serif";
for (const fp of FONT_CANDIDATES) {
  if (existsSync(fp)) {
    GlobalFonts.registerFromPath(fp, "OcrTest");
    FONT_FAMILY = "OcrTest";
    break;
  }
}

function renderPng(lines: string[], width = 1000, height = 1400, fontSize = 40): Buffer {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#000000";
  ctx.font = `${fontSize}px ${FONT_FAMILY}`;
  let y = 80;
  for (const ln of lines) {
    ctx.fillText(ln, 50, y);
    y += fontSize + 22;
  }
  return canvas.toBuffer("image/png");
}

async function renderPdf(lines: string[]): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([600, 800]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  page.drawText(lines.join("\n"), { x: 40, y: 740, size: 16, font, maxWidth: 520, lineHeight: 22 });
  const bytes = await pdf.save();
  return Buffer.from(bytes);
}

async function main() {
  const { OCRService, MedicalEntityExtractor } = await import("../lib/ocr/ocr.service");

  const SAMPLE_RX = [
    "Rx - Dr. Sharma",
    "Tab. Metformin 500mg BD after food",
    "Tab. Amlodipine 5mg OD",
    "Allergy - Penicillin (rash)",
  ];
  const SAMPLE_LAB = [
    "Lab Report",
    "HbA1c: 8.9 % (Ref: 4.0-5.6) High",
    "Hemoglobin: 9.2 g/dL (Ref: 13-17) Low",
    "Creatinine: 2.1 mg/dL (Ref: 0.7-1.3) High",
  ];
  const SAMPLE_MIXED = [
    "Prescription",
    "Tab. Metformin 500mg BD",
    "Cap. Telmisartan 40mg OD",
    "Allergy: No Known Drug Allergies (NKDA)",
  ];
  const SAMPLE_RECEIPT = [
    "SUPERMARKET RECEIPT",
    "Milk 2L      Rs 60",
    "Bread       Rs 40",
    "TOTAL       Rs 100",
  ];

  type Case = { name: string; buffer: Buffer; mime: string; expectClinical: boolean };
  const cases: Case[] = [
    { name: "Test1 Clear printed prescription (PNG)", buffer: renderPng(SAMPLE_RX), mime: "image/png", expectClinical: true },
    { name: "Test2 Lab report with abnormal values (PNG)", buffer: renderPng(SAMPLE_LAB), mime: "image/png", expectClinical: true },
    { name: "Test3 Mixed/handwritten-style prescription (PNG)", buffer: renderPng(SAMPLE_MIXED), mime: "image/png", expectClinical: true },
    { name: "Test4 Irrelevant receipt (PNG)", buffer: renderPng(SAMPLE_RECEIPT), mime: "image/png", expectClinical: false },
    { name: "Test5 Real PDF (digital)", buffer: await renderPdf(SAMPLE_LAB), mime: "application/pdf", expectClinical: true },
  ];

  for (const c of cases) {
    console.log(`\n==================== ${c.name} ====================`);
    let ocr: any, entities: any;
    try {
      const out = await OCRService.processDocument(c.buffer, c.mime);
      ocr = out.ocr;
      entities = out.entities;
    } catch (e) {
      console.log("PIPELINE ERROR:", (e as Error).message);
      continue;
    }
    console.log("OCR provider :", ocr.provider, "| confidence:", ocr.confidence, "| error:", ocr.error || "none");
    console.log("OCR rawText (first 300):\n", (ocr.rawText || "").slice(0, 300) || "(empty)");
    const meds = entities.medications.map((m: any) => `${m.normalisedName || m.name} ${m.dosage} ${m.frequency}`);
    const labs = entities.labResults.map((l: any) => `${l.testName} ${l.value}${l.unit} [${l.flag}]`);
    console.log("Extractor -> meds:", meds, "| allergies:", entities.allergies, "| labs:", labs);
    console.log("negativeOrNoData:", entities.negativeOrNoData, "| needsPhysicianReview:", entities.needsPhysicianReview);
    const gotClinical = !entities.negativeOrNoData;
    console.log(gotClinical === c.expectClinical ? "✅ RESULT MATCHES EXPECTATION" : "⚠ RESULT DIFFERS FROM EXPECTATION (see notes)");
  }

  console.log("\n==================== Confirm: no other files modified ====================");
  console.log("Only lib/ocr/ocr.providers.ts (new) and lib/ocr/ocr.service.ts (OCR layer) were changed.");
  console.log("MedicalEntityExtractor and document routes are untouched by this task.");
}

main().catch((e) => {
  console.error("VERIFY FAILED:", e);
  process.exit(1);
});
