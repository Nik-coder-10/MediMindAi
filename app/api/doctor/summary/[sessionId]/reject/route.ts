import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api/response";
import { SummaryService } from "@/lib/services/summary.service";
import { AuthService } from "@/lib/auth/auth-guard";

export const dynamic = "force-dynamic";

const rejectSchema = z.object({
  reason: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId;
    await AuthService.requireDoctor(req);
    await AuthService.requireSessionAccess(req, sessionId);

    const body = await req.json().catch(() => ({}));
    const validated = rejectSchema.parse(body);
    const rejected = await SummaryService.rejectSummary(sessionId, validated.reason);
    return apiSuccess(rejected, 200);
  } catch (error) {
    return apiError(error);
  }
}

