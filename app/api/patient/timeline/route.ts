import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { MedicalTimelineService } from "@/lib/services/timeline.service";
import { AuthService } from "@/lib/auth/auth-guard";
import { Role } from "@prisma/client";
import { AppError } from "@/lib/api/errors";

export async function GET(req: NextRequest) {
  try {
    const user = await AuthService.requireUser(req);
    const { searchParams } = new URL(req.url);
    const requestedPatientId = searchParams.get("patientId");

    let targetPatientId = user.patientProfile?.id;

    if (user.role === Role.DOCTOR || user.role === Role.ADMIN) {
      if (!requestedPatientId) {
        throw AppError.badRequest("patientId parameter is required for doctor/admin lookup.");
      }
      targetPatientId = requestedPatientId;
    } else if (user.role === Role.PATIENT) {
      if (requestedPatientId && requestedPatientId !== user.patientProfile?.id) {
        throw AppError.forbidden("You are only authorized to access your own medical timeline.");
      }
      if (!targetPatientId) {
        throw AppError.notFound("Patient profile not found.");
      }
    }

    const timeline = await MedicalTimelineService.getPatientTimeline(targetPatientId!);

    return apiSuccess({
      patientId: targetPatientId,
      eventCount: timeline.length,
      timeline,
    });
  } catch (error) {
    return apiError(error);
  }
}

