import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { SummaryService } from "@/lib/services/summary.service";
import { AuthService } from "@/lib/auth/auth-guard";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId;
    await AuthService.requireDoctor(req);
    await AuthService.requireSessionAccess(req, sessionId);

    const accepted = await SummaryService.acceptSummary(sessionId);
    return apiSuccess(accepted, 200);
  } catch (error) {
    return apiError(error);
  }
}

