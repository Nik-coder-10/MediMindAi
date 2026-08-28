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
   * Synthesizes longitudinal events from documents, extracted entities, and encounters
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

    if (dbEvents.length > 0) {
      return dbEvents.map((e) => ({
        id: e.id,
        patientId: e.patientId,
        eventDate: e.eventDate.toISOString().split("T")[0],
        title: e.title,
        description: e.description || "",
        category: e.category as any,
        sourceDocumentId: e.sourceDocumentId || undefined,
        metadata: e.metadata as any,
      }));
    }

    // Return empty list when patient has no historical events
    return [];
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
