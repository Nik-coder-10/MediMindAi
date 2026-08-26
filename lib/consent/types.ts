export type ConsentStatusType = "REQUESTED" | "GRANTED" | "DENIED" | "REVOKED" | "EXPIRED";

export interface ConsentRequestPayload {
  patientAbhaId: string;
  hiuId: string;
  purposeCode: string;
  purposeDescription: string;
  dateRange: {
    from: string;
    to: string;
  };
  hiTypes: Array<"DiagnosticReport" | "Prescription" | "DischargeSummary" | "OPConsultation">;
  expiry: string;
}

export interface ConsentResponse {
  consentRequestId: string;
  status: ConsentStatusType;
  artefactId?: string;
}
