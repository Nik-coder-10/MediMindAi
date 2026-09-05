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
      try {
        const patient = await prisma.patientProfile.findFirst({
          where: { userId: user.id },
        });
        patientId = patient?.id;
      } catch (profileErr) {
        console.warn("Patient cases profile DB fallback:", (profileErr as any)?.message);
      }
    }

    if (!patientId) {
      patientId = `pat-prof-${user.id}`;
    }

    // Find all clinical sessions for this patient from PostgreSQL (with resilient fallback)
    let sessions: any[] = [];
    try {
      sessions = await prisma.clinicalSession.findMany({
        where: {
          OR: [
            { patientId },
            { patient: { userId: user.id } },
          ],
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
    } catch (dbErr) {
      console.warn("Patient cases fetch DB fallback to memory store:", (dbErr as any)?.message);
    }

    // Merge in-memory sessions if database is offline or local
    const { inMemoryClinicalStore } = await import("@/lib/db/in-memory-store");
    const memSessions = inMemoryClinicalStore.getSessionsByPatient(patientId);

    const mergedMap = new Map<string, any>();
    memSessions.forEach((s) => mergedMap.set(s.id, s));
    sessions.forEach((s) => mergedMap.set(s.id, s));

    const finalSessions = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );

    const { formatAyurToken } = await import("@/lib/utils");
    const formattedCases = finalSessions.map((session) => {
      const tokenNumber = formatAyurToken(session.id);

      const startDate = session.startedAt instanceof Date ? session.startedAt : new Date(session.startedAt || Date.now());
      const updateDate = session.updatedAt instanceof Date ? session.updatedAt : new Date(session.updatedAt || Date.now());
      const completeDate = session.completedAt ? (session.completedAt instanceof Date ? session.completedAt : new Date(session.completedAt)) : null;

      return {
        id: session.id,
        tokenNumber,
        status: session.status,
        triagePriority: session.triagePriority,
        startedAt: startDate.toISOString(),
        updatedAt: updateDate.toISOString(),
        completedAt: completeDate ? completeDate.toISOString() : null,
        chiefComplaint: session.chiefComplaints?.[0]?.symptomName || "Consultation Intake",
        redFlagCount: session.redFlagEvents?.length || 0,
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
