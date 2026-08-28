import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { AuthService } from "@/lib/auth/auth-guard";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await AuthService.requireDoctor(req);

    const { searchParams } = new URL(req.url);
    const priorityFilter = searchParams.get("priority");


    const sessions = await prisma.clinicalSession.findMany({
      where: {
        deletedAt: null,
        ...(priorityFilter ? { triagePriority: priorityFilter as any } : {}),
      },
      include: {
        patient: { include: { user: true } },
        chiefComplaints: true,
        redFlagEvents: true,
        clinicalSummary: true,
      },
      orderBy: [
        { redFlagTriggered: "desc" },
        { startedAt: "desc" },
      ],
      take: 50,
    });

    return apiSuccess({
      totalCount: sessions.length,
      emergencyCount: sessions.filter((s: any) => s.triagePriority === "EMERGENCY").length,
      urgentCount: sessions.filter((s: any) => s.triagePriority === "URGENT").length,
      queue: sessions,
    });
  } catch (error) {
    console.error("Doctor dashboard queue query failed:", error);
    return apiError(error);
  }
}

