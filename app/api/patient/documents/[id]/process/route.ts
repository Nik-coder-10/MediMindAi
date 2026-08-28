import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { MedicalEntityExtractor, OCRService } from "@/lib/ocr/ocr.service";
import { prisma } from "@/lib/db/prisma";
import { AuthService } from "@/lib/auth/auth-guard";
import { AppError } from "@/lib/api/errors";
import { supabaseStorage } from "@/lib/storage/supabase-storage";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;

    const doc = await prisma.medicalDocument.findUnique({
      where: { id: documentId, deletedAt: null },
    });

    if (!doc) {
      throw AppError.notFound(`MedicalDocument '${documentId}' not found.`);
    }

    // 1. Authorize session access
    await AuthService.requireSessionAccess(req, doc.sessionId);

    let ocrRawText = doc.ocrRawText || "";
    let confidence = ocrRawText ? 0.9 : 0;

    // If no OCR text stored, attempt download from persistent storage to perform OCR
    if (!ocrRawText && doc.originalFileUrl && !doc.originalFileUrl.startsWith("/uploads/")) {
      const objectKey = doc.originalFileUrl.replace(/^medical-documents\//, "");
      const buffer = await supabaseStorage.downloadDocument(objectKey);
      if (buffer) {
        const { ocr } = await OCRService.processDocument(buffer, doc.mimeType);
        ocrRawText = ocr.rawText;
        confidence = ocr.confidence;

        // Update document with extracted OCR text
        await prisma.medicalDocument.update({
          where: { id: documentId },
          data: { ocrRawText },
        });
      }
    }

    const entities = MedicalEntityExtractor.extractEntities(ocrRawText);
    const ocr = { rawText: ocrRawText, confidence };

    // 2. Persist extracted entities + timeline events
    try {
      const entityRecords = MedicalEntityExtractor.toEntityRecords(documentId, entities);
      if (entityRecords.length > 0) {
        await prisma.extractedMedicalEntity.createMany({ data: entityRecords as any });
      }
      const session = await prisma.clinicalSession.findUnique({
        where: { id: doc.sessionId },
        select: { patientId: true },
      });
      if (session) {
        const timelineEvents = MedicalEntityExtractor.toTimelineEvents(documentId, session.patientId, entities);
        if (timelineEvents.length > 0) {
          await prisma.medicalTimelineEvent.createMany({ data: timelineEvents as any });
        }
      }
    } catch (persistErr) {
      console.warn("Document re-processing persistence skipped:", persistErr);
    }

    return apiSuccess({
      documentId,
      status: "EXTRACTED",
      ocr,
      entities,
    });
  } catch (error) {
    return apiError(error);
  }
}

