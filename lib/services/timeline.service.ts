import { prisma } from "@/lib/db/prisma";
import { AbnormalLabEvaluator, EvaluatedLabResult } from "@/lib/clinical/lab-ranges";

export interface TimelineEventDTO {
  id: string;
  patientId: string;
  eventDate: string;
  title: string;
  description: string;
  category: "DIAGNOSIS" | "MEDICATION" | "LAB" | "ENCOUNTER" | "PROCEDURE";
  sourceDocumentId?: string;
  isAbnormal?: boolean;
  metadata?: Record<string, unknown>;
}

export class MedicalTimelineService {
  /**
   * Synthesizes longitudinal events from documents, extracted entities, structured observations, and encounters
   */
  static async getPatientTimeline(patientId: string): Promise<TimelineEventDTO[]> {
    let dbEvents: any[] = [];
    try {
      dbEvents = await prisma.medicalTimelineEvent.findMany({
        where: { patientId },
        orderBy: { eventDate: "desc" },
      });
    } catch {
      // In-memory fallback
    }

    const legacyEvents: TimelineEventDTO[] = dbEvents.map((e) => ({
      id: e.id,
      patientId: e.patientId,
      eventDate: e.eventDate.toISOString().split("T")[0],
      title: e.title,
      description: e.description || "",
      category: e.category as any,
      sourceDocumentId: e.sourceDocumentId || undefined,
      metadata: e.metadata as any,
    }));

    // Incorporate dynamic projected events from LongitudinalIntelligenceService
    try {
      const { LongitudinalIntelligenceService } = await import("@/lib/clinical/longitudinal.service");
      const derived = await LongitudinalIntelligenceService.getLongitudinalTimeline(patientId, { limit: 20 });
      for (const d of derived) {
        let cat: "DIAGNOSIS" | "MEDICATION" | "LAB" | "ENCOUNTER" | "PROCEDURE" = "ENCOUNTER";
        if (d.type === "RED_FLAG_ALERT" || d.type === "DOCTOR_ASSESSMENT") cat = "DIAGNOSIS";
        if (d.type === "DOCUMENT_ANALYZED") cat = "PROCEDURE";
        legacyEvents.push({
          id: d.id,
          patientId,
          eventDate: d.date,
          title: d.title,
          description: d.description,
          category: cat,
          isAbnormal: d.isAbnormal,
          metadata: d.metadata,
        });
      }
    } catch {
      // Non-fatal fallback
    }

    return legacyEvents.sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
  }

  /**
   * Evaluates all extracted lab entities and returns flagged abnormal tests
   */
  static evaluateAbnormalLabs(
    rawLabs: Array<{ testName: string; value: number | string; unit?: string }>
  ): EvaluatedLabResult[] {
    return rawLabs
      .map((l) => AbnormalLabEvaluator.evaluateTest(l.testName, l.value))
      .filter((res) => res.flag !== "NORMAL");
  }
}
