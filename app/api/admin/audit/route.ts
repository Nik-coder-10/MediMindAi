import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { AuthService } from "@/lib/auth/auth-guard";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await AuthService.requireAdmin(req);

    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 50,
    });

    return apiSuccess({
      totalCount: logs.length,
      logs: logs.map((l) => ({
        id: l.id,
        action: l.action,
        actorId: l.actorId,
        actorEmail: null,
        resourceType: l.resourceType,
        resourceId: l.resourceId,
        ipAddress: l.ipAddress,
        metadata: l.metadata,
        timestamp: l.timestamp.toISOString(),
      })),
    });

  } catch (error) {
    return apiError(error);
  }
}

