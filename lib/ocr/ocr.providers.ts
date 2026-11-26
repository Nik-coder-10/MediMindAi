import { createRequire } from "module";
import { inflateSync } from "node:zlib";
import { PDFArray, PDFDocument, PDFName, PDFRawStream } from "pdf-lib";
import * as pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.mjs";
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

/**
 * Extracts embedded page images directly from a PDF's XObjects. Scanned
 * prescriptions are image-only, and rendering a page with pdf.js + native
 * canvas is unreliable inside a serverless bundle. Pulling the embedded JPEG
 * (or Flate-wrapped JPEG / raw RGB bitmap) is deterministic and needs no
 * rendering step.
 */
async function extractPdfImages(fileBuffer: Buffer): Promise<Array<{ bytes: Buffer; mimeType: string }>> {
  const images: Array<{ bytes: Buffer; mimeType: string }> = [];
  try {
    const pdf = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
    const pages = pdf.getPages();

    for (let p = 0; p < Math.min(pages.length, MAX_PDF_PAGES); p++) {
      const resources = pages[p].node.Resources();
      if (!resources) continue;
      const xobjects: any = resources.lookup(PDFName.of("XObject"));
      if (!xobjects) continue;

      for (const key of xobjects.keys()) {
        try {
          const obj: any = pdf.context.lookup(xobjects.get(key));
          if (!(obj instanceof PDFRawStream)) continue;
          if (obj.dict.get(PDFName.of("Subtype"))?.toString() !== "/Image") continue;

          const filterValue: any = obj.dict.get(PDFName.of("Filter"));
          const filters = filterValue instanceof PDFArray
            ? filterValue.asArray().map((f: any) => String(f?.toString?.() || ""))
            : filterValue
              ? [String(filterValue.toString())]
              : [];
          const raw = obj.contents instanceof Uint8Array ? Buffer.from(obj.contents) : null;
          if (!raw?.length) continue;

          const isJpeg = filters.some((f) => f === "/DCTDecode" || f === "/DCT");
          if (isJpeg) {
            let bytes = raw;
            // Some scanners wrap the JPEG stream in FlateDecode.
            if (filters.includes("/FlateDecode")) {
              try { bytes = inflateSync(raw); } catch { continue; }
            }
            if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
              images.push({ bytes, mimeType: "image/jpeg" });
              continue;
            }
          }

          const isFlate = filters.includes("/FlateDecode");
          if (isFlate) {
            const widthObj: any = obj.dict.get(PDFName.of("Width"));
            const heightObj: any = obj.dict.get(PDFName.of("Height"));
            const width = Number(widthObj?.numberValue ?? widthObj?.toString?.() ?? 0);
            const height = Number(heightObj?.numberValue ?? heightObj?.toString?.() ?? 0);
            if (!width || !height || width > 8000 || height > 8000) continue;
            const pixels = inflateSync(raw);
            // Canvas is only needed for uncompressed RGB bitmaps; JPEG pages
            // never reach this branch and work without any native module.
            const { createCanvas, ImageData } = await import("@napi-rs/canvas");
            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext("2d");
            ctx.putImageData(new ImageData(new Uint8ClampedArray(pixels), width, height), 0, 0);
            images.push({ bytes: canvas.toBuffer("image/png"), mimeType: "image/png" });
          }
        } catch {
          // Skip unreadable image objects; other pages may still be usable.
        }
      }
    }
  } catch (error) {
    console.warn("[OCR] PDF image extraction unavailable:", (error as any)?.message);
  }
  return images;
}

/* ============================================================================
 * 1. TESSERACT (images + handwritten optimization & preprocessing)
 * ==========================================================================*/
export class TesseractImageProvider implements OCRProvider {
  constructor(private langs = process.env.OCR_LANGS || "eng+hin") {}

  /**
   * Preprocesses image buffer with contrast boost, grayscale, and thresholding if available
   */
  private async preprocessImageBuffer(fileBuffer: Buffer): Promise<Buffer> {
    try {
      // Use napi-rs canvas or native buffer operations to enhance contrast/sharpness for handwritten text
      const { createCanvas, loadImage } = await import("@napi-rs/canvas");
      const img = await loadImage(fileBuffer);
      const canvas = createCanvas(img.width, img.height);
      const ctx = canvas.getContext("2d");

      // Draw original
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // High contrast binarization & noise reduction for handwritten ink lines
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // Luminance
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        // Contrast curve
        const factor = 1.3;
        const enhanced = Math.min(255, Math.max(0, factor * (gray - 128) + 128));
        data[i] = enhanced;
        data[i + 1] = enhanced;
        data[i + 2] = enhanced;
      }
      ctx.putImageData(imgData, 0, 0);
      return canvas.toBuffer("image/png");
    } catch {
      // If canvas is unavailable, return raw file buffer
      return fileBuffer;
    }
  }

  async extractText(fileBuffer: Buffer, mimeType: string): Promise<OCRResult> {
    const Tesseract = require("tesseract.js");
    const fs = require("fs");
    const os = require("os");
    const path = require("path");

    // Check magic bytes before invoking Tesseract worker to prevent worker uncaught exceptions on corrupt bytes
    const isPng = fileBuffer.length >= 8 && fileBuffer[0] === 0x89 && fileBuffer[1] === 0x50 && fileBuffer[2] === 0x4e && fileBuffer[3] === 0x47;
    const isJpg = fileBuffer.length >= 3 && fileBuffer[0] === 0xff && fileBuffer[1] === 0xd8 && fileBuffer[2] === 0xff;
    const isWebp = fileBuffer.length >= 12 && fileBuffer.slice(0, 4).toString("ascii") === "RIFF" && fileBuffer.slice(8, 12).toString("ascii") === "WEBP";

    if (!isPng && !isJpg && !isWebp) {
      return {
        rawText: "",
        confidence: 0,
        detectedLanguage: "en",
        pageCount: 1,
        provider: "none",
        error: "Unrecognized or corrupt image format",
      };
    }

    const processedBuffer = await this.preprocessImageBuffer(fileBuffer);
    const ext = mimeType.includes("png") ? ".png" : mimeType.includes("jpeg") || mimeType.includes("jpg") ? ".jpg" : ".png";
    const tmp = path.join(os.tmpdir(), `ocr_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
    fs.writeFileSync(tmp, processedBuffer);

    try {
      // Serve language data locally instead of relying on Tesseract's public
      // CDN — the CDN fetch is unreliable/slow inside Vercel functions.
      let lastTesseractStatus = "not-started";
      const recognizeOptions: any = {
        logger: (m: any) => {
          if (m?.status) lastTesseractStatus = m.status;
        },
      };
      if (process.env.VERCEL_URL) {
        recognizeOptions.langPath = `https://${process.env.VERCEL_URL}/tessdata`;
        recognizeOptions.gzip = false;
      } else {
        const localLangPath = path.join(process.cwd(), "public", "tessdata");
        if (fs.existsSync(localLangPath)) {
          recognizeOptions.langPath = localLangPath;
          recognizeOptions.gzip = false;
        }
      }

      const res: any = await withTimeout(
        Tesseract.recognize(tmp, this.langs, recognizeOptions),
        OCR_TIMEOUT_MS,
        "tesseract"
      ).catch((e: any) => {
        throw new Error(
          `${e.message} (last status: ${lastTesseractStatus}, langs: ${this.langs}, langPath: ${recognizeOptions.langPath || "default"})`
        );
      });

      const rawText = (res.data.text || "")
        .split("\n")
        .map((l: string) => l.replace(/[ \t]+/g, " ").replace(/[\u0000-\u001F]/g, "").trim())
        .filter(Boolean)
        .join("\n");

      // Realistic confidence calculation: penalize short text or low word scores
      let rawConfidence = typeof res.data.confidence === "number" ? res.data.confidence / 100 : 0.5;
      
      // If text looks handwritten (irregular line lengths, low avg word confidence), adjust confidence accordingly
      const words = Array.isArray(res.data.words) ? res.data.words : [];
      if (words.length > 0) {
        const avgWordConf = words.reduce((acc: number, w: any) => acc + (w.confidence || 50), 0) / (words.length * 100);
        rawConfidence = (rawConfidence + avgWordConf) / 2;
      }

      const confidence = Math.max(0.1, Math.min(1, rawConfidence));

      const lines = Array.isArray(res.data.lines)
        ? res.data.lines
            .map((l: any) => ({ text: l.text, bbox: l.bbox, confidence: (l.confidence || 60) / 100 }))
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
 * 2. PDF (text layer, else rasterise + OCR multi-page)
 * ==========================================================================*/
export class PdfDocumentProvider implements OCRProvider {
  constructor(private image = new TesseractImageProvider(process.env.OCR_LANGS || "eng+hin")) {}

  private cleanText(text: string): string {
    // Keep line breaks: the clinical entity extractor is line-oriented and
    // medications/labs are parsed per line. Only collapse horizontal whitespace.
    return text
      .replace(/[ \t]+/g, " ")
      .replace(/\n[ \t]+/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  async extractText(fileBuffer: Buffer, mimeType: string): Promise<OCRResult> {
    // 1. Scanned PDFs: OCR the embedded page images first. This avoids pdf.js
    // entirely — its fake-worker setup can hang inside a serverless bundle.
    const images = await extractPdfImages(fileBuffer);
    if (images.length > 0) {
      let text = "";
      let confidence = 0;
      const layout: any[] = [];
      for (const image of images) {
        try {
          const ocr = await this.image.extractText(image.bytes, image.mimeType);
          if (ocr.rawText && ocr.rawText.length > text.length) {
            text = ocr.rawText;
            confidence = ocr.confidence;
            layout.push(...((ocr.layoutHints as any)?.lines || []));
          }
        } catch (ocrErr) {
          console.warn("[OCR] Embedded page OCR skipped:", (ocrErr as any)?.message);
        }
      }
      if (text.trim()) {
        return {
          rawText: this.cleanText(text),
          confidence,
          detectedLanguage: "en",
          pageCount: images.length,
          provider: "pdf-image-ocr",
          layoutHints: layout.length ? { lines: layout } : undefined,
        };
      }
    }

    // 2. Digital PDFs: pdf.js text layer.
    const pdfjs: any = await import("pdfjs-dist/legacy/build/pdf.mjs");
    (globalThis as any).pdfjsWorker ||= pdfjsWorker;

    const doc: any = await withTimeout(
      pdfjs.getDocument({ data: new Uint8Array(fileBuffer), useSystemFonts: true }).promise,
      Math.min(OCR_TIMEOUT_MS, 20000),
      "pdf-parse"
    );

    const maxPages = Math.min(doc.numPages, MAX_PDF_PAGES);
    let text = "";
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
    }

    const clean = this.cleanText(text);
    if (!clean) {
      throw new Error("PDF has no extractable text layer or readable embedded images");
    }
    return {
      rawText: clean,
      confidence: 0.92,
      detectedLanguage: "en",
      pageCount: maxPages,
      provider: "pdfjs-dist",
    };
  }
}

/* ============================================================================
 * 3. CLOUD OCR — Pluggable Cloud Engine (Azure DI / Google DocAI / AWS Textract)
 * ==========================================================================*/
export class CloudDocIntelligenceProvider implements OCRProvider {
  constructor(
    private providerType = process.env.OCR_PROVIDER || "azure", // "azure" | "google" | "aws"
    private endpoint = process.env.AZURE_DI_ENDPOINT || process.env.CLOUD_OCR_ENDPOINT,
    private key = process.env.AZURE_DI_KEY || process.env.CLOUD_OCR_KEY,
    private model = process.env.AZURE_DI_MODEL || "prebuilt-document"
  ) {}

  get isConfigured(): boolean {
    return Boolean(this.endpoint && this.key);
  }

  async extractText(fileBuffer: Buffer, mimeType: string): Promise<OCRResult> {
    if (!this.endpoint || !this.key) {
      throw new Error(`Cloud OCR (${this.providerType}) not configured`);
    }

    if (this.providerType === "azure") {
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

    // Generic REST hook for Google DocAI or AWS Textract
    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": mimeType,
        "Authorization": `Bearer ${this.key}`,
      },
      body: fileBuffer as any,
    });
    if (!res.ok) throw new Error(`Cloud OCR extraction failed: ${res.status}`);
    const data = await res.json();
    return {
      rawText: data.text || data.content || "",
      confidence: data.confidence || 0.9,
      detectedLanguage: data.language || "en",
      provider: this.providerType,
    };
  }
}

/* ============================================================================
 * 4. ORCHESTRATOR — Picks best path, manages handwritten degradation
 * ==========================================================================*/
export class IntelligentDocumentOCRProvider implements OCRProvider {
  private tesseract = new TesseractImageProvider(process.env.OCR_LANGS || "eng+hin");
  private pdf = new PdfDocumentProvider(this.tesseract);
  private cloud = new CloudDocIntelligenceProvider();

  async extractText(fileBuffer: Buffer, mimeType: string): Promise<OCRResult> {
    const failures: string[] = [];

    // 1. Genuine plain-text file (pasted/exported .txt)
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

    // 2. Cloud OCR if configured (best quality for handwritten & dense layouts)
    if (this.cloud.isConfigured) {
      try {
        return await withTimeout(this.cloud.extractText(fileBuffer, mimeType), OCR_TIMEOUT_MS, "cloud-ocr");
      } catch (e) {
        failures.push(`cloud: ${(e as Error).message}`);
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
        failures.push(`pdf: ${(e as Error).message}`);
        console.warn(`[OCR] PDF OCR failed: ${(e as Error).message}`);
      }
    }

    // 4. Image → Tesseract with handwritten contrast enhancements
    try {
      const imageResult = await withTimeout(
        this.tesseract.extractText(fileBuffer, mimeType),
        OCR_TIMEOUT_MS,
        "tesseract"
      );
      if (imageResult.rawText?.trim()) return imageResult;
      if (imageResult.error) failures.push(`image: ${imageResult.error}`);
    } catch (e) {
      failures.push(`image: ${(e as Error).message}`);
      console.warn(`[OCR] Tesseract OCR failed: ${(e as Error).message}`);
    }

    // 5. Total failure — empty + error flag. Surface provider diagnostics so
    // failures are debuggable in serverless logs and upload responses.
    return {
      rawText: "",
      confidence: 0,
      error: `OCR could not read this file (unsupported, corrupt, or unreadable).${failures.length ? ` Details: ${failures.join(" | ")}` : ""}`,
      provider: "none",
    };
  }
}
