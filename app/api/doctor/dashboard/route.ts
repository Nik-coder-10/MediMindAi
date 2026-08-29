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


    const statusFilter = searchParams.get("status");

    let sessions: any[] = [];
    try {
      sessions = await prisma.clinicalSession.findMany({
        where: {
          deletedAt: null,
          // Doctor queue shows submitted cases by default unless status is specified
          status: statusFilter
            ? (statusFilter as any)
            : { in: ["WAITING_FOR_DOCTOR", "COMPLETED", "IN_PROGRESS"] },
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
    } catch (dbErr) {
      console.warn("Doctor dashboard queue query fallback to in-memory store:", (dbErr as any)?.message);
    }

    // Merge in-memory queue sessions if database is offline or local
    const { inMemoryClinicalStore } = await import("@/lib/db/in-memory-store");
    const memQueue = inMemoryClinicalStore.getDoctorQueue(statusFilter || undefined, priorityFilter || undefined);

    const mergedMap = new Map<string, any>();
    memQueue.forEach((s) => mergedMap.set(s.id, s));
    sessions.forEach((s) => mergedMap.set(s.id, s));

    const finalSessions = Array.from(mergedMap.values()).sort((a, b) => {
      if (a.redFlagTriggered !== b.redFlagTriggered) {
        return a.redFlagTriggered ? -1 : 1;
      }
      return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
    });

    return apiSuccess({
      totalCount: finalSessions.length,
      emergencyCount: finalSessions.filter((s: any) => s.triagePriority === "EMERGENCY").length,
      urgentCount: finalSessions.filter((s: any) => s.triagePriority === "URGENT").length,
      queue: finalSessions,
    });
  } catch (error) {
    console.error("Doctor dashboard queue query failed:", error);
    return apiError(error);
  }
}

