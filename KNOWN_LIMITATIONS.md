# Known Limitations & Production Scaling Roadmap

**Smart India Hackathon 2026 – Problem ID 26047**

---

## 🔍 Prototype Boundaries & Scoping

1. **Acoustic Speech Models in Live Demo**:
   - The application supports Google Web Speech API natively on modern browsers. For offline rural kiosks without Chromium speech support, integration with Bhashini on-premise inference engines or OpenAI Whisper is ready via `.env`.
2. **Medical OCR Hand-off**:
   - The prototype includes rule-based tabular extraction and medication NER. In production, enterprise multi-page PDF pipelines hook into Azure Form Recognizer or Google Document AI via `lib/ocr/enhanced-ocr.service.ts`.
3. **ABDM Sandbox Gateway**:
   - The platform generates compliant ABDM consent artifacts and HL7 FHIR R4 Encounter Bundles. Production deployment requires live whitelisting on the NHA Production Gateway.
