import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { MedicalEntityExtractor } from "@/lib/ocr/ocr.service";
import { prisma } from "@/lib/db/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;

    // 1. Load the stored document's OCR text (precision-first: never fabricate).
    let ocrRawText = "";
    try {
      const doc = await prisma.medicalDocument.findUnique({
        where: { id: documentId },
        select: { ocrRawText: true, sessionId: true },
      });
      ocrRawText = doc?.ocrRawText || "";
    } catch {
      ocrRawText = "";
    }

    const entities = MedicalEntityExtractor.extractEntities(ocrRawText || "");
    const ocr = { rawText: ocrRawText, confidence: ocrRawText ? 0.9 : 0 };

    // 2. Persist extracted entities + timeline events (Storage step)
    try {
      const entityRecords = MedicalEntityExtractor.toEntityRecords(documentId, entities);
      if (entityRecords.length > 0) {
        await prisma.extractedMedicalEntity.createMany({ data: entityRecords as any });
      }
      const doc = await prisma.medicalDocument.findUnique({
        where: { id: documentId },
        select: { sessionId: true },
      });
      if (doc) {
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
      }
    } catch (persistErr) {
      console.error("Document re-processing persistence skipped:", persistErr);
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
