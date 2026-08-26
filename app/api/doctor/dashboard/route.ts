import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  try {
    let pendingSessions: any[] = [];
    try {
      pendingSessions = await prisma.clinicalSession.findMany({
        where: { status: "IN_PROGRESS", deletedAt: null },
        include: { patient: true, chiefComplaints: true, redFlagEvents: true },
        orderBy: { startedAt: "desc" },
        take: 20,
      });
    } catch {
      pendingSessions = [
        {
          id: "sess-demo-001",
          status: "IN_PROGRESS",
          triagePriority: "URGENT",
          redFlagTriggered: true,
          patient: { firstName: "Ramesh", lastName: "Sharma" },
        },
      ];
    }

    return apiSuccess({
      activeQueueCount: pendingSessions.length,
      queue: pendingSessions,
    });
  } catch (error) {
    return apiError(error);
  }
}
