import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { RedFlagService } from "@/lib/services/redflag.service";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    const flags = await RedFlagService.getSessionRedFlags(sessionId);
    return apiSuccess({ sessionId, redFlags: flags, count: flags.length });
  } catch (error) {
    return apiError(error);
  }
}
