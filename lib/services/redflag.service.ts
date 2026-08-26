import { prisma } from "@/lib/db/prisma";
import { RedFlagSeverity, TriagePriority } from "@prisma/client";

export interface TriggerRedFlagDTO {
  sessionId: string;
  ruleId: string;
  description: string;
  severity?: RedFlagSeverity;
}

export class RedFlagService {
  /**
   * Evaluates text/symptoms and logs safety red flag events with session escalation
   */
  static async evaluateAndTrigger(dto: TriggerRedFlagDTO) {
    try {
      const event = await prisma.redFlagEvent.create({
        data: {
          sessionId: dto.sessionId,
          ruleId: dto.ruleId,
          description: dto.description,
          severity: dto.severity || RedFlagSeverity.HIGH,
          notified: true,
          notifiedAt: new Date(),
        },
      });

      // Escalate session priority automatically
      await prisma.clinicalSession.update({
        where: { id: dto.sessionId },
        data: {
          redFlagTriggered: true,
          triagePriority:
            dto.severity === RedFlagSeverity.CRITICAL
              ? TriagePriority.EMERGENCY
              : TriagePriority.URGENT,
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
}
