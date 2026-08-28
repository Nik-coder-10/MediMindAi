import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { MedicalTimelineService } from "@/lib/services/timeline.service";
import { AuthService } from "@/lib/auth/auth-guard";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await AuthService.requireUser(req);
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    let extractedLabs: Array<{ testName: string; value: number | string }> = [];

    if (sessionId) {
      await AuthService.requireSessionAccess(req, sessionId);
      const docs = await prisma.medicalDocument.findMany({
        where: { sessionId, deletedAt: null },
        include: { extractedEntities: true },
      });

      docs.forEach((d: any) => {
        d.extractedEntities.forEach((ent: any) => {
          if (ent.type === "LAB") {
            extractedLabs.push({
              testName: ent.structuredData?.testName || ent.rawText,
              value: ent.structuredData?.value || ent.rawText,
            });
          }
        });
      });
    }

    const abnormalLabs = MedicalTimelineService.evaluateAbnormalLabs(extractedLabs);

    return apiSuccess({
      abnormalCount: abnormalLabs.length,
      abnormalLabs,
      disclaimer: "Non-diagnostic indicators for physician review only.",
    });
  } catch (error) {
    return apiError(error);
  }
}
