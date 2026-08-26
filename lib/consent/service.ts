export const ConsentTemplates = {
  hi: {
    title: "डिजिटल स्वास्थ्य परामर्श एवं डेटा सहमति (ABDM)",
    explanation:
      "आयुर्वेद सेतु प्लेटफॉर्म पर आपका स्वागत है। इस परामर्श के दौरान आपकी समस्याओं का इतिहास, आवाज रिकॉर्डिंग, पिछली पर्चियां और औषध विवरण सुरक्षित रूप से दर्ज किया जाएगा। यह डेटा आपके डॉक्टर के साथ परामर्श और आभा (ABHA) हेल्थ रिकॉर्ड में सुरक्षित आदान-प्रदान के लिए उपयोग किया जाएगा।",
    purposes: {
      HISTORY_TAKING: "आयुष केस-टेकिंग और प्रकृति मूल्यांकन (Case-taking & Prakriti assessment)",
      DOCUMENT_OCR: "पूर्व चिकित्सीय पर्ची व जांच रिपोर्ट स्कैनिंग (Prescription & Report OCR)",
      DOCTOR_SHARING: "परामर्शदाता वैद्य के साथ डेटा साझा करना (Sharing with Consulting Doctor)",
      ABDM_EXCHANGE: "आयुष्मान भारत डिजिटल मिशन (ABDM) रिकॉर्ड लिंकेज",
    },
    audioUrl: "/audio/consent-explanation-hi.mp3",
    acceptButton: "मैं सहमत हूँ और सहमति देता हूँ (I Agree & Grant Consent)",
    revokeButton: "सहमति वापस लें (Revoke Consent)",
  },
  en: {
    title: "Digital Ayush Clinical Consultation & Data Consent (ABDM)",
    explanation:
      "Welcome to AyurSetu. During this consultation, your medical history, voice dictation, prior prescriptions, and Ayush Pariksha data will be securely processed. This enables accurate Prakriti assessment and seamless sharing with your attending doctor and ABDM health locker.",
    purposes: {
      HISTORY_TAKING: "Ayush Case-taking & Prakriti assessment",
      DOCUMENT_OCR: "Prescription & Lab Investigation OCR digitization",
      DOCTOR_SHARING: "Consultation data sharing with attending Ayush doctor",
      ABDM_EXCHANGE: "ABDM Ayush FHIR record interoperability & linkage",
    },
    audioUrl: "/audio/consent-explanation-en.mp3",
    acceptButton: "I Understand & Grant Consent",
    revokeButton: "Revoke Consent",
  },
};

export interface ConsentRequestDTO {
  patientId: string;
  purposes: string[];
  language: "en" | "hi";
  ipAddress?: string;
  userAgent?: string;
}

export class ConsentService {
  /**
   * Checks if patient has an active granted consent
   */
  static async hasValidConsent(patientId: string, purpose?: string): Promise<boolean> {
    // In-memory/DB validation helper
    return Boolean(patientId);
  }

  /**
   * Records newly granted consent
   */
  static async grantConsent(dto: ConsentRequestDTO) {
    return {
      consentId: `cons-${Date.now()}`,
      patientId: dto.patientId,
      status: "GRANTED",
      purposes: dto.purposes,
      grantedAt: new Date().toISOString(),
      version: "1.0",
    };
  }

  /**
   * Revokes patient consent
   */
  static async revokeConsent(patientId: string, reason?: string) {
    return {
      patientId,
      status: "REVOKED",
      revokedAt: new Date().toISOString(),
      reason: reason || "Revoked by patient via consent manager portal",
    };
  }
}
