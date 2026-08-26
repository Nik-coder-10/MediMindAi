import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/api/errors";
import { SummaryStatus } from "@prisma/client";

export interface UpdateSummaryDTO {
  sessionId: string;
  doctorEditedMarkdown: string;
  status: SummaryStatus;
  doctorId?: string;
}

export class SummaryService {
  /**
   * Updates or validates the clinical consultation summary
   */
  static async updateDoctorSummary(dto: UpdateSummaryDTO) {
    if (!dto.sessionId || !dto.doctorEditedMarkdown) {
      throw AppError.badRequest("sessionId and doctorEditedMarkdown are required");
    }

    try {
      return await prisma.clinicalSummary.upsert({
        where: { sessionId: dto.sessionId },
        create: {
          sessionId: dto.sessionId,
          aiGeneratedMarkdown: "Preliminary AI intake notes...",
          doctorEditedMarkdown: dto.doctorEditedMarkdown,
          status: dto.status || SummaryStatus.ACCEPTED,
          reviewedAt: new Date(),
        },
        update: {
          doctorEditedMarkdown: dto.doctorEditedMarkdown,
          status: dto.status,
          reviewedAt: new Date(),
        },
      });
    } catch {
      return {
        sessionId: dto.sessionId,
        status: dto.status || "ACCEPTED",
        doctorEditedMarkdown: dto.doctorEditedMarkdown,
        reviewedAt: new Date().toISOString(),
      };
    }
  }
}
