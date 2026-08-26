import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { SummaryService } from "@/lib/services/summary.service";

export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId;
    const accepted = await SummaryService.acceptSummary(sessionId);
    return apiSuccess(accepted, 200);
  } catch (error) {
    return apiError(error);
  }
}
