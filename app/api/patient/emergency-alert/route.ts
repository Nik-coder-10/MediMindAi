import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { NotificationService } from "@/lib/services/notification.service";
import { AuditService } from "@/lib/services/audit.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/patient/emergency-alert
 *
 * Patient-initiated "Alert Medical Staff / Call 108" action.
 * Creates a CRITICAL notification visible on the doctor side in real-time.
 * Does NOT require doctor/admin auth — only the active patient session token.
 *
 * Body: { sessionId, chiefComplaint, tokenNumber?, language? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, chiefComplaint, tokenNumber, language } = body;

    if (!sessionId) {
      return apiError({ status: 400, message: "sessionId is required" });
    }

    const { formatAyurToken } = await import("@/lib/utils");
    const token = tokenNumber || formatAyurToken(sessionId);

    // 1. Create a CRITICAL real-time notification for doctors
    const notification = await NotificationService.notify({
      type: "RED_FLAG",
      severity: "CRITICAL",
      sessionId,
      patientName: language === "hi" ? "रोगी (Patient)" : "Patient",
      tokenNumber: token,
      chiefComplaint: chiefComplaint || "Emergency alert triggered by patient",
      title: "🚨 रोगी ने आपातकालीन सहायता माँगी (Patient Requested Emergency Assistance)",
      message: `Patient ${token} has activated the emergency alert button at the intake kiosk. Possible critical symptoms detected. Immediate staff attendance required.`,
      metadata: {
        alertSource: "PATIENT_INITIATED",
        language: language || "en",
        triggeredAt: new Date().toISOString(),
      },
    });

    // 2. Audit log the patient-initiated action
    try {
      await AuditService.log({
        action: "PATIENT_EMERGENCY_ALERT_TRIGGERED",
        resourceType: "ClinicalSession",
        resourceId: sessionId,
        metadata: {
          notificationId: notification.id,
          tokenNumber: token,
          chiefComplaint,
          language,
          source: "KIOSK_EMERGENCY_BUTTON",
        },
      });
    } catch {
      // Non-fatal audit failure
    }

    return apiSuccess({
      notificationId: notification.id,
      tokenNumber: token,
      message: "Staff notified successfully",
      messageHindi: "कर्मचारियों को सूचित किया गया है",
    });
  } catch (error) {
    return apiError(error);
  }
}
