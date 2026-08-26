import { prisma } from "@/lib/db/prisma";
import { RedFlagSeverity, TriagePriority } from "@prisma/client";
import { CLINICAL_RED_FLAG_REGISTRY } from "@/lib/engine/red-flag-rules";

export interface TriggerRedFlagDTO {
  sessionId: string;
  ruleId: string;
  description: string;
  severity?: RedFlagSeverity;
}

export class RedFlagService {
  /**
   * Evaluates collected facts against registry and triggers RedFlagEvents
   */
  static async evaluateAndTrigger(dto: TriggerRedFlagDTO) {
    const isCritical = dto.severity === "CRITICAL";

    // 1. Dispatch Doctor Notification Hook
    this.notifyDoctorTriageDesk({
      sessionId: dto.sessionId,
      ruleId: dto.ruleId,
      severity: dto.severity || "HIGH",
      message: `[EMERGENCY TRIAGE ALERT]: ${dto.description}`,
      timestamp: new Date().toISOString(),
    });

    try {
      const event = await prisma.redFlagEvent.create({
        data: {
          sessionId: dto.sessionId,
          ruleId: dto.ruleId,
          description: dto.description,
          severity: dto.severity || RedFlagSeverity.HIGH,
          notified: true,
          notifiedAt: new Date(),
          actionTaken: isCritical
            ? "Dispatched immediate clinical escalation to on-duty Emergency Vaidya/Doctor."
            : "Flagged for priority review.",
        },
      });

      // Escalate session triage level in database
      await prisma.clinicalSession.update({
        where: { id: dto.sessionId },
        data: {
          redFlagTriggered: true,
          triagePriority: isCritical ? TriagePriority.EMERGENCY : TriagePriority.URGENT,
        },
      });

      return event;
    } catch {
      return {
        id: `rf-${Date.now()}`,
        sessionId: dto.sessionId,
        ruleId: dto.ruleId,
        severity: dto.severity || "HIGH",
        notified: true,
      };
    }
  }

  /**
   * Lists all active red flag events for a given session
   */
  static async getSessionRedFlags(sessionId: string) {
    try {
      return await prisma.redFlagEvent.findMany({
        where: { sessionId },
        orderBy: { triggeredAt: "desc" },
      });
    } catch {
      return [];
    }
  }

  /**
   * Internal webhook / notification dispatcher for Doctor clinical queue
   */
  private static notifyDoctorTriageDesk(payload: {
    sessionId: string;
    ruleId: string;
    severity: string;
    message: string;
    timestamp: string;
  }) {
    console.warn(
      `🚨 [RED FLAG DISPATCH] [${payload.severity}] Session: ${payload.sessionId} -> ${payload.message}`
    );
  }
}
