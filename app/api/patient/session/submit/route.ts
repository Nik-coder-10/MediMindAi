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

    const { session } = await AuthService.requireSessionAccess(req, validated.sessionId);

    // 1. Ensure ChiefComplaint is saved in database
    if (validated.chiefComplaint) {
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
    }

    // 2. Transition Session status to WAITING_FOR_DOCTOR
    const updatedSession = await prisma.clinicalSession.update({
      where: { id: session.id },
      data: {
        status: SessionStatus.WAITING_FOR_DOCTOR,
        updatedAt: new Date(),
      },
    });

    // 3. Generate and persist Clinical Summary
    let summary = null;
    try {
      summary = await SummaryService.generateSummary({ sessionId: session.id });
    } catch (sumErr) {
      console.warn("Auto-summary synthesis deferred:", sumErr);
    }

    // Deterministic token number
    const shortToken = session.id.replace(/-/g, "").slice(0, 4).toUpperCase();
    const tokenNumber = `#AYUR-${shortToken}`;

    return apiSuccess({
      sessionId: session.id,
      tokenNumber,
      status: updatedSession.status,
      summary,
      message: "Case successfully submitted to clinical triage queue.",
    });
  } catch (error) {
    return apiError(error);
  }
}
