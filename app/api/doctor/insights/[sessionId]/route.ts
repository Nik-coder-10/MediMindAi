import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { AppError } from "@/lib/api/errors";
import { AuthService } from "@/lib/auth/auth-guard";
import { ClinicalInsightService, DoctorReviewPayload } from "@/lib/clinical/insight.service";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/doctor/insights/[sessionId]
 * Retrieves all synthesized explainable clinical insights for a session.
 * RBAC: DOCTOR, ADMIN.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId;
    const { user: authUser } = await AuthService.requireSessionAccess(req, sessionId);

    // Verify role is Doctor or Admin
    if (authUser.role !== "DOCTOR" && authUser.role !== "ADMIN") {
      return apiError(AppError.forbidden("Only attending physicians and administrators may access clinical insights."));
    }

    const insights = await ClinicalInsightService.generateSessionInsights(sessionId);

    return apiSuccess({
      sessionId,
      totalCount: insights.length,
      insights,
    });
  } catch (error) {
    return apiError(error);
  }
}

/**
 * POST /api/doctor/insights/[sessionId]
 * Doctor reviews, confirms, overrides, or rejects an insight.
 * RBAC: DOCTOR only.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId;
    const { user: authUser } = await AuthService.requireSessionAccess(req, sessionId);

    if (authUser.role !== "DOCTOR" && authUser.role !== "ADMIN") {
      return apiError(AppError.forbidden("Only attending physicians may review clinical insights."));
    }

    const body = await req.json();
    const { insightId, decision, overrideText, reason } = body;

    if (!insightId || !decision) {
      return apiError(AppError.badRequest("insightId and decision ('CONFIRMED' | 'REJECTED' | 'OVERRIDDEN') are required."));
    }

    const reviewed = await ClinicalInsightService.reviewInsight({
      insightId,
      doctorId: authUser.id || "doc-attending-default",
      decision,
      overrideText,
      reason,
    });

    return apiSuccess({
      message: "Clinical insight review recorded successfully.",
      reviewedInsight: reviewed,
    });
  } catch (error) {
    return apiError(error);
  }
}
