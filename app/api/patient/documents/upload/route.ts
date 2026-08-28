import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api/response";
import { DocumentService } from "@/lib/services/document.service";
import { OCRService, MedicalEntityExtractor } from "@/lib/ocr/ocr.service";
import { AuditService } from "@/lib/services/audit.service";
import { prisma } from "@/lib/db/prisma";

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

    // 4. Persist extracted entities + timeline events (Storage step)
    try {
      const docId = (document as any)?.id as string | undefined;
      const realDoc = docId ? await prisma.medicalDocument.findUnique({ where: { id: docId } }) : null;
      if (realDoc) {
        const entityRecords = MedicalEntityExtractor.toEntityRecords(realDoc.id, entities);
        if (entityRecords.length > 0) {
          await prisma.extractedMedicalEntity.createMany({ data: entityRecords as any });
        }
        const session = await prisma.clinicalSession.findUnique({
          where: { id: realDoc.sessionId },
          select: { patientId: true },
        });
        if (session) {
          const timelineEvents = MedicalEntityExtractor.toTimelineEvents(realDoc.id, session.patientId, entities);
          if (timelineEvents.length > 0) {
            await prisma.medicalTimelineEvent.createMany({ data: timelineEvents as any });
          }
        }
      }
    } catch (persistErr) {
      // Persistence is best-effort; never break the upload response.
      console.error("Document entity persistence skipped:", persistErr);
    }

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
