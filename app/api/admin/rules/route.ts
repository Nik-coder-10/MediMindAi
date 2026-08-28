import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api/response";
import { AuditService } from "@/lib/services/audit.service";
import { CLINICAL_RED_FLAG_REGISTRY } from "@/lib/engine/red-flag-rules";
import { AuthService } from "@/lib/auth/auth-guard";
import { dynamicRedFlagRules } from "@/lib/engine/dynamic-registry";

export const dynamic = "force-dynamic";

const ruleSchema = z.object({
  ruleId: z.string().min(1),
  field: z.string().min(1),
  expectedValue: z.unknown(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("HIGH"),
  description: z.string().min(1),
  isActive: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  try {
    const rules = Array.from(dynamicRedFlagRules.values());
    return apiSuccess({ count: rules.length, rules });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await AuthService.requireAdmin(req);
    const body = await req.json();
    const validated = ruleSchema.parse(body);


    dynamicRedFlagRules.set(validated.ruleId, validated);

    await AuditService.log({
      action: "ADMIN_UPSERT_RED_FLAG_RULE",
      resourceType: "RedFlagRule",
      resourceId: validated.ruleId,
      metadata: { ruleId: validated.ruleId, severity: validated.severity },
    });

    return apiSuccess({ status: "SAVED", rule: validated }, 201);
  } catch (error) {
    return apiError(error);
  }
}
