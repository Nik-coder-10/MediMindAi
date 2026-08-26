import { prisma } from "@/lib/db/prisma";

export interface LogAuditParams {
  actorId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  ipAddress?: string | null;
  metadata?: Record<string, unknown>;
}

export class AuditService {
  /**
   * Records an immutable audit log entry for clinical/system actions
   */
  static async log(params: LogAuditParams) {
    try {
      return await prisma.auditLog.create({
        data: {
          actorId: params.actorId,
          action: params.action,
          resourceType: params.resourceType,
          resourceId: params.resourceId,
          ipAddress: params.ipAddress,
          metadata: params.metadata as any,
        },
      });
    } catch (e) {
      console.warn("⚠️ AuditLog write skipped (DB not yet connected):", params.action);
      return null;
    }
  }

  /**
   * Lists recent audit logs with pagination
   */
  static async listLogs(limit: number = 50, offset: number = 0) {
    try {
      return await prisma.auditLog.findMany({
        take: limit,
        skip: offset,
        orderBy: { timestamp: "desc" },
      });
    } catch {
      return [];
    }
  }
}
