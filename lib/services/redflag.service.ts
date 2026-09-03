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
   * Evaluates an array of clinical observations and flags triggered rules
   */
  static evaluateObservations(observations: Array<{
    code?: string;
    value?: string | null;
    rawText?: string | null;
    severity?: string | null;
  }>): {
    highestSeverity: "CRITICAL" | "HIGH" | "NONE";
    triggeredRules: Array<{ ruleId: string; severity: string; description: string }>;
  } {
    const triggeredRules: Array<{ ruleId: string; severity: string; description: string }> = [];

    for (const obs of observations) {
      const text = `${obs.code || ""} ${obs.value || ""} ${obs.rawText || ""}`.toLowerCase();
      
      // Cardiac / Chest Pain Emergency rules
      if (
        (text.includes("chest") && (text.includes("radiat") || text.includes("arm") || text.includes("jaw"))) ||
        (text.includes("chest") && text.includes("diaphoresis")) ||
        (text.includes("chest") && (text.includes("sweat") || text.includes("crushing")))
      ) {
        triggeredRules.push({
          ruleId: "RF_ACS_RADIATION",
          severity: "CRITICAL",
          description: "Chest pain radiating to left arm or accompanied by diaphoresis. Suspected ACS.",
        });
      }

      // Neurological / Stroke rules
      if (
        text.includes("thunderclap") ||
        (text.includes("facial") && text.includes("droop")) ||
        (text.includes("slur") && text.includes("speech")) ||
        (text.includes("stiff") && text.includes("neck") && text.includes("fever"))
      ) {
        triggeredRules.push({
          ruleId: "RF_STROKE_FAST_SIGNS",
          severity: "CRITICAL",
          description: "Acute neurological deficit or severe sudden headache.",
        });
      }

      // GI Hemorrhage rules
      if (text.includes("vomit") && text.includes("blood") || text.includes("melena")) {
        triggeredRules.push({
          ruleId: "RF_GI_BLEED_HEMATEMESIS",
          severity: "CRITICAL",
          description: "Active gastrointestinal hemorrhage.",
        });
      }
    }

    const hasCritical = triggeredRules.some((r) => r.severity === "CRITICAL");
    const hasHigh = triggeredRules.some((r) => r.severity === "HIGH");
    const highestSeverity = hasCritical ? "CRITICAL" : hasHigh ? "HIGH" : "NONE";

    return {
      highestSeverity,
      triggeredRules,
    };
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
  private static async notifyDoctorTriageDesk(payload: {
    sessionId: string;
    ruleId: string;
    severity: string;
    message: string;
    timestamp: string;
  }) {
    console.warn(
      `🚨 [RED FLAG DISPATCH] [${payload.severity}] Session: ${payload.sessionId} -> ${payload.message}`
    );

    try {
      const { NotificationService } = await import("@/lib/services/notification.service");
      const shortToken = `#AYUR-${payload.sessionId.replace(/-/g, "").slice(0, 4).toUpperCase()}`;
      await NotificationService.notify({
        type: "RED_FLAG",
        severity: payload.severity === "CRITICAL" ? "CRITICAL" : "HIGH",
        sessionId: payload.sessionId,
        tokenNumber: shortToken,
        title: payload.severity === "CRITICAL"
          ? "🚨 आपातकालीन रेड-फ्लैग (Critical Emergency Alert)"
          : "⚠️ उच्च प्राथमिकता चेतावनी (High Priority Alert)",
        message: payload.message,
        metadata: { ruleId: payload.ruleId },
      });
    } catch (e) {
      console.warn("NotificationService dispatch warning:", e);
    }
  }
}
