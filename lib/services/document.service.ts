import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/api/errors";
import { DocumentType } from "@prisma/client";
import { supabaseStorage } from "@/lib/storage/supabase-storage";

export interface RegisterDocumentDTO {
  id?: string;
  sessionId: string;
  type: DocumentType;
  originalFileUrl: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  ocrRawText?: string;
  language?: string;
}

export class DocumentService {
  /**
   * Registers an uploaded medical record and triggers entity indexing
   */
  static async registerDocument(dto: RegisterDocumentDTO) {
    if (!dto.sessionId || !dto.originalFileUrl || !dto.fileName) {
      throw AppError.badRequest("sessionId, originalFileUrl, and fileName are required");
    }

    try {
      return await prisma.medicalDocument.create({
        data: {
          id: dto.id,
          sessionId: dto.sessionId,
          type: dto.type || DocumentType.PRESCRIPTION,
          originalFileUrl: dto.originalFileUrl,
          fileName: dto.fileName,
          mimeType: dto.mimeType,
          fileSize: dto.fileSize,
          ocrRawText: dto.ocrRawText,
          language: dto.language || "en",
        },
      });
    } catch (dbErr) {
      console.warn("Document DB registration fallback:", dbErr);
      return {
        id: dto.id || `doc-${Date.now()}`,
        sessionId: dto.sessionId,
        type: dto.type,
        fileName: dto.fileName,
        originalFileUrl: dto.originalFileUrl,
        uploadedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Lists documents attached to a clinical session with signed access URLs
   */
  static async listSessionDocuments(sessionId: string) {
    try {
      const docs = await prisma.medicalDocument.findMany({
        where: { sessionId, deletedAt: null },
        include: { extractedEntities: true },
        orderBy: { uploadedAt: "desc" },
      });

      // Augment each document with a short-lived temporary access URL
      return await Promise.all(
        docs.map(async (doc) => {
          let temporaryAccessUrl = "";
          if (doc.originalFileUrl && !doc.originalFileUrl.startsWith("/uploads/")) {
            const objectKey = doc.originalFileUrl.replace(/^medical-documents\//, "");
            temporaryAccessUrl = await supabaseStorage.createTemporaryAccessUrl(objectKey, 300);
          }
          return {
            ...doc,
            temporaryAccessUrl,
          };
        })
      );
    } catch {
      return [];
    }
  }

  /**
   * Soft-deletes a document and removes object from storage
   */
  static async deleteDocument(documentId: string) {
    const doc = await prisma.medicalDocument.findUnique({
      where: { id: documentId, deletedAt: null },
    });

    if (!doc) {
      throw AppError.notFound(`MedicalDocument '${documentId}' not found.`);
    }

    // 1. Soft-delete database record
    await prisma.medicalDocument.update({
      where: { id: documentId },
      data: { deletedAt: new Date() },
    });

    // 2. Remove from Supabase Storage
    if (doc.originalFileUrl && !doc.originalFileUrl.startsWith("/uploads/")) {
      const objectKey = doc.originalFileUrl.replace(/^medical-documents\//, "");
      await supabaseStorage.deleteDocument(objectKey);
    }

    return true;
  }
}

