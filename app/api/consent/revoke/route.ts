import { NextRequest } from "next/server";
import { ConsentService } from "@/lib/consent/service";
import { AuthService } from "@/lib/auth/auth-guard";
import { apiError, apiSuccess } from "@/lib/api/response";
import { Role } from "@prisma/client";
import { AppError } from "@/lib/api/errors";

export async function POST(req: NextRequest) {
  try {
    const user = await AuthService.requireUser(req);
    const body = await req.json();

    let targetPatientId = user.patientProfile?.id;
    if (user.role === Role.ADMIN) {
      targetPatientId = body.patientId || targetPatientId;
    } else if (user.role === Role.PATIENT && body.patientId && body.patientId !== targetPatientId) {
      throw AppError.forbidden("You can only revoke consent for your own records.");
    }

    if (!targetPatientId) {
      throw AppError.badRequest("patientId is required for consent revocation.");
    }

    const result = await ConsentService.revokeConsent(targetPatientId, body.reason);
    return apiSuccess(result, 200);
  } catch (error) {
    return apiError(error);
  }
}

