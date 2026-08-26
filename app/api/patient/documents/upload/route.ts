import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api/response";
import { DocumentService } from "@/lib/services/document.service";
import { OCRService } from "@/lib/ocr/ocr.service";
import { AuditService } from "@/lib/services/audit.service";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const sessionId = (formData.get("sessionId") as string) || "sess-demo-001";
    const documentType = (formData.get("type") as any) || "PRESCRIPTION";

    let fileName = file ? file.name : "prescription_scan.pdf";
    let mimeType = file ? file.type : "application/pdf";
    let fileSize = file ? file.size : 102400;
    let fileBuffer = Buffer.from([]);

    if (file) {
      const bytes = await file.arrayBuffer();
      fileBuffer = Buffer.from(bytes);
    }

    // 1. Process OCR & Entity Extraction
    const { ocr, entities } = await OCRService.processDocument(fileBuffer, mimeType);

    // 2. Register Document in DB
    const originalFileUrl = `/uploads/documents/${Date.now()}_${fileName}`;
    const document = await DocumentService.registerDocument({
      sessionId,
      type: documentType,
      originalFileUrl,
      fileName,
      mimeType,
      fileSize,
      ocrRawText: ocr.rawText,
    });

    // 3. Audit Log
    await AuditService.log({
      action: "DOCUMENT_UPLOAD_AND_OCR",
      resourceType: "MedicalDocument",
      resourceId: (document as any)?.id || "doc-mock-001",
      metadata: {
        fileName,
        extractedMedicationsCount: entities.medications.length,
        extractedLabsCount: entities.labResults.length,
      },
    });

    return apiSuccess(
      {
        document,
        ocr,
        entities,
      },
      201
    );
  } catch (error) {
    return apiError(error);
  }
}
