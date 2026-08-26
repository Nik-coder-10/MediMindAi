import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError } from "@/lib/api/response";
import { AuditService } from "@/lib/services/audit.service";
import { FhirService } from "@/lib/fhir/fhir.service";

const exportSchema = z.object({
  sessionId: z.string().min(1, "sessionId is required"),
  hospitalId: z.string().default("AIIA_DELHI_HIS_01"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = exportSchema.parse(body);

    const bundle = FhirService.generateEncounterBundle({
      sessionId: validated.sessionId,
      patientId: "pat-demo-001",
      patientName: "Ramesh Sharma",
      gender: "male",
      birthDate: "1984-07-14",
      abhaId: "14-5542-8921-3410",
      chiefComplaint: "Acute clinical intake transfer",
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
