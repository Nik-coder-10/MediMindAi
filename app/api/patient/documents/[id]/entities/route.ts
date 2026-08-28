import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { AuthService } from "@/lib/auth/auth-guard";
import { AppError } from "@/lib/api/errors";

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

    await AuthService.requireSessionAccess(req, document.sessionId);

    return apiSuccess({
      documentId,
      entities: document.extractedEntities,
    });
  } catch (error) {
    return apiError(error);
  }
}

