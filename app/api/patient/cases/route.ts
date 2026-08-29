import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { AuthService } from "@/lib/auth/auth-guard";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * GET /api/patient/cases
 * Retrieves all clinical sessions belonging to the authenticated patient.
 * Backed solely by the PostgreSQL database.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await AuthService.requireUser(req);

    // Determine target patientId
    let patientId = user.patientProfile?.id;
    if (!patientId && (user.role === Role.DOCTOR || user.role === Role.ADMIN)) {
      const { searchParams } = new URL(req.url);
      patientId = searchParams.get("patientId") || undefined;
    }

    if (!patientId) {
      // Find patient profile if exists
      const patient = await prisma.patientProfile.findFirst({
        where: { userId: user.id },
      });
      patientId = patient?.id;
    }

    if (!patientId) {
      return apiSuccess({
        totalCount: 0,
        cases: [],
      });
    }

    const sessions = await prisma.clinicalSession.findMany({
      where: {
        patientId,
        deletedAt: null,
      },
      include: {
        chiefComplaints: true,
        clinicalSummary: true,
        redFlagEvents: true,
        doctor: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        startedAt: "desc",
      },
    });

    const formattedCases = sessions.map((session) => {
      // Deterministic token number based on session ID slice
      const shortToken = session.id.replace(/-/g, "").slice(0, 4).toUpperCase();
      const tokenNumber = `#AYUR-${shortToken}`;

      return {
        id: session.id,
        tokenNumber,
        status: session.status,
        triagePriority: session.triagePriority,
        startedAt: session.startedAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
        completedAt: session.completedAt ? session.completedAt.toISOString() : null,
        chiefComplaint: session.chiefComplaints?.[0]?.symptomName || "Consultation Intake",
        redFlagCount: session.redFlagEvents.length,
        hasSummary: !!session.clinicalSummary,
        summaryStatus: session.clinicalSummary?.status || null,
        doctorName: session.doctor
          ? `Dr. Vaidya (${session.doctor.specialization || "Clinical Officer"})`
          : null,
      };
    });

    return apiSuccess({
      totalCount: formattedCases.length,
      cases: formattedCases,
    });
  } catch (error) {
    return apiError(error);
  }
}
