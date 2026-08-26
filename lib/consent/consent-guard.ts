import { ConsentService } from "../services/consent.service";
import { AuditService } from "../services/audit.service";
import { AppError } from "../api/errors";

export class DpdpConsentGuard {
  /**
   * Enforces that active consent exists for a specific DPDP processing purpose
   */
  static async verifyConsentOrThrow(params: {
    userId: string;
    purpose: "HISTORY_TAKING" | "DOCUMENT_OCR" | "DOCTOR_SHARING" | "HOSPITAL_HIS" | "RESEARCH_ANONYMIZED";
    resourceId?: string;
  }) {
    const { userId, purpose, resourceId } = params;

    // Check if consent has been granted
    const hasConsent = await ConsentService.verifyConsent({
      userId,
      purpose,
    });

    if (!hasConsent) {
      // Audit security blockage
      await AuditService.log({
        action: "CONSENT_ENFORCEMENT_BLOCKED",
        resourceType: "ConsentArtifact",
        resourceId: resourceId || userId,
        metadata: { userId, attemptedPurpose: purpose, reason: "CONSENT_NOT_GRANTED_OR_REVOKED" },
      });

      throw new AppError(
        `DPDP_CONSENT_VIOLATION: Processing denied. Active patient consent for purpose '${purpose}' is missing or revoked.`,
        403,
        "CONSENT_REQUIRED"
      );
    }

    return true;
  }
}
