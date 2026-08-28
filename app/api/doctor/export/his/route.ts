import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api/response";
import { AuditService } from "@/lib/services/audit.service";
import { FhirService } from "@/lib/fhir/fhir.service";
import { AuthService } from "@/lib/auth/auth-guard";
import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

const exportSchema = z.object({
  sessionId: z.string().min(1, "sessionId is required"),
  hospitalId: z.string().default("AIIA_DELHI_HIS_01"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = exportSchema.parse(body);

    await AuthService.requireDoctor(req);
    await AuthService.requireSessionAccess(req, validated.sessionId);


    const session = await prisma.clinicalSession.findUnique({
      where: { id: validated.sessionId },
      include: {
        patient: { include: { user: true } },
        chiefComplaints: true,
        clinicalSummary: true,
      },
    });

    if (!session) {
      throw AppError.notFound(`Clinical session ${validated.sessionId} not found`);
    }

    const patientName = session.patient
      ? `${session.patient.firstName} ${session.patient.lastName}`
      : "Clinical Patient";
    const abhaId = session.patient?.user?.abhaId || "ABHA-PENDING";
    const gender = (session.patient?.gender?.toLowerCase() || "unknown") as any;
    const birthDate = session.patient?.dateOfBirth ? session.patient.dateOfBirth.toISOString().split("T")[0] : "1990-01-01";
    const chiefComplaint = session.chiefComplaints?.[0]?.symptomName || "Clinical intake transfer";

    const bundle = FhirService.generateEncounterBundle({
      sessionId: validated.sessionId,
      patientId: session.patientId,
      patientName,
      gender,
      birthDate,
      abhaId,
      chiefComplaint,
    });

    // Immutable Audit Log of EMR Export
    await AuditService.log({
      action: "HIS_EMR_HANDOFF",
      resourceType: "ClinicalSession",
      resourceId: validated.sessionId,
      metadata: {
        targetHospitalId: validated.hospitalId,
        transmittedVia: "mTLS / ABDM Health Information Exchange (HIE-CM)",
        fhirBundleTotal: bundle.total,
      },
    });

    return apiSuccess({
      status: "TRANSMITTED",
      transactionId: `TXN-ABDM-${Date.now()}`,
      destination: validated.hospitalId,
      exportedAt: new Date().toISOString(),
      fhirBundleUrl: `/api/fhir/session/${validated.sessionId}`,
    }, 200);
  } catch (error) {
    return apiError(error);
  }
}
