import { createRequire } from "module";
import type { OCRResult, OCRProvider } from "./ocr.service";

const require = createRequire(import.meta.url);

/**
 * REAL OCR PROVIDERS
 * ------------------
 * Replaces the previous demo/placeholder OCR. Never fabricates clinical text.
 * On any failure it returns an empty rawText with confidence 0 and an `error`
 * flag, so the (already-correct) downstream extractor sees nothing.
 *
 *   - TesseractImageProvider       : images (JPG/PNG/WEBP), English + Hindi
 *   - PdfDocumentProvider           : PDFs — text layer first, else rasterise + OCR
 *   - CloudDocIntelligenceProvider  : ready-to-swap Azure Document Intelligence
 *   - IntelligentDocumentOCRProvider: orchestrator (best available path)
 */

const OCR_TIMEOUT_MS = Number(process.env.OCR_TIMEOUT_MS || 45000);
const MAX_PDF_PAGES = Number(process.env.OCR_PDF_PAGES || 2);

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

function looksLikePlainText(buf: Buffer): boolean {
  if (!buf || buf.length === 0) return false;
  try {
    const s = buf.toString("utf-8");
    // Binary files (e.g. PDFs) decode with replacement chars (U+FFFD) — never treat as text.
    if (s.includes("�")) return false;
    const printable = (s.match(/[\w\s.,;:()\/\-+=%@#&*"'?<>]/g) || []).length;
    return printable > 30 && printable / s.length > 0.4;
  } catch {
    return false;
  }
}

/* ============================================================================
 * 1. TESSERACT (images)
 * ==========================================================================*/
export class TesseractImageProvider implements OCRProvider {
  constructor(private langs = process.env.OCR_LANGS || "eng+hin") {}

  async extractText(fileBuffer: Buffer, mimeType: string): Promise<OCRResult> {
    const Tesseract = require("tesseract.js");
    const fs = require("fs");
    const os = require("os");
    const path = require("path");
    // Write to a temp file with the right extension — more reliable than a raw
    // Buffer across platforms (avoids Windows file:// temp-path issues).
    const ext = mimeType.includes("png") ? ".png" : mimeType.includes("jpeg") || mimeType.includes("jpg") ? ".jpg" : ".png";
    const tmp = path.join(os.tmpdir(), `ocr_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
    fs.writeFileSync(tmp, fileBuffer);
    try {
      const res: any = await withTimeout(
        Tesseract.recognize(tmp, this.langs, { logger: () => {} }),
        OCR_TIMEOUT_MS,
        "tesseract"
      );
      const rawText = (res.data.text || "")
        .split("\n")
        .map((l: string) => l.replace(/[ \t]+/g, " ").replace(/[\u0000-\u001F]/g, "").trim())
        .filter(Boolean)
        .join("\n");
      const confidence =
        typeof res.data.confidence === "number"
          ? Math.max(0, Math.min(1, res.data.confidence / 100))
          : 0;
      const lines = Array.isArray(res.data.lines)
        ? res.data.lines
            .map((l: any) => ({ text: l.text, bbox: l.bbox }))
            .filter((l: any) => l.text && l.text.trim())
        : undefined;
      return {
        rawText,
        confidence,
        detectedLanguage: this.langs.includes("hin") ? "en+hi" : "en",
        pageCount: 1,
        provider: "tesseract.js",
        layoutHints: lines ? { lines } : undefined,
      };
    } finally {
      try { fs.unlinkSync(tmp); } catch { /* ignore */ }
    }
  }
}

/* ============================================================================
 * 2. PDF (text layer, else rasterise + OCR)
 * ==========================================================================*/
export class PdfDocumentProvider implements OCRProvider {
  constructor(private image = new TesseractImageProvider(process.env.OCR_LANGS || "eng+hin")) {}

  async extractText(fileBuffer: Buffer, mimeType: string): Promise<OCRResult> {
    const pdfjs: any = await import("pdfjs-dist/legacy/build/pdf.mjs");
    try {
      const { pathToFileURL } = require("url");
      const workerSrc = pathToFileURL(require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs")).href;
      pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
    } catch {
      /* worker resolution is best-effort */
    }

    const doc: any = await withTimeout(
      pdfjs.getDocument({ data: new Uint8Array(fileBuffer), useSystemFonts: true }).promise,
      OCR_TIMEOUT_MS,
      "pdf-parse"
    );

    const maxPages = Math.min(doc.numPages, MAX_PDF_PAGES);
    let text = "";
    const layout: any[] = [];

    for (let p = 1; p <= maxPages; p++) {
      const page = await doc.getPage(p);
      const content = await page.getTextContent();
      let pageText = "";
      let prevY: number | null = null;
      for (const it of content.items) {
        const str = typeof it.str === "string" ? it.str : "";
        if (!str) continue;
        const y = it.transform ? (it.transform[5] as number) : null;
        if (prevY !== null && y !== null && Math.abs(y - prevY) > 4) pageText += "\n";
        pageText += str + " ";
        prevY = y;
      }
      pageText = pageText.replace(/[ \t]+/g, " ").replace(/\n /g, "\n").trim();
      if (pageText) text += `\n${pageText}`;

      // Best-effort rasterisation for scanned (image-only) PDFs.
      if (text.trim().length < 40) {
        try {
          const { createCanvas } = await import("@napi-rs/canvas");
          const viewport = page.getViewport({ scale: 2 });
          const canvas = createCanvas(Math.floor(viewport.width), Math.floor(viewport.height));
          const ctx = canvas.getContext("2d");
          await page.render({ canvasContext: ctx as any, viewport }).promise;
          const png = canvas.toBuffer("image/png");
          const ocr = await this.image.extractText(png, "image/png");
          if (ocr.rawText.trim().length > text.trim().length) {
            text = ocr.rawText;
            layout.push(...((ocr.layoutHints as any)?.lines || []));
          }
        } catch {
          /* rasterisation unavailable — keep text-layer result (possibly empty) */
        }
      }
    }

    const clean = text.replace(/\s+/g, " ").trim();
    if (!clean) {
      throw new Error("PDF has no extractable text layer and rasterisation produced nothing");
    }
    return {
      rawText: clean,
      confidence: 0.9,
      detectedLanguage: "en",
      pageCount: maxPages,
      provider: "pdfjs-dist",
      layoutHints: layout.length ? { lines: layout } : undefined,
    };
  }
}

/* ============================================================================
 * 3. CLOUD OCR — Azure Document Intelligence (swap point)
 * ==========================================================================*/
export class CloudDocIntelligenceProvider implements OCRProvider {
  constructor(
    private endpoint = process.env.AZURE_DI_ENDPOINT,
    private key = process.env.AZURE_DI_KEY,
    private model = process.env.AZURE_DI_MODEL || "prebuilt-document"
  ) {}

  get isConfigured(): boolean {
    return Boolean(this.endpoint && this.key);
  }

  async extractText(fileBuffer: Buffer, mimeType: string): Promise<OCRResult> {
    if (!this.endpoint || !this.key) {
      throw new Error("Cloud OCR (Azure Document Intelligence) not configured");
    }
    const apiVersion = "2024-11-30";
    const analyzeUrl = `${this.endpoint}/documentintelligence/documentModels/${this.model}:analyze?api-version=${apiVersion}`;

    const start = await fetch(analyzeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "Ocp-Apim-Subscription-Key": this.key,
      },
      body: fileBuffer as any,
    } as any);
    if (!start.ok) throw new Error(`Azure DI analyze failed: ${start.status}`);
    const opLocation = start.headers.get("operation-location");
    if (!opLocation) throw new Error("Azure DI: missing operation-location");

    let result: any = null;
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 1500));
      const poll = await fetch(opLocation, { headers: { "Ocp-Apim-Subscription-Key": this.key } });
      if (!poll.ok) continue;
      const json = await poll.json();
      if (json.status === "succeeded") {
        result = json;
        break;
      }
      if (json.status === "failed") throw new Error("Azure DI analysis failed");
    }
    if (!result) throw new Error("Azure DI analysis timed out");

    const paras = (result.analyzeResult?.content || "").replace(/\s+/g, " ").trim();
    return {
      rawText: paras,
      confidence: 0.95,
      detectedLanguage: "en",
      pageCount: result.analyzeResult?.pages?.length || 1,
      provider: "azure-document-intelligence",
    };
  }
}

/* ============================================================================
 * 4. ORCHESTRATOR — picks best path, never fabricates
 * ==========================================================================*/
export class IntelligentDocumentOCRProvider implements OCRProvider {
  private tesseract = new TesseractImageProvider(process.env.OCR_LANGS || "eng+hin");
  private pdf = new PdfDocumentProvider(this.tesseract);
  private cloud = new CloudDocIntelligenceProvider();

  async extractText(fileBuffer: Buffer, mimeType: string): Promise<OCRResult> {
    // 1. Genuine plain-text file (pasted/exported .txt) — not fabricated.
    if (mimeType === "text/plain" || looksLikePlainText(fileBuffer)) {
      const decoded = fileBuffer.toString("utf-8").trim();
      if (decoded.length > 0) {
        return {
          rawText: decoded,
          confidence: 0.96,
          detectedLanguage: "en",
          pageCount: 1,
          provider: "text-decode",
        };
      }
      return { rawText: "", confidence: 0, error: "Empty text buffer", provider: "none" };
    }

    // 2. Cloud OCR if configured (best quality) — try first.
    if (this.cloud.isConfigured) {
      try {
        return await withTimeout(this.cloud.extractText(fileBuffer, mimeType), OCR_TIMEOUT_MS, "azure-di");
      } catch (e) {
        console.warn(`[OCR] Cloud OCR unavailable, falling back: ${(e as Error).message}`);
      }
    }

    // 3. PDF
    if (
      mimeType === "application/pdf" ||
      fileBuffer.slice(0, 5).toString("latin1").startsWith("%PDF")
    ) {
      try {
        return await withTimeout(this.pdf.extractText(fileBuffer, mimeType), OCR_TIMEOUT_MS, "pdf");
      } catch (e) {
        console.warn(`[OCR] PDF OCR failed: ${(e as Error).message}`);
      }
    }

    // 4. Image → Tesseract
    try {
      return await withTimeout(this.tesseract.extractText(fileBuffer, mimeType), OCR_TIMEOUT_MS, "tesseract");
    } catch (e) {
      console.warn(`[OCR] Tesseract OCR failed: ${(e as Error).message}`);
    }

    // 5. Total failure — empty + error flag. NEVER return fake medical text.
    return {
      rawText: "",
      confidence: 0,
      error: "OCR could not read this file (unsupported, corrupt, or unreadable).",
      provider: "none",
    };
  }
}
