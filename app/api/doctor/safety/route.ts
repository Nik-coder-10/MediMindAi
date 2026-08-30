import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { AppError } from "@/lib/api/errors";
import { AuthService } from "@/lib/auth/auth-guard";
import { DrugSafetyService } from "@/lib/clinical/drug-safety.service";
import { AuditService } from "@/lib/services/audit.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/doctor/safety/evaluate?sessionId=...
 * Evaluates medication safety matrix (drug-drug and drug-allergy interactions).
 */
export async function GET(req: NextRequest) {
  try {
    const user = await AuthService.requireDoctor(req);
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      throw AppError.badRequest("sessionId is required");
    }

    const alerts = await DrugSafetyService.evaluateSessionSafety(sessionId);

    return apiSuccess({
      sessionId,
      alertsCount: alerts.length,
      alerts,
      evaluatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return apiError(error);
  }
}

/**
 * POST /api/doctor/safety/acknowledge
 * Doctor acknowledges or dismisses a drug safety alert with clinical audit logging.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await AuthService.requireDoctor(req);
    const body = await req.json();
    const { sessionId, alertId, action, clinicalNote } = body;

    if (!sessionId || !alertId) {
      throw AppError.badRequest("sessionId and alertId are required");
    }

    // Audit Log the physician's acknowledgment/dismissal action
    await AuditService.log({
      actorId: user.id,
      action: "DRUG_SAFETY_ALERT_REVIEWED",
      resourceType: "ClinicalSession",
      resourceId: sessionId,
      metadata: {
        alertId,
        physicianAction: action || "REVIEWED_NO_ACTION_NEEDED", // "REVIEWED_NO_ACTION_NEEDED" | "ACTION_TAKEN" | "OVERRIDDEN"
        clinicalNote: clinicalNote || "Physician verified interaction profile.",
        doctorName: (user as any).name || user.email || user.id || "Attending Physician",
      },
    });

    return apiSuccess({
      success: true,
      alertId,
      status: "ACKNOWLEDGED",
      action: action || "REVIEWED_NO_ACTION_NEEDED",
      acknowledgedAt: new Date().toISOString(),
    });
  } catch (error) {
    return apiError(error);
  }
}
