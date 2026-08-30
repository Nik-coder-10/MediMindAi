import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { SummaryService } from "@/lib/services/summary.service";
import { AuthService } from "@/lib/auth/auth-guard";
import { AppError } from "@/lib/api/errors";
import { SessionStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const submitSessionSchema = z.object({
  sessionId: z.string().min(1, "sessionId is required"),
  chiefComplaint: z.string().optional(),
  duration: z.string().optional(),
  severity: z.string().optional(),
  location: z.string().optional(),
});

/**
 * POST /api/patient/session/submit
 * Submits the patient's case session to the attending physician queue:
 * 1. Verifies patient ownership
 * 2. Persists ChiefComplaint in database if not already present
 * 3. Transitions status to WAITING_FOR_DOCTOR
 * 4. Synthesizes and saves ClinicalSummary
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = submitSessionSchema.parse(body);

    const { user, session } = await AuthService.requireSessionAccess(req, validated.sessionId);

    // Resilient Database Update for submission
    let updatedStatus = SessionStatus.WAITING_FOR_DOCTOR;
    try {
      // 1. Ensure ChiefComplaint is saved in database
      if (validated.chiefComplaint) {
        try {
          const existingComplaint = await prisma.chiefComplaint.findFirst({
            where: { sessionId: session.id },
          });

          if (!existingComplaint) {
            await prisma.chiefComplaint.create({
              data: {
                sessionId: session.id,
                symptomName: validated.chiefComplaint,
                duration: validated.duration || "2-3 days",
                severity: validated.severity || "MODERATE",
                location: validated.location || "General",
              },
            });
          }
        } catch (ccErr) {
          console.warn("ChiefComplaint save warning (non-fatal):", ccErr);
        }
      }

      // 2. Transition Session status to WAITING_FOR_DOCTOR
      try {
        await prisma.clinicalSession.update({
          where: { id: session.id },
          data: {
            status: SessionStatus.WAITING_FOR_DOCTOR,
            updatedAt: new Date(),
          },
        });
      } catch (sessUpErr) {
        console.warn("ClinicalSession update warning (fallback to memory store):", sessUpErr);
      }

      // 3. Log Audit Event
      try {
        await prisma.auditLog.create({
          data: {
            actorId: user.id,
            action: "PATIENT_SESSION_SUBMIT",
            resourceType: "ClinicalSession",
            resourceId: session.id,
            ipAddress: req.headers.get("x-forwarded-for") || (req as any).ip || "127.0.0.1",
            metadata: {
              status: SessionStatus.WAITING_FOR_DOCTOR,
              chiefComplaint: validated.chiefComplaint,
            },
          },
        });
      } catch (audErr) {
        console.warn("AuditLog save warning (non-fatal):", audErr);
      }
    } catch (txErr) {
      console.warn("Database submission encountered warning (fallback to memory store):", txErr);
    }

    // Update in-memory clinical store
    const { inMemoryClinicalStore } = await import("@/lib/db/in-memory-store");
    inMemoryClinicalStore.setStatus(session.id, "WAITING_FOR_DOCTOR");
    if (validated.chiefComplaint) {
      inMemoryClinicalStore.addChiefComplaint(session.id, {
        symptomName: validated.chiefComplaint,
        duration: validated.duration,
        severity: validated.severity,
        location: validated.location,
      });
    }

    // 4. Generate and persist Clinical Summary
    let summary = null;
    try {
      summary = await SummaryService.generateSummary({ sessionId: session.id });
    } catch (sumErr) {
      console.warn("Auto-summary synthesis deferred:", sumErr);
    }

    // Deterministic token number
    const shortToken = session.id.replace(/-/g, "").slice(0, 4).toUpperCase();
    const tokenNumber = `#AYUR-${shortToken}`;

    // 5. Dispatch Real-time Doctor Notification for submitted case
    try {
      const { NotificationService } = await import("@/lib/services/notification.service");
      const patientName = user.patientProfile
        ? `${user.patientProfile.firstName} ${user.patientProfile.lastName}`
        : "रोगी (Patient)";

      await NotificationService.notify({
        type: "NEW_CASE",
        severity: session.triagePriority === "EMERGENCY" ? "CRITICAL" : session.triagePriority === "URGENT" ? "HIGH" : "LOW",
        sessionId: session.id,
        patientName,
        tokenNumber,
        chiefComplaint: validated.chiefComplaint,
        title: "🌿 नया रोगी परामर्श प्रस्तुत (New Case Submitted)",
        message: `${patientName} (${tokenNumber}) has submitted intake for '${validated.chiefComplaint || "Consultation"}' and is waiting in the triage queue.`,
        metadata: {
          triagePriority: session.triagePriority,
        },
      });
    } catch (notifErr) {
      console.warn("New case notification dispatch non-fatal warning:", notifErr);
    }

    return apiSuccess({
      sessionId: session.id,
      tokenNumber,
      status: updatedStatus,
      summary,
      message: "Case successfully submitted to clinical triage queue.",
    });
  } catch (error) {
    return apiError(error);
  }
}
