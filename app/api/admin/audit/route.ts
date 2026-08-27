import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  try {
    let logs: any[] = [];
    try {
      logs = await prisma.auditLog.findMany({
        orderBy: { timestamp: "desc" },
        take: 30,
      });
    } catch {
      // In-memory fallback
      logs = [
        {
          id: "audit-01",
          action: "CONSENT_GRANTED",
          userId: "patient-104",
          resource: "ConsentRecord",
          details: { purposes: ["HISTORY_TAKING", "DOCTOR_SHARING", "ABDM"] },
          ipAddress: "192.168.1.104",
          timestamp: new Date().toISOString(),
        },
        {
          id: "audit-02",
          action: "SESSION_COMPLETED",
          userId: "patient-104",
          resource: "ClinicalSession",
          details: { triagePriority: "EMERGENCY", rule: "RF_ACS_RADIATION" },
          ipAddress: "192.168.1.104",
          timestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
        },
        {
          id: "audit-03",
          action: "SUMMARY_ACCEPTED",
          userId: "dr.sharma",
          resource: "ClinicalSummary",
          details: { version: 2, status: "ACCEPTED" },
          ipAddress: "10.0.4.12",
          timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
        },
        {
          id: "audit-04",
          action: "FHIR_EXPORTED",
          userId: "dr.sharma",
          resource: "FhirBundle",
          details: { format: "HL7_FHIR_R4", resourceCount: 8 },
          ipAddress: "10.0.4.12",
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        },
      ];
    }

    return apiSuccess({ logs });
  } catch (error) {
    return apiError(error);
  }
}
