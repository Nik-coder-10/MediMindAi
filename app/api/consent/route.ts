import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api/response";
import { ConsentService } from "@/lib/consent/service";

const grantConsentSchema = z.object({
  patientId: z.string().min(1, "patientId is required"),
  purposes: z.array(z.string()).min(1, "At least one consent purpose is required"),
  language: z.enum(["hi", "en"]).default("hi"),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");
    const hasConsent = await ConsentService.hasValidConsent(patientId || "pat_demo");
    return apiSuccess({
      patientId,
      hasActiveConsent: hasConsent,
      version: "1.0",
      abdmCompliant: true,
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = grantConsentSchema.parse(body);
    const result = await ConsentService.grantConsent(validated as any);
    return apiSuccess(result, 201);
  } catch (error) {
    return apiError(error);
  }
}
