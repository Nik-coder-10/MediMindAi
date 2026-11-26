import { readFileSync } from "node:fs";
import { createCanvas } from "@napi-rs/canvas";
const base = "https://medi-mind-ai-eight.vercel.app";
const h = { "x-user-id": "pat-104-demo", "Content-Type": "application/json" };
async function upload(bytes, name, mime, complaint) {
  const sid = (await (await fetch(base + "/api/patient/session/start", { method: "POST", headers: h, body: JSON.stringify({ chiefComplaint: complaint, language: "hi", intakeMode: "AYURVEDA" }) })).json()).data.sessionId;
  const form = new FormData();
  form.append("file", new Blob([bytes], { type: mime }), name);
  form.append("sessionId", sid);
  form.append("type", "PRESCRIPTION");
  const t = Date.now();
  const uj = await (await fetch(base + "/api/patient/documents/upload", { method: "POST", headers: { "x-user-id": "pat-104-demo" }, body: form })).json();
  console.log(name, "ms:", Date.now() - t, "provider:", uj.data?.ocr?.provider, "len:", uj.data?.ocr?.rawText?.length || 0, "meds:", uj.data?.entities?.medications?.length, "labs:", uj.data?.entities?.labResults?.length, "error:", uj.data?.ocr?.error);
  return sid;
}
const canvas = createCanvas(1000, 400);
const ctx = canvas.getContext("2d");
ctx.fillStyle = "white"; ctx.fillRect(0, 0, 1000, 400);
ctx.fillStyle = "black"; ctx.font = "28px sans-serif";
ctx.fillText("Tab Metformin 500mg 1-0-1 after food", 30, 80);
ctx.fillText("HbA1c: 6.8 % (ref: 4.0-6.0) [HIGH]", 30, 150);
await upload(canvas.toBuffer("image/png"), "rx.png", "image/png", "Image OCR check");
await upload(readFileSync("C:/Users/Hp/AppData/Local/Temp/opencode/user-report.pdf"), "medical_report.pdf", "application/pdf", "Scanned PDF final check");
