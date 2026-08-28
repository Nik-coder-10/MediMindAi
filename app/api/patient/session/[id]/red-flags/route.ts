import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { RedFlagService } from "@/lib/services/redflag.service";
import { AuthService } from "@/lib/auth/auth-guard";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    await AuthService.requireSessionAccess(req, sessionId);

    const flags = await RedFlagService.getSessionRedFlags(sessionId);
    return apiSuccess({ sessionId, redFlags: flags, count: flags.length });
  } catch (error) {
    return apiError(error);
  }
}

