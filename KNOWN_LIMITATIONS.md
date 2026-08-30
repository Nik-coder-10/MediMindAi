# Known Limitations & Production Scaling Roadmap

**Smart India Hackathon 2026 – Problem ID 26047**

---

## 🔍 Prototype Boundaries & Scoping

1. **Acoustic Speech Models in Live Demo**:
   - The application supports Google Web Speech API natively on modern browsers. For offline rural kiosks without Chromium speech support, integration with Bhashini on-premise inference engines or OpenAI Whisper is ready via `.env`.
2. **Medical OCR & Handwritten Prescription Recognition**:
   - The platform includes high-contrast pre-processing, bilingual (Hindi + English) Tesseract OCR, tabular NER, confidence scoring (0.0 to 1.0), and inline doctor correction. In high-volume tertiary hospitals with degraded penmanship, enterprise multi-page PDF pipelines hook into Azure Form Recognizer / Google Document AI via `OCR_PROVIDER` in `.env`.
3. **ABDM Sandbox Gateway**:
   - The platform generates compliant ABDM consent artifacts and HL7 FHIR R4 Encounter Bundles. Production deployment requires live whitelisting on the NHA Production Gateway.

