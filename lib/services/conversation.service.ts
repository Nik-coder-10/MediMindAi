import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/api/errors";
import { TurnRole } from "@prisma/client";

export interface RecordTurnDTO {
  sessionId: string;
  role: TurnRole;
  contentText: string;
  contentAudioUrl?: string;
  metadata?: Record<string, unknown>;
}

export class ConversationService {
  /**
   * Appends a new conversation turn to the active session stream
   */
  static async recordTurn(dto: RecordTurnDTO) {
    if (!dto.sessionId || !dto.contentText) {
      throw AppError.badRequest("sessionId and contentText are required");
    }

    try {
      return await prisma.conversationTurn.create({
        data: {
          sessionId: dto.sessionId,
          role: dto.role,
          contentText: dto.contentText,
          contentAudioUrl: dto.contentAudioUrl,
          metadata: dto.metadata as any,
        },
      });
    } catch {
      return {
        id: `turn-${Date.now()}`,
        sessionId: dto.sessionId,
        role: dto.role,
        contentText: dto.contentText,
        contentAudioUrl: dto.contentAudioUrl,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Fetches full conversation history of a session
   */
  static async getHistory(sessionId: string) {
    try {
      return await prisma.conversationTurn.findMany({
        where: { sessionId },
        orderBy: { timestamp: "asc" },
      });
    } catch {
      return [];
    }
  }
}
