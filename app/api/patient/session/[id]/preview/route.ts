import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { AppError } from "@/lib/api/errors";
import { AuthService } from "@/lib/auth/auth-guard";
import { PreviewService } from "@/lib/services/preview.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/patient/session/[id]/preview
 * Returns patient-friendly pre-submission summary dossier.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    if (!sessionId) {
      throw AppError.badRequest("sessionId is required");
    }

    await AuthService.requireSessionAccess(req, sessionId);

    const preview = await PreviewService.getPatientPreview(sessionId);
    return apiSuccess(preview);
  } catch (error) {
    return apiError(error);
  }
}
