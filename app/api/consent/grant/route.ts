import { NextRequest, NextResponse } from "next/server";
import { ConsentService } from "@/lib/consent/service";
import { AuthService } from "@/lib/auth/auth-guard";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function POST(req: NextRequest) {
  try {
    const user = await AuthService.requireUser(req);
    const body = await req.json();

    const result = await ConsentService.grantConsent({
      ...body,
      patientId: user.patientProfile?.id || body.patientId,
      ipAddress: req.headers.get("x-forwarded-for") || req.ip || "127.0.0.1",
    });

    return apiSuccess(result, 201);
  } catch (error) {
    return apiError(error);
  }
}

