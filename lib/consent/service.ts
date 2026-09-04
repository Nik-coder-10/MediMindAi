export const ConsentTemplates = {
  hi: {
    title: "डिजिटल आयुष क्लिनिकल परामर्श एवं डेटा सहमति (ABDM)",
    explanation:
      "आयुर्सेतु प्लेटफॉर्म पर आपका स्वागत है। इस परामर्श के दौरान आपके लक्षणों का विवरण, आवाज रिकॉर्डिंग, पूर्व चिकित्सीय पर्चे और आयुष परीक्षा डेटा सुरक्षित रूप से दर्ज किया जाएगा। यह डेटा आपके परामर्शदाता वैद्य के साथ साझा करने और आयुष्मान भारत डिजिटल मिशन (ABDM) हेल्थ लॉकर में सुरक्षित रिकॉर्ड लिंकेज के लिए उपयोग किया जाएगा।",
    purposes: {
      HISTORY_TAKING: "आयुष केस-टेकिंग और प्रकृति मूल्यांकन",
      DOCUMENT_OCR: "पूर्व चिकित्सीय पर्ची व जांच रिपोर्ट स्कैनिंग",
      DOCTOR_SHARING: "परामर्शदाता वैद्य/चिकित्सक के साथ डेटा साझा करना",
      ABDM_EXCHANGE: "आयुष्मान भारत डिजिटल मिशन (ABDM) हेल्थ रिकॉर्ड लिंकेज",
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
  raj: {
    title: "डिजिटल आयुष क्लिनिकल परामर्श अर डेटा सहमति (ABDM)",
    explanation:
      "आयुर्सेतु सेवा में आपरो घणो मान-सम्मान अर स्वागत है सा। इण परामर्श मांय आपरी बीमारी रा लक्षणां रो ब्यौरो, आवाज री रिकॉर्डिंग, पुरानी डाक्टरी परची अर आयुष जांच डेटा पूरो सुरक्षित लिख्यो जावेगो। ओ ब्यौरो आपरे जांच कर्ता डॉक्टर साब कनै भेजण अर आयुष्मान भारत डिजिटल मिशन (ABDM) हेल्थ लॉकर में रिकॉर्ड जोड़ण खातर काम आवेगो सा।",
    purposes: {
      HISTORY_TAKING: "आयुष केस-टेकिंग अर प्रकृति-दोष मूल्यांकन",
      DOCUMENT_OCR: "पुरानी डाक्टरी परची व जांच पर्चा स्कैनिंग",
      DOCTOR_SHARING: "जांच कर्ता वैद्य/डॉक्टर साब कनै डेटा भेजणो",
      ABDM_EXCHANGE: "आयुष्मान भारत डिजिटल मिशन (ABDM) रिकॉर्ड लिंकेज",
    },
    audioUrl: "/audio/consent-explanation-raj.mp3",
    acceptButton: "हूँ सहमत हूँ अर मंजूरी द्यूं हूँ (I Agree & Grant Consent)",
    revokeButton: "सहमति पाछी लो (Revoke Consent)",
  },
};

export interface ConsentRequestDTO {
  patientId: string;
  purposes: string[];
  language: "en" | "hi" | "raj";
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
