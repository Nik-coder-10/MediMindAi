import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api/response";
import { AuditService } from "@/lib/services/audit.service";
import { AuthService } from "@/lib/auth/auth-guard";

export const dynamic = "force-dynamic";

let systemFeatureFlags = {
  voiceEnabled: true,
  ayushModeEnabled: true,
  maxQuestionsPerSession: 12,
  autoTriageEmergencyDispatch: true,
  ocrConfidenceThreshold: 0.85,
  supportedLanguages: ["hi", "en", "ta", "mr", "bn"],
};

const settingsSchema = z.object({
  voiceEnabled: z.boolean().optional(),
  ayushModeEnabled: z.boolean().optional(),
  maxQuestionsPerSession: z.number().int().min(4).max(30).optional(),
  autoTriageEmergencyDispatch: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    return apiSuccess(systemFeatureFlags);
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    await AuthService.requireAdmin(req);
    const body = await req.json();
    const validated = settingsSchema.parse(body);


    systemFeatureFlags = { ...systemFeatureFlags, ...validated };

    await AuditService.log({
      action: "ADMIN_UPDATE_FEATURE_FLAGS",
      resourceType: "SystemSettings",
      metadata: validated,
    });

    return apiSuccess({ status: "UPDATED", settings: systemFeatureFlags });
  } catch (error) {
    return apiError(error);
  }
}
