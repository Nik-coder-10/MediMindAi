export interface OCRResult {
  rawText: string;
  confidence: number;
  detectedLanguage?: string;
  pageCount?: number;
  /** Provider that produced the result (tesseract.js | pdfjs-dist | azure-document-intelligence | text-decode | none). */
  provider?: string;
  /** Pages actually processed (PDFs limited to first N). */
  pagesProcessed?: number;
  /** Optional layout hints (e.g. lines with bounding boxes) for layout-aware parsing. */
  layoutHints?: { lines?: Array<{ text: string; bbox?: unknown }> };
  /** Set when OCR failed and no text could be read. rawText will be empty. */
  error?: string;
}

export interface ExtractedMedication {
  name: string;
  normalisedName?: string;
  dosage: string;
  frequency: string; // "1-0-1", "OD", "BD", "TDS", "SOS"
  duration: string;
  route?: string; // "Oral", "Topical", "Nasal"
  instructions?: string;
  confidence?: number;
  sourceText?: string;
  priority?: ClinicalPriority;
  needsReview?: boolean;
}

export interface ExtractedLabResult {
  testName: string;
  normalisedName?: string;
  value: number | string;
  unit: string;
  referenceRange: string;
  flag: "NORMAL" | "HIGH" | "LOW" | "ABNORMAL" | "CRITICAL";
  confidence?: number;
  sourceText?: string;
  priority?: ClinicalPriority;
  needsReview?: boolean;
}

export type EntityCategory =
  | "MEDICATION"
  | "LAB"
  | "DIAGNOSIS"
  | "PROCEDURE"
  | "ALLERGY"
  | "VITAL"
  | "PAST_HISTORY";

export type ClinicalPriority = "SAFETY_CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

/**
 * Canonical, storage-ready clinical entity.
 * Every item carries the four mandated fields:
 *  - normalisedValue   (cleaned, canonical representation)
 *  - rawText           (original OCR source snippet)
 *  - confidence        (0-1)
 *  - documentReference (document id; "preview" before persistence)
 */
export interface ClinicalEntity {
  category: EntityCategory;
  normalisedValue: string;
  rawText: string;
  confidence: number;
  priority: ClinicalPriority;
  documentReference: string;
  needsReview: boolean;
  structuredData: Record<string, unknown>;
}

export interface ExtractedEntitiesResult {
  documentType?: "PRESCRIPTION" | "LAB_REPORT" | "DISCHARGE_SUMMARY" | "INVESTIGATION" | "OTHER";
  medications: ExtractedMedication[];
  diagnoses: string[];
  labResults: ExtractedLabResult[];
  vitals: Record<string, string>;
  procedures: string[];
  allergies: string[];

  // ---- Enriched, precision-first outputs (new, optional for backward-compat) ----
  /** Canonical list of every extracted, deduplicated clinical entity. */
  structured?: ClinicalEntity[];
  /** Subset of structured entities flagged safety-critical. */
  safetyCritical?: ClinicalEntity[];
  /** Subset of structured entities with low confidence (physician review). */
  lowConfidenceFlags?: ClinicalEntity[];
  /** Resolved document date + source (HIGH priority metadata). */
  documentDate?: { iso?: string; raw: string; confidence: number; needsReview: boolean };
  documentSource?: { prescriber?: string; facility?: string; raw: string };
  /** True when the pipeline genuinely found nothing (no invention). */
  negativeOrNoData?: boolean;
  /** True when any extraction needs physician review. */
  needsPhysicianReview?: boolean;
  /** Lines that could not be reliably parsed (flagged for review). */
  unclearText?: string[];
  clinicalSummaryText?: string;
}

export interface OCRProvider {
  extractText(fileBuffer: Buffer, mimeType: string): Promise<OCRResult>;
}

// Real, production-ready OCR pipeline lives in ./ocr.providers.ts
// (Tesseract.js for images, pdfjs-dist for PDFs, Azure Document Intelligence swap point).
// The previous demo/placeholder AIIA record has been removed — the provider never
// fabricates clinical text and returns an empty rawText with an `error` flag on failure.
import { IntelligentDocumentOCRProvider } from "./ocr.providers";
export { IntelligentDocumentOCRProvider };

/* ============================================================================
 *  NORMALISATION DICTIONARIES
 * ==========================================================================*/
const BRAND_TO_GENERIC: Record<string, string> = {
  glucophage: "Metformin",
  glycomet: "Metformin",
  janumet: "Metformin + Sitagliptin",
  amlogard: "Amlodipine",
  norvasc: "Amlodipine",
  amlip: "Amlodipine",
  crocin: "Paracetamol",
  dolo: "Paracetamol",
  calpol: "Paracetamol",
  acetaminophen: "Paracetamol",
  omez: "Omeprazole",
  omee: "Omeprazole",
  pan: "Pantoprazole",
  pantodac: "Pantoprazole",
  ecosprin: "Aspirin",
  aspirine: "Aspirin",
  atorva: "Atorvastatin",
  lipitor: "Atorvastatin",
  thyronorm: "Levothyroxine",
  eltroxin: "Levothyroxine",
  novastat: "Rosuvastatin",
  rosuvas: "Rosuvastatin",
  augmentin: "Amoxicillin + Clavulanate",
  amoxil: "Amoxicillin",
  zifi: "Cefixime",
  allegra: "Fexofenadine",
  levocet: "Levocetirizine",
  insulin: "Insulin",
};

const FREQUENCY_PATTERNS: Array<{ re: RegExp; std: string }> = [
  { re: /\b(\d-\d-\d)(?:-\d)?\b/, std: "" }, // handled by map below
  { re: /\bbid\b/i, std: "Twice daily (BD)" },
  { re: /\bqd\b/i, std: "Once daily (OD)" },
  { re: /\bbd\b/i, std: "Twice daily (BD)" },
  { re: /\bod\b|\bom\b/i, std: "Once daily (OD)" },
  { re: /\btds\b|\btid\b/i, std: "Thrice daily (TDS)" },
  { re: /\bqid\b/i, std: "4 times daily (QID)" },
  { re: /\bsos\b/i, std: "As needed (SOS)" },
  { re: /\btwice daily\b/i, std: "Twice daily" },
  { re: /\bonce daily\b/i, std: "Once daily" },
  { re: /\bthrice daily\b/i, std: "Thrice daily" },
  { re: /\bweekly\b/i, std: "Weekly" },
  { re: /\bdaily\b/i, std: "Once daily (OD)" },
];

const FREQUENCY_CODE_MAP: Record<string, string> = {
  "1-0-1": "Twice daily (1-0-1)",
  "1-0-0": "Once daily (1-0-0)",
  "0-0-1": "Once nightly (0-0-1)",
  "0-1-0": "Once midday (0-1-0)",
  "1-1-1": "Thrice daily (1-1-1)",
  "2-2-2": "Thrice daily (2-2-2)",
  "1-1-0": "Twice daily (1-1-0)",
};

const ROUTE_PATTERNS: Array<{ re: RegExp; route: string }> = [
  { re: /\b(after food|after meals|post food|with food|प्रसाद)\b/i, route: "Oral (after food)" },
  { re: /\b(before food|before meals|empty stomach|खाली पेट)\b/i, route: "Oral (empty stomach)" },
  { re: /\b(at bedtime|at night|bed time|night)\b/i, route: "Oral (at bedtime)" },
  { re: /\b(with lukewarm water|with warm water|lukewarm water)\b/i, route: "Oral (with lukewarm water)" },
  { re: /\b(topical|apply|बाह्य)\b/i, route: "Topical" },
  { re: /\b(inhal|inhalation|nebul)\b/i, route: "Inhalation" },
  { re: /\b(intravenous|\bIV\b)\b/i, route: "Intravenous" },
  { re: /\b(intramuscular|\bIM\b)\b/i, route: "Intramuscular" },
  { re: /\b(subcut|\bSC\b|subcutaneous)\b/i, route: "Subcutaneous" },
];

const CHRONIC_KEYWORDS =
  /(diabet|htn|hypertens|ckd|chronic kidney|copd|asthma|thyroid|ihd|cad|coronary|stroke|malignan|cancer|carcinoma|tuberculosis|tb\b|epilep|cardiac|renal|liver cirrho|cirrhosis|hiv|chronic|chronic kidney disease|af\b|atrial fibrill)/i;

const DEVANAGARI = /[\u0900-\u097F]/;

/* ============================================================================
 *  LOW-LEVEL PARSING HELPERS
 * ==========================================================================*/
function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function detectRoute(line: string): { route?: string; instructions?: string } {
  for (const p of ROUTE_PATTERNS) {
    if (p.re.test(line)) {
      const instructions = line.match(p.re)?.[0]?.trim();
      return { route: p.route, instructions };
    }
  }
  return {};
}

function standardiseFrequency(line: string): string {
  const codeMatch = line.match(/\b(\d-\d-\d)(?:-\d)?\b/);
  if (codeMatch && FREQUENCY_CODE_MAP[codeMatch[1]]) {
    return FREQUENCY_CODE_MAP[codeMatch[1]];
  }
  for (const p of FREQUENCY_PATTERNS) {
    if (p.re.test(line) && p.std) return p.std;
  }
  return "As directed";
}

function normaliseDrugName(raw: string): string {
  const lower = raw.trim().toLowerCase();
  if (BRAND_TO_GENERIC[lower]) return BRAND_TO_GENERIC[lower];
  // partial brand match (e.g., "Glycomet GP")
  for (const brand of Object.keys(BRAND_TO_GENERIC)) {
    if (lower.startsWith(brand)) return BRAND_TO_GENERIC[brand];
  }
  return titleCase(raw.trim());
}

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

function parseDate(raw: string): { iso?: string; raw: string; confidence: number; needsReview: boolean } | null {
  const text = raw.trim();
  // DD-Mon-YYYY or DD Mon YYYY
  let m = text.match(/(\d{1,2})[- ]?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?[- ]?(\d{4})/i);
  if (m) {
    const d = +m[1];
    const mo = MONTHS[m[2].toLowerCase().slice(0, 3)];
    const y = +m[3];
    if (d >= 1 && d <= 31 && mo >= 0 && mo <= 11) {
      return { iso: `${y}-${pad2(mo + 1)}-${pad2(d)}`, raw: text, confidence: 0.96, needsReview: false };
    }
  }
  // Month DD YYYY / Month DD, YYYY
  m = text.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})/i);
  if (m) {
    const mo = MONTHS[m[1].toLowerCase().slice(0, 3)];
    const d = +m[2];
    const y = +m[3];
    if (d >= 1 && d <= 31) {
      return { iso: `${y}-${pad2(mo + 1)}-${pad2(d)}`, raw: text, confidence: 0.95, needsReview: false };
    }
  }
  // DD/MM/YYYY or DD-MM-YYYY (ambiguous day/month — Indian context assumed)
  m = text.match(/\b(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})\b/);
  if (m) {
    let dd = +m[1];
    let mm = +m[2];
    let yy = +m[3];
    if (yy < 100) yy += 2000;
    if (dd <= 31 && mm <= 12 && yy > 1900 && yy < 2100) {
      // If first number looks like a month (e.g. 03/11) and second >12, swap
      if (dd > 12 && mm <= 12) {
        // dd is actually month? No: dd>12 means dd cannot be month, so dd=day, mm=month ok
      }
      const iso = `${yy}-${pad2(mm)}-${pad2(dd)}`;
      return { iso, raw: text, confidence: 0.78, needsReview: true };
    }
  }
  // YYYY-MM-DD
  m = text.match(/\b(\d{4})[/\-](\d{1,2})[/\-](\d{1,2})\b/);
  if (m) {
    const y = +m[1];
    const mo = +m[2];
    const d = +m[3];
    if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) {
      return { iso: `${y}-${pad2(mo)}-${pad2(d)}`, raw: text, confidence: 0.95, needsReview: false };
    }
  }
  return null;
}

function isAdministrativeNoise(line: string): boolean {
  return /\b(invoice|bill no|receipt|total amount|gst|registration no|registration number|uhid|mrd no|mrd number|file no|file number|page\s*\d|www\.|email|phone|mobile|consent|signature of patient|authorised signatory)\b/i.test(
    line
  ) || /(₹|rs\.?\s*\d|inr\s*\d)/i.test(line);
}

/* ============================================================================
 *  PRECISION-FIRST MEDICAL ENTITY EXTRACTOR
 *  Design principles:
 *   - Precision over recall. Never fabricate data when nothing matches.
 *   - Each extraction carries normalised value, source snippet, confidence, priority.
 *   - Low-confidence / unparseable lines are flagged, never invented.
 * ==========================================================================*/
export class MedicalEntityExtractor {
  /**
   * Main entry point. Pure function — does not touch the database.
   */
  static extractEntities(rawText: string): ExtractedEntitiesResult {
    const structured: ClinicalEntity[] = [];

    const meds: ExtractedMedication[] = [];
    const labs: ExtractedLabResult[] = [];
    const diagnoses: string[] = [];
    const diagnosisDetails: Array<{ text: string; chronic: boolean; confidence: number; sourceText: string; priority: ClinicalPriority; needsReview: boolean; onsetYear?: string }> = [];
    const vitals: Record<string, string> = {};
    const procedures: string[] = [];
    const procedureDetails: Array<{ name: string; dateISO?: string; rawDate?: string; confidence: number; sourceText: string; priority: ClinicalPriority; needsReview: boolean }> = [];
    const allergies: string[] = [];
    const allergyDetails: Array<{ substance: string; reaction?: string; isNegative: boolean; confidence: number; sourceText: string; priority: ClinicalPriority; needsReview: boolean }> = [];
    const unclearText: string[] = [];

    let documentDate: ExtractedEntitiesResult["documentDate"];
    const documentSource: ExtractedEntitiesResult["documentSource"] = { raw: "" };

    const lines = (rawText || "")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    for (const line of lines) {
      if (isAdministrativeNoise(line)) continue;

      // ---- Prescriber / facility source (HIGH metadata) ----
      const prescriberMatch = line.match(/\bdr\.?\s+([a-z][a-z.'-]*(?:\s+[a-z][a-z.'-]*){0,2})/i);
      if (prescriberMatch && !/allerg|diagnosis|procedure|hba1c|creatinine/i.test(line)) {
        documentSource.prescriber = titleCase(prescriberMatch[1]);
      }
      if (/all india institute|aiia|hospital|medical college|clinic|स्वास्थ्य|अस्पताल/i.test(line) && line.length < 80) {
        documentSource.facility = line;
      }

      // ---- Allergies (safety-critical, prefer precision) ----
      const allergyMatch = line.match(/allerg(?:y|ies|y)\s*[:\-–]\s*(.+)/i);
      if (allergyMatch) {
        const rest = allergyMatch[1].trim();
        if (/(nkda|no known drug allerg|no known allerg|nil allerg|none known)/i.test(rest)) {
          const e: ClinicalEntity = {
            category: "ALLERGY",
            normalisedValue: "No Known Drug Allergy (NKDA)",
            rawText: line,
            confidence: 0.95,
            priority: "SAFETY_CRITICAL",
            documentReference: "preview",
            needsReview: false,
            structuredData: { isNegative: true },
          };
          structured.push(e);
          allergyDetails.push({
            substance: "NKDA",
            isNegative: true,
            confidence: 0.95,
            sourceText: line,
            priority: "SAFETY_CRITICAL",
            needsReview: false,
          });
          allergies.push("NKDA (No Known Drug Allergy)");
        } else {
          const reactionMatch = rest.match(/\(([^)]+)\)/);
          const substance = rest.replace(/\([^)]*\)/, "").replace(/[-–]/g, " ").trim();
          const reaction = reactionMatch ? reactionMatch[1].trim() : undefined;
          const e: ClinicalEntity = {
            category: "ALLERGY",
            normalisedValue: substance,
            rawText: line,
            confidence: 0.93,
            priority: "SAFETY_CRITICAL",
            documentReference: "preview",
            needsReview: false,
            structuredData: { reaction },
          };
          structured.push(e);
          allergyDetails.push({
            substance,
            reaction,
            isNegative: false,
            confidence: 0.93,
            sourceText: line,
            priority: "SAFETY_CRITICAL",
            needsReview: false,
          });
          allergies.push(reaction ? `${substance} (${reaction})` : substance);
        }
        continue;
      }

      // ---- Diagnoses & Past history ----
      const diagMatch = line.match(/^(diagnosis|diagnoses|assessment|impression|provisional diagnosis|clinical impression|comorbidit|secondary diagnosis)\s*[:\-–]\s*(.+)/i);
      const pastMatch = line.match(/^(past|past medical|past surgical|medical|surgical)?\s*history\s*[:\-–]\s*(.+)/i);
      if (diagMatch) {
        const part = diagMatch[2];
        const items = part.split(/[,;&]|\band\b/i).map((d) => d.trim()).filter((d) => d.length > 2);
        for (const it of items) {
          const chronic = CHRONIC_KEYWORDS.test(it);
          diagnoses.push(it);
          diagnosisDetails.push({
            text: it,
            chronic,
            confidence: 0.9,
            sourceText: line,
            priority: chronic ? "SAFETY_CRITICAL" : "HIGH",
            needsReview: DEVANAGARI.test(line),
          });
          structured.push({
            category: "DIAGNOSIS",
            normalisedValue: it,
            rawText: line,
            confidence: 0.9,
            priority: chronic ? "SAFETY_CRITICAL" : "HIGH",
            documentReference: "preview",
            needsReview: DEVANAGARI.test(line),
            structuredData: { chronic },
          });
        }
        continue;
      }
      if (pastMatch) {
        const part = pastMatch[2];
        const onsetMatch = part.match(/since\s+(\d{4})/i);
        const items = part.replace(/since\s+\d{4}/i, "").split(/[,;&]|\band\b/i).map((d) => d.trim()).filter((d) => d.length > 2);
        for (const it of items) {
          const chronic = CHRONIC_KEYWORDS.test(it);
          diagnoses.push(it);
          diagnosisDetails.push({
            text: it,
            chronic,
            confidence: 0.88,
            sourceText: line,
            priority: chronic ? "SAFETY_CRITICAL" : "HIGH",
            needsReview: DEVANAGARI.test(line),
            onsetYear: onsetMatch ? onsetMatch[1] : undefined,
          });
          structured.push({
            category: "PAST_HISTORY",
            normalisedValue: it,
            rawText: line,
            confidence: 0.88,
            priority: chronic ? "SAFETY_CRITICAL" : "HIGH",
            documentReference: "preview",
            needsReview: DEVANAGARI.test(line),
            structuredData: { chronic, onsetYear: onsetMatch ? onsetMatch[1] : undefined },
          });
        }
        continue;
      }

      // ---- Procedures ----
      const procMatch = line.match(/(procedure|surgery|operation|intervention|operative)\s*[:\-–]\s*(.+)/i);
      if (procMatch || /\b(ectomy|plasty|ostomy|replacement|angioplasty|biopsy|drainage|repair)\b/i.test(line)) {
        const part = procMatch ? procMatch[2] : line;
        const dateInLine = parseDate(part);
        const name = part.replace(/\bon\s+\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}/i, "").replace(/\d{1,2}[- ](jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4}/i, "").replace(/\bon\s+\d{4}-\d{2}-\d{2}/i, "").trim();
        procedures.push(name);
        procedureDetails.push({
          name,
          dateISO: dateInLine?.iso,
          rawDate: dateInLine?.raw,
          confidence: dateInLine ? 0.9 : 0.85,
          sourceText: line,
          priority: "HIGH",
          needsReview: !!dateInLine?.needsReview,
        });
        structured.push({
          category: "PROCEDURE",
          normalisedValue: name,
          rawText: line,
          confidence: dateInLine ? 0.9 : 0.85,
          priority: "HIGH",
          documentReference: "preview",
          needsReview: !!dateInLine?.needsReview,
          structuredData: { dateISO: dateInLine?.iso, rawDate: dateInLine?.raw },
        });
        continue;
      }

      // ---- Vitals ----
      const vitalDefs: Array<{ re: RegExp; key: string; unit: string }> = [
        { re: /blood pressure|bp\s*:/i, key: "Blood Pressure", unit: "mmHg" },
        { re: /pulse|heart rate\s*:/i, key: "Pulse", unit: "bpm" },
        { re: /weight|wt\s*:/i, key: "Weight", unit: "kg" },
        { re: /spo2|oxygen saturation\s*:/i, key: "SpO2", unit: "%" },
        { re: /temperature|temp\s*:/i, key: "Temperature", unit: "°C" },
        { re: /respiratory rate|rr\s*:/i, key: "Respiratory Rate", unit: "/min" },
      ];
      let isVital = false;
      for (const v of vitalDefs) {
        if (v.re.test(line)) {
          const val = line.split(/:\s*/)[1] || line.match(/\d{2,3}\/\d{2,3}/)?.[0] || line.match(/\d{2,3}\s*(?:bpm|kg|%|°c|\/min)/i)?.[0] || "";
          if (val) {
            vitals[v.key] = val.trim();
            structured.push({
              category: "VITAL",
              normalisedValue: `${v.key}: ${val.trim()}`,
              rawText: line,
              confidence: 0.9,
              priority: "MEDIUM",
              documentReference: "preview",
              needsReview: DEVANAGARI.test(line),
              structuredData: { vital: v.key, value: val.trim(), unit: v.unit },
            });
            isVital = true;
          }
          break;
        }
      }
      if (isVital) continue;

      // ---- Lab investigations ----
      const labLine =
        (line.includes(":") || line.includes("-") || line.includes("|")) &&
        (/\b(hba1c|glucose|sugar|creatinine|urea|uric acid|hemoglobin|hb\b|esr|platelet|wbc|rbc|tsh|t3|t4|chol|trigly|sodium|potassium|calcium|bilirubin|sgpt|sgot|alt|ast|crp|ldl|hdl|inr|pth|vit d|vitamin d|ferritin|trop|d-dimer|ldh|amylase|lipase|pt\b|aptt|ref\s*:)/i.test(line) ||
          /\(ref\s*:/i.test(line) ||
          /\[(high|low|critical|abnormal)\]/i.test(line));
      if (labLine) {
        const parsed = this.parseLabLine(line);
        if (parsed) {
          labs.push(parsed.medLab);
          structured.push(parsed.entity);
          continue;
        }
      }

      // ---- Medications ----
      const isMedicationLine =
        /^\d+[\.\)]\s*/.test(line) ||
        /\b(tab\.?|tablet|cap\.?|capsule|syp\.?|syrup|vati|guggulu|kwatha|taila|choorna|arishta|asava|churna|ras|lauh|bhasma|pishti|ghrita|kashaya|decoction)\b/i.test(line) ||
        /\b(metformin|amlodipine|paracetamol|omeprazole|pantoprazole|atorvastatin|rosuvastatin|amlodipine|telmisartan|losartan|insulin|amoxicillin|cefixime|azithromycin|levocetirizine|fexofenadine|warfarin|acenocoumarol|prednisolone|dexamethasone|aspirin|clopidogrel|ranitidine|ondansetron|metoprolol|bisoprolol|enalapril|lisinopril|thyroxine|levothyroxine|phenytoin|carbamazepine|phenobarbitone|salbutamol|budesonide)\b/i.test(line);
      if (isMedicationLine) {
        const med = this.parseMedicationLine(line);
        if (med) {
          meds.push(med.med);
          structured.push(med.entity);
          continue;
        }
      }

      // ---- Standalone document date ("Date: 15-Jan-2026") ----
      if (/^date\s*[:\-–]/i.test(line) || /^\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}$/.test(line) || /^\d{1,2}[- ](jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4}$/i.test(line)) {
        const dateStr = line.replace(/^date\s*[:\-–]\s*/i, "").trim();
        const pd = parseDate(dateStr);
        if (pd) {
          documentDate = pd;
          continue;
        }
      }

      // ---- Unparseable but possibly clinical (e.g. Hindi) → flag, never invent ----
      if (/^\s*dr\.?/i.test(line)) continue; // signature line, already captured as source
      if (/all india institute|aiia|hospital|medical college|clinic|स्वास्थ्य|अस्पताल/i.test(line) && line.length < 80) continue; // facility header
      if (DEVANAGARI.test(line) || line.length > 12) {
        unclearText.push(line);
      }
    }

    // ---- Deduplicate structured entities (by category + normalised value) ----
    const deduped = dedupeEntities(structured);

    // ---- Resolve document date if still missing (any leftover date) ----
    if (!documentDate) {
      for (const line of lines) {
        const pd = parseDate(line);
        if (pd && !/procedure|since|history/i.test(line)) {
          documentDate = pd;
          break;
        }
      }
    }

    const safetyCritical = deduped.filter((e) => e.priority === "SAFETY_CRITICAL");
    const lowConfidenceFlags = deduped.filter((e) => e.needsReview || e.confidence < 0.75);

    const documentType: ExtractedEntitiesResult["documentType"] = (() => {
      if (labs.length > 0 && labs.length >= meds.length && procedureDetails.length === 0) return "LAB_REPORT";
      if (procedureDetails.length > 0 || diagnosisDetails.length > 0) return "DISCHARGE_SUMMARY";
      if (meds.length > 0) return "PRESCRIPTION";
      if (labs.length > 0) return "LAB_REPORT";
      return "OTHER";
    })();

    const medSummary = meds.map((m) => `${m.normalisedName || m.name} (${m.dosage}, ${m.frequency})`).join("; ");
    const abnormalLabs = labs
      .filter((l) => l.flag !== "NORMAL")
      .map((l) => `${l.testName}: ${l.value}${l.unit} [${l.flag}]`)
      .join(", ");
    const clinicalSummaryText = `Extracted ${meds.length} medication(s) [${medSummary || "none"}], ${labs.length} lab(s) (Abnormal: ${abnormalLabs || "none"}), ${diagnosisDetails.length} diagnosis/es, ${allergyDetails.length} allerg(y/ies), ${procedureDetails.length} procedure(s).${lowConfidenceFlags.length ? ` ${lowConfidenceFlags.length} item(s) need physician review.` : ""}`;

    return {
      documentType,
      medications: meds,
      diagnoses,
      labResults: labs,
      vitals,
      procedures,
      allergies,
      structured: deduped,
      safetyCritical,
      lowConfidenceFlags,
      documentDate,
      documentSource: documentSource.raw || documentSource.prescriber || documentSource.facility ? documentSource : undefined,
      negativeOrNoData: deduped.length === 0,
      needsPhysicianReview: lowConfidenceFlags.length > 0,
      unclearText,
      clinicalSummaryText,
    };
  }

  /**
   * Parse a single lab line into an ExtractedLabResult + ClinicalEntity.
   * Returns null when no reliable value is found (precision over recall).
   */
  static parseLabLine(line: string): { medLab: ExtractedLabResult; entity: ClinicalEntity } | null {
    const parts = line.split(/[:|\t]/).map((p) => p.trim());
    let testName = parts[0]?.replace(/^[-*•\d.]+\s*/, "").replace(/\s+\(.*\)$/, "").trim();
    const rest = parts.slice(1).join(" ") || line;

    const valMatch = rest.match(/([0-9]+\.?[0-9]*)\s*([A-Za-z%\/°µ^\-]*)/);
    if (!valMatch || !testName || testName.length < 2) return null;

    const observedVal = parseFloat(valMatch[1]);
    const unit = valMatch[2] || "";
    const numVal = isNaN(observedVal) ? null : observedVal;

    const refMatch = rest.match(/\(?ref\s*[:\-]?\s*([0-9.]+)\s*[-–to]+\s*([0-9.]+)/i) || rest.match(/\(([0-9.]+)\s*[-–]\s*([0-9.]+)\)/i);
    let referenceRange = "Not specified";
    let lowRef: number | null = null;
    let highRef: number | null = null;
    if (refMatch) {
      lowRef = parseFloat(refMatch[1]);
      highRef = parseFloat(refMatch[2]);
      referenceRange = `${refMatch[1]} – ${refMatch[2]}`;
    }

    // Explicit flag
    const isCritical = /\[critical\]|\bcritical\b/i.test(rest);
    const isHigh = /\[high\]|\bhigh\b|\belevated\b/i.test(rest);
    const isLow = /\[low\]|\blow\b|\bdecreased\b|\breduced\b/i.test(rest);

    let flag: ExtractedLabResult["flag"] = "NORMAL";
    if (isCritical) flag = "CRITICAL";
    else if (isHigh) flag = "HIGH";
    else if (isLow) flag = "LOW";
    else if (numVal !== null && lowRef !== null && highRef !== null) {
      // Derive flag from reference range (no invention — grounded in the document).
      if (numVal > highRef) flag = "HIGH";
      else if (numVal < lowRef) flag = "LOW";
    }

    const confidence = refMatch && (isHigh || isLow || isCritical || flag !== "NORMAL" || numVal !== null) ? 0.95 : numVal !== null ? 0.85 : 0.7;
    const normalisedName = titleCase(testName.replace(/\s+/g, " ").trim());

    const medLab: ExtractedLabResult = {
      testName,
      normalisedName,
      value: isNaN(observedVal) ? valMatch[1] : observedVal,
      unit,
      referenceRange,
      flag,
      confidence,
      sourceText: line,
      priority: flag === "NORMAL" ? "HIGH" : "SAFETY_CRITICAL",
      needsReview: DEVANAGARI.test(line) || confidence < 0.75,
    };

    const entity: ClinicalEntity = {
      category: "LAB",
      normalisedValue: `${normalisedName} ${medLab.value}${unit} [${flag}]`,
      rawText: line,
      confidence,
      priority: medLab.priority!,
      documentReference: "preview",
      needsReview: medLab.needsReview!,
      structuredData: { value: medLab.value, unit, referenceRange, flag },
    };

    return { medLab, entity };
  }

  /**
   * Parse a single medication line. Returns null if no credible drug name.
   */
  static parseMedicationLine(line: string): { med: ExtractedMedication; entity: ClinicalEntity } | null {
    let cleaned = line.replace(/^\d+[\.\)]\s*/, "").trim();

    // Extract dosage (e.g. 500mg, 15ml, 2 tabs, 10mg)
    const doseMatch = cleaned.match(/\b(\d+(?:\.\d+)?\s*(?:mg|mcg|g|gm|ml|IU|units?|tabs?|caps?|tablets?))\b/i);
    const dosage = doseMatch ? doseMatch[1].replace(/\s+/g, " ").trim() : "Not specified";

    const frequency = standardiseFrequency(cleaned);
    const { route, instructions } = detectRoute(cleaned);

    // Extract duration
    const durationMatch = cleaned.match(/\b(\d+\s*(?:days?|weeks?|months?|years?))\b/i);
    const duration = durationMatch ? durationMatch[1] : "As prescribed";

    // Clean the medicine name: strip leading formulation token, dosage, frequency code, route/instructions, duration
    const ROUTE_PHRASES = [
      "after food", "after meals", "post food", "with food",
      "before food", "before meals", "empty stomach",
      "at bedtime", "at night", "bed time", "night",
      "with lukewarm water", "with warm water", "lukewarm water",
      "topical", "apply", "inhal", "inhalation", "nebul",
      "intravenous", "intramuscular", "subcut", "subcutaneous",
    ];
    let name = cleaned;
    name = name.replace(/^(tab\.?|tablet|cap\.?|capsule|syp\.?|syrup|vati|guggulu|kwatha|taila|choorna|arishta|asava|churna|ras|lauh|bhasma|pishti|ghrita|kashaya|decoction)\b\.?\s*/i, "");
    if (doseMatch) {
      name = name.replace(new RegExp(doseMatch[1].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), " ");
    }
    name = name.replace(/\b(\d-\d-\d|\d-\d-\d-\d|OD|BD|TDS|QID|SOS|twice daily|once daily|thrice daily|as directed|weekly|daily|bid|tid|qd|om|प्रसाद|खाली पेट|बाह्य)\b/gi, " ");
    name = name.replace(/\b(\d+\s*(?:days?|weeks?|months?|years?))\b/gi, " ");
    for (const phrase of ROUTE_PHRASES) {
      name = name.replace(new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), " ");
    }
    name = name.replace(/[-–—,]+/g, " ").replace(/\s+/g, " ").trim();
    name = name.replace(/^rx\.?\s*/i, "").trim();

    if (!name || name.length < 2) return null;

    const normalisedName = normaliseDrugName(name);

    // Confidence: precision-first scoring
    let confidence = 0.82;
    if (dosage !== "Not specified") confidence += 0.06;
    if (frequency !== "As directed") confidence += 0.06;
    if (BRAND_TO_GENERIC[name.toLowerCase()] || Object.keys(BRAND_TO_GENERIC).some((b) => name.toLowerCase().startsWith(b))) confidence += 0.04;
    if (DEVANAGARI.test(line)) {
      confidence = 0.55;
    }
    if (line.includes("?") || cleaned.replace(/\s/g, "").length < 6) confidence = Math.min(confidence, 0.5);
    confidence = Math.min(confidence, 0.98);

    const needsReview = confidence < 0.75 || DEVANAGARI.test(line) || line.includes("?");
    const priority: ClinicalPriority = "SAFETY_CRITICAL"; // active medications are safety-critical

    const med: ExtractedMedication = {
      name,
      normalisedName,
      dosage,
      frequency,
      duration,
      route,
      instructions,
      confidence,
      sourceText: line,
      priority,
      needsReview,
    };

    const entity: ClinicalEntity = {
      category: "MEDICATION",
      normalisedValue: `${normalisedName} ${dosage} ${frequency}`,
      rawText: line,
      confidence,
      priority,
      documentReference: "preview",
      needsReview,
      structuredData: { normalisedName, dosage, frequency, duration, route, instructions },
    };

    return { med, entity };
  }

  /**
   * Build prisma.extractedMedicalEntity.createMany payload from a result.
   * Pure (no DB access). Maps each structured entity to the existing schema.
   */
  static toEntityRecords(documentId: string, result: ExtractedEntitiesResult): Array<{
    documentId: string;
    type: string;
    rawText: string;
    structuredData: Record<string, unknown>;
    confidence: number;
    isVerifiedByDoctor: boolean;
  }> {
    const TYPE_MAP: Record<EntityCategory, string> = {
      MEDICATION: "MEDICATION",
      LAB: "LAB",
      DIAGNOSIS: "DIAGNOSIS",
      PROCEDURE: "PROCEDURE",
      ALLERGY: "ALLERGY",
      VITAL: "VITAL",
      PAST_HISTORY: "DIAGNOSIS",
    };
    const structured = result.structured ?? [];
    return structured.map((e) => ({
      documentId,
      type: TYPE_MAP[e.category],
      rawText: e.rawText,
      structuredData: {
        normalisedValue: e.normalisedValue,
        priority: e.priority,
        sourceText: e.rawText,
        needsReview: e.needsReview,
        documentReference: documentId,
        ...e.structuredData,
      },
      confidence: e.confidence,
      isVerifiedByDoctor: false,
    }));
  }

  /**
   * Build prisma.medicalTimelineEvent.createMany payload from a result.
   * Pure (no DB access). Generates timeline events for medications, abnormal
   * labs, diagnoses, past history, and procedures where clinically meaningful.
   */
  static toTimelineEvents(documentId: string, patientId: string, result: ExtractedEntitiesResult): Array<{
    patientId: string;
    sourceDocumentId: string;
    eventDate: Date;
    title: string;
    description: string;
    category: string;
    metadata: Record<string, unknown>;
  }> {
    const docDate = result.documentDate?.iso ? new Date(result.documentDate.iso) : new Date();
    const events: Array<{
      patientId: string;
      sourceDocumentId: string;
      eventDate: Date;
      title: string;
      description: string;
      category: string;
      metadata: Record<string, unknown>;
    }> = [];

    for (const e of result.structured ?? []) {
      if (e.category === "MEDICATION") {
        const sd = e.structuredData;
        events.push({
          patientId,
          sourceDocumentId: documentId,
          eventDate: docDate,
          title: `Started ${sd.normalisedName || e.normalisedValue}`,
          description: `Medication from document: ${sd.normalisedName} ${sd.dosage} ${sd.frequency}${sd.route ? ` (${sd.route})` : ""}. Source: "${e.rawText}".`,
          category: "MEDICATION",
          metadata: { ...sd, needsReview: e.needsReview, confidence: e.confidence },
        });
      } else if (e.category === "LAB" && e.structuredData.flag && e.structuredData.flag !== "NORMAL") {
        events.push({
          patientId,
          sourceDocumentId: documentId,
          eventDate: docDate,
          title: `Abnormal lab: ${e.normalisedValue}`,
          description: `Flagged ${e.structuredData.flag} in document. Source: "${e.rawText}".`,
          category: "LAB",
          metadata: { ...e.structuredData, isAbnormal: true, needsReview: e.needsReview, confidence: e.confidence },
        });
      } else if (e.category === "DIAGNOSIS" || e.category === "PAST_HISTORY") {
        const sd = e.structuredData;
        const onsetYear = sd.onsetYear as string | undefined;
        const eventDate = onsetYear ? new Date(`${onsetYear}-01-01`) : docDate;
        events.push({
          patientId,
          sourceDocumentId: documentId,
          eventDate,
          title: e.category === "PAST_HISTORY" ? `Past history: ${e.normalisedValue}` : `Diagnosis: ${e.normalisedValue}`,
          description: `${e.category === "PAST_HISTORY" ? "Historical diagnosis" : "Diagnosis"} recorded in document.${sd.chronic ? " Chronic condition." : ""} Source: "${e.rawText}".`,
          category: "DIAGNOSIS",
          metadata: { ...sd, needsReview: e.needsReview, confidence: e.confidence },
        });
      } else if (e.category === "PROCEDURE") {
        const sd = e.structuredData;
        const eventDate = sd.dateISO ? new Date(sd.dateISO as string) : docDate;
        events.push({
          patientId,
          sourceDocumentId: documentId,
          eventDate,
          title: `Procedure: ${e.normalisedValue}`,
          description: `Procedure from document.${sd.rawDate ? ` Dated ${sd.rawDate}.` : ""} Source: "${e.rawText}".`,
          category: "PROCEDURE",
          metadata: { ...sd, needsReview: e.needsReview, confidence: e.confidence },
        });
      }
      // ALLERGY and VITAL are captured in safety profile / not timeline events.
    }
    return events;
  }

  /**
   * Build the aggregated safety-critical view for one patient across documents.
   */
  static aggregateSafetyProfile(results: ExtractedEntitiesResult[]): {
    activeMedications: string[];
    allergies: string[];
    criticalDiagnoses: string[];
    criticalLabFlags: string[];
    needsPhysicianReview: boolean;
  } {
    const activeMedications: string[] = [];
    const allergies: string[] = [];
    const criticalDiagnoses: string[] = [];
    const criticalLabFlags: string[] = [];
    let needsReview = false;

    const pushUnique = (arr: string[], val: string) => {
      if (val && !arr.includes(val)) arr.push(val);
    };

    for (const r of results) {
      needsReview = needsReview || !!r.needsPhysicianReview;
      for (const m of r.medications) {
        pushUnique(activeMedications, `${m.normalisedName || m.name} ${m.dosage} ${m.frequency}`.trim());
      }
      for (const a of r.allergies) pushUnique(allergies, a);
      for (const e of r.structured ?? []) {
        if (e.category === "DIAGNOSIS" || e.category === "PAST_HISTORY") {
          if (e.priority === "SAFETY_CRITICAL") pushUnique(criticalDiagnoses, e.normalisedValue);
        }
        if (e.category === "LAB" && e.structuredData.flag && e.structuredData.flag !== "NORMAL") {
          pushUnique(criticalLabFlags, e.normalisedValue);
        }
      }
    }

    return {
      activeMedications,
      allergies,
      criticalDiagnoses,
      criticalLabFlags,
      needsPhysicianReview: needsReview,
    };
  }
}

function dedupeEntities(entities: ClinicalEntity[]): ClinicalEntity[] {
  const seen: Array<{ key: string; entity: ClinicalEntity }> = [];
  for (const e of entities) {
    const key = `${e.category}::${e.normalisedValue.toLowerCase()}`;
    const existing = seen.find((s) => s.key === key);
    if (!existing || e.confidence > existing.entity.confidence) {
      if (existing) existing.entity = e;
      else seen.push({ key, entity: e });
    }
  }
  return seen.map((s) => s.entity);
}

export class OCRService {
  private static provider: OCRProvider = new IntelligentDocumentOCRProvider();

  static setProvider(newProvider: OCRProvider) {
    this.provider = newProvider;
  }

  static async processDocument(
    fileBuffer: Buffer,
    mimeType: string = "application/pdf"
  ): Promise<{ ocr: OCRResult; entities: ExtractedEntitiesResult }> {
    try {
      const ocr = await this.provider.extractText(fileBuffer, mimeType);
      const entities = MedicalEntityExtractor.extractEntities(ocr.rawText);
      return { ocr, entities };
    } catch (err: any) {
      // Safe fallback when image is corrupted, unreadable, or not a valid image/PDF
      const fallbackOcr: OCRResult = {
        rawText: "",
        confidence: 0.0,
        detectedLanguage: "en",
        pageCount: 1,
        provider: "fallback",
        error: err?.message || "Failed to parse document",
      };
      const entities = MedicalEntityExtractor.extractEntities("");
      return { ocr: fallbackOcr, entities };
    }
  }
}
