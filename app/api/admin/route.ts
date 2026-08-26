import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { AuditService } from "@/lib/services/audit.service";

export async function GET(req: NextRequest) {
  try {
    const logs = await AuditService.listLogs(25);
    return apiSuccess({
      systemMorbidity: [
        { code: "NAM-AY-DIS-0194", name: "Amavata", cases: 1420 },
        { code: "NAM-AY-DIS-0051", name: "Amlapitta", cases: 980 },
        { code: "NAM-AY-DIS-0312", name: "Sandhigata Vata", cases: 750 },
      ],
      recentAuditLogs: logs,
    });
  } catch (error) {
    return apiError(error);
  }
}
