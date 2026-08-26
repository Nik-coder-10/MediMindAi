import { ConsentRequestPayload, ConsentResponse } from "./types";

export class ABDMConsentManager {
  private gatewayUrl: string;

  constructor() {
    this.gatewayUrl = process.env.ABDM_GATEWAY_URL || "https://dev.abdm.gov.in/gateway/v0.5";
  }

  async requestConsent(payload: ConsentRequestPayload): Promise<ConsentResponse> {
    // Placeholder integration for ABDM Gateway Consent Request API
    return {
      consentRequestId: `req-${Date.now()}`,
      status: "REQUESTED",
    };
  }

  async fetchConsentStatus(consentRequestId: string): Promise<ConsentResponse> {
    return {
      consentRequestId,
      status: "GRANTED",
      artefactId: `artefact-${Date.now()}`,
    };
  }
}

export const consentManager = new ABDMConsentManager();
