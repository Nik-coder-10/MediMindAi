import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { AuditService } from "@/lib/services/audit.service";
import { AuthService } from "@/lib/auth/auth-guard";

export async function POST(req: NextRequest) {
  try {
    const user = await AuthService.requireDoctor(req);
    const body = await req.json();
    const { documentId, entityId, originalValue, correctedValue, entityType } = body;

    let updatedEntity = null;
    if (entityId) {
      try {
        const entity = await prisma.extractedMedicalEntity.findUnique({
          where: { id: entityId },
        });

        if (entity) {
          const currentSd = (entity.structuredData as any) || {};
          const newSd = {
            ...currentSd,
            normalisedName: correctedValue,
            editedByDoctor: user.id,
            editedAt: new Date().toISOString(),
          };

          updatedEntity = await prisma.extractedMedicalEntity.update({
            where: { id: entityId },
            data: {
              rawText: correctedValue,
              structuredData: newSd,
              confidence: 1.0, // Physician verified = 100% confidence
              isVerifiedByDoctor: true,
            },
          });
        }
      } catch (dbErr) {
        console.warn("DB update for entity correction skipped:", dbErr);
      }
    }

    await AuditService.log({
      actorId: user.id,
      action: "DOCUMENT_ENTITY_CORRECTED",
      resourceType: "ExtractedMedicalEntity",
      resourceId: entityId || documentId,
      metadata: {
        documentId,
        originalValue,
        correctedValue,
        entityType,
      },
    });

    return apiSuccess({
      success: true,
      message: "संशोधन सफलतापूर्वक दर्ज किया गया (Correction Logged Successfully)",
      correctedValue,
      entity: updatedEntity,
    });
  } catch (error) {
    return apiError(error);
  }
}

