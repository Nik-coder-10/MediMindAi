import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { DocumentService } from "@/lib/services/document.service";
import { AuthService } from "@/lib/auth/auth-guard";
import { AppError } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import { supabaseStorage } from "@/lib/storage/supabase-storage";
import { AuditService } from "@/lib/services/audit.service";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;
    const document = await prisma.medicalDocument.findUnique({
      where: { id: documentId, deletedAt: null },
      include: { extractedEntities: true },
    });

    if (!document) {
      throw AppError.notFound(`MedicalDocument '${documentId}' not found.`);
    }

    // 1. Authorize session access (Patient owns session, Doctor assigned, or Admin)
    await AuthService.requireSessionAccess(req, document.sessionId);

    // 2. Generate short-lived signed access URL
    let temporaryAccessUrl = "";
    if (document.originalFileUrl && !document.originalFileUrl.startsWith("/uploads/")) {
      const objectKey = document.originalFileUrl.replace(/^medical-documents\//, "");
      temporaryAccessUrl = await supabaseStorage.createTemporaryAccessUrl(objectKey, 300);
    }

    // 3. Log access audit
    await AuditService.log({
      action: "DOCUMENT_ACCESSED",
      resourceType: "MedicalDocument",
      resourceId: documentId,
      metadata: {
        documentType: document.type,
        fileName: document.fileName,
      },
    });

    return apiSuccess({
      document: {
        ...document,
        temporaryAccessUrl,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;
    const document = await prisma.medicalDocument.findUnique({
      where: { id: documentId, deletedAt: null },
    });

    if (!document) {
      throw AppError.notFound(`MedicalDocument '${documentId}' not found.`);
    }

    // Authorize caller has access to modify this session's documents
    await AuthService.requireSessionAccess(req, document.sessionId);

    await DocumentService.deleteDocument(documentId);

    await AuditService.log({
      action: "DOCUMENT_DELETED",
      resourceType: "MedicalDocument",
      resourceId: documentId,
      metadata: {
        fileName: document.fileName,
      },
    });

    return apiSuccess({ success: true, message: "Document deleted successfully." });
  } catch (error) {
    return apiError(error);
  }
}
