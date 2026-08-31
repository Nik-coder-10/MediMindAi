# 🔍 Known Limitations & Production Scaling Roadmap
### Smart India Hackathon 2026 – Problem ID 26047

---

## 🎯 Current Prototype Scope & Production Pathways

1. **Acoustic Speech Models**:
   - **Current**: Google Web Speech API natively in modern Chromium/WebKit browsers + responsive speech fallback.
   - **Production Transition**: Ready to integrate with Bhashini on-premise ASR models or OpenAI Whisper via `.env` configuration for local PHC server hardware.

2. **Multimodal Medical OCR**:
   - **Current**: High-contrast pre-processing canvas, bilingual (Hindi + English) Tesseract OCR, regex/tabular entity extraction, and confidence scoring.
   - **Production Transition**: `OCR_PROVIDER` adapter ready for cloud document services (Azure Form Recognizer, Google Cloud Document AI) for heavily deteriorated tertiary hospital records.

3. **ABDM Sandbox Gateway**:
   - **Current**: Generates 100% compliant HL7 FHIR R4 Encounter Bundles, digital consent records, and ABHA identifiers.
   - **Production Transition**: Production whitelisting on NHA Production Gateway required for live national health exchange.

4. **Clinical Drug Interaction Engine**:
   - **Current**: Curated static rule-engine of high-yield Allopathic and Ayurvedic interactions (e.g., Warfarin + Aspirin, Ashwagandha + Immunosuppressants).
   - **Production Transition**: Pluggable adapter to external clinical CDSS databases (OpenFDA, DrugBank, FDB) in `lib/clinical/drug-safety.service.ts`.


