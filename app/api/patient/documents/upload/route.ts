import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { DocumentService } from "@/lib/services/document.service";
import { OCRService, MedicalEntityExtractor } from "@/lib/ocr/ocr.service";
import { AuditService } from "@/lib/services/audit.service";
import { prisma } from "@/lib/db/prisma";
import { AuthService } from "@/lib/auth/auth-guard";
import { AppError } from "@/lib/api/errors";
import { supabaseStorage } from "@/lib/storage/supabase-storage";
import { validateUploadedDocument } from "@/lib/storage/document-validator";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const sessionId = formData.get("sessionId") as string;
    const documentType = (formData.get("type") as any) || "PRESCRIPTION";

    if (!sessionId) {
      throw AppError.badRequest("sessionId is required for document upload.");
    }

    // 1. Authenticate and authorize session access (Phase 3 Guard)
    const { user, session } = await AuthService.requireSessionAccess(req, sessionId);

    if (!file) {
      throw AppError.badRequest("No file uploaded.");
    }

    const fileName = file.name || "medical_record.pdf";
    const declaredMimeType = file.type || "application/pdf";
    const bytes = await file.arrayBuffer();
    const fileBuffer = Buffer.from(bytes);

    // 2. Validate file format, magic bytes, and size limits (10MB)
    const validation = validateUploadedDocument(fileBuffer, fileName, declaredMimeType);
    const mimeType = validation.mimeType;
    const fileSize = fileBuffer.length;

    // 3. Generate server-side deterministic UUIDs & safe object key
    const documentId = crypto.randomUUID();
    const patientId = session.patientId || user.patientProfile?.id || "anonymous-patient";
    const sanitizedExt = validation.extension || ".pdf";
    const storageKey = `patients/${patientId}/${documentId}/original${sanitizedExt}`;

    // 4. Upload to Private Supabase Storage bucket
    const uploadResult = await supabaseStorage.uploadDocument(fileBuffer, storageKey, mimeType);

    // 5. Process OCR & Entity Extraction in-memory
    let ocrResult: any = { rawText: "", confidence: 0 };
    let entitiesResult: any = { medications: [], labResults: [], diagnoses: [], vitals: {}, procedures: [], allergies: [] };

    try {
      const { ocr, entities } = await OCRService.processDocument(fileBuffer, mimeType);
      ocrResult = ocr;
      entitiesResult = entities;
    } catch (ocrErr) {
      console.warn("OCR processing encountered warning (preserving original file):", ocrErr);
    }

    // 6. Register Document in DB with persistent storage reference
    const originalFileUrl = uploadResult.url;
    let document: any = null;

    try {
      document = await DocumentService.registerDocument({
        id: documentId,
        sessionId,
        type: documentType,
        originalFileUrl,
        fileName,
        mimeType,
        fileSize,
        ocrRawText: ocrResult.rawText,
      });
    } catch (dbErr) {
      // Storage cleanup if DB registration fails
      await supabaseStorage.deleteDocument(storageKey);
      throw dbErr;
    }

    // 7. Audit Log (No PHI / content logged)
    await AuditService.log({
      action: "DOCUMENT_UPLOAD_AND_OCR",
      resourceType: "MedicalDocument",
      resourceId: documentId,
      metadata: {
        documentType,
        fileSize,
        mimeType,
        extractedMedicationsCount: entitiesResult.medications?.length || 0,
        extractedLabsCount: entitiesResult.labResults?.length || 0,
      },
    });

    // 8. Persist extracted entities + timeline events
    try {
      const entityRecords = MedicalEntityExtractor.toEntityRecords(documentId, entitiesResult);
      if (entityRecords.length > 0) {
        await prisma.extractedMedicalEntity.createMany({ data: entityRecords as any });
      }
      const timelineEvents = MedicalEntityExtractor.toTimelineEvents(documentId, patientId, entitiesResult);
      if (timelineEvents.length > 0) {
        await prisma.medicalTimelineEvent.createMany({ data: timelineEvents as any });
      }
    } catch (persistErr) {
      console.warn("Document entity persistence skipped:", persistErr);
    }

    // 9. Generate temporary access URL for immediate preview
    const temporaryAccessUrl = await supabaseStorage.createTemporaryAccessUrl(storageKey, 300);

    return apiSuccess(
      {
        document: {
          ...document,
          temporaryAccessUrl,
        },
        ocr: ocrResult,
        entities: entitiesResult,
      },
      201
    );
  } catch (error) {
    return apiError(error);
  }
}

