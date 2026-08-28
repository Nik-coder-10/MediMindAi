import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/api/errors";
import { AuditService } from "./audit.service";
import { SessionStatus, TriagePriority } from "@prisma/client";

export interface CreateSessionDTO {
  patientId: string;
  language?: string;
  triagePriority?: TriagePriority;
  notes?: string;
  actorId?: string;
  ipAddress?: string;
}

export class SessionService {
  /**
   * Creates a new clinical case-taking session
   */
  static async createSession(dto: CreateSessionDTO) {
    if (!dto.patientId) {
      throw AppError.badRequest("patientId is required to start a clinical session");
    }

    try {
      const session = await prisma.clinicalSession.create({
        data: {
          patientId: dto.patientId,
          language: dto.language || "hi",
          triagePriority: dto.triagePriority || TriagePriority.ROUTINE,
          status: SessionStatus.IN_PROGRESS,
          notes: dto.notes,
        },
      });

      await AuditService.log({
        actorId: dto.actorId,
        action: "CLINICAL_SESSION_START",
        resourceType: "ClinicalSession",
        resourceId: session.id,
        ipAddress: dto.ipAddress,
        metadata: { language: dto.language, priority: dto.triagePriority },
      });

      return session;
    } catch (e: any) {
      console.error("Failed to create ClinicalSession in database:", e);
      throw AppError.internal("Unable to start clinical case-taking session. Please verify database connectivity.");
    }
  }

  /**
   * Retrieves active session by session ID with relations
   */
  static async getSessionById(sessionId: string) {
    if (!sessionId) throw AppError.badRequest("sessionId is required");

    try {
      const session = await prisma.clinicalSession.findUnique({
        where: { id: sessionId },
        include: {
          patient: true,
          doctor: true,
          chiefComplaints: true,
          conversationTurns: { orderBy: { timestamp: "asc" } },
          redFlagEvents: true,
          medicalDocuments: true,
          clinicalSummary: true,
          ayurvedaAssessment: true,
        },
      });
      if (!session) throw AppError.notFound(`ClinicalSession ${sessionId} not found`);
      return session;
    } catch (e: any) {
      if (e instanceof AppError) throw e;
      console.error(`Failed to retrieve ClinicalSession ${sessionId}:`, e);
      throw AppError.internal(`Unable to load clinical session data. Please try again.`);
    }
  }

  /**
   * Completes a clinical session
   */
  static async completeSession(sessionId: string, actorId?: string) {
    try {
      const session = await prisma.clinicalSession.update({
        where: { id: sessionId },
        data: {
          status: SessionStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      await AuditService.log({
        actorId,
        action: "CLINICAL_SESSION_COMPLETE",
        resourceType: "ClinicalSession",
        resourceId: sessionId,
      });

      return session;
    } catch (e: any) {
      console.error(`Failed to complete ClinicalSession ${sessionId}:`, e);
      throw AppError.internal("Unable to mark clinical session as completed. Please try again.");
    }
  }
}

