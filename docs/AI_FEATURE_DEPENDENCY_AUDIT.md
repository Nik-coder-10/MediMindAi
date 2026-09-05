# 🤖 AI & MULTIMODAL FEATURE DEPENDENCY AUDIT
**AYURSETU (MediMindAi) — Ministry of Ayush / AIIA Clinical Platform**

---

## 1. Feature Architecture Breakdown

This audit distinguishes features running **locally/free** from those that require **external credentials**.

| Clinical Subsystem | Provider / Engine | Mode | Cost | Fallback & Operational Status |
| :--- | :--- | :--- | :--- | :--- |
| **Document OCR (Images)** | `tesseract.js` | Serverless In-Memory | **$0.00 (Free)** | Processes JPG/PNG/WEBP via pure WASM/Node worker. |
| **Document OCR (PDFs)** | `pdfjs-dist` + `tesseract.js` | Serverless In-Memory | **$0.00 (Free)** | Rasterizes first 2 pages of PDF into in-memory canvas. |
| **Clinical Prescription NLP** | `MedicalEntityExtractor` | Deterministic Lexical Parser | **$0.00 (Free)** | Extracts brand-to-generic mappings (Metformin, Amlodipine, etc.) without external LLMs. |
| **Lab Anomaly Detection** | `AbnormalLabEvaluator` | Rule Engine | **$0.00 (Free)** | Compares values (HbA1c, Creatinine, etc.) against ICMR standard ranges. |
| **Ayurvedic Prakriti Scoring** | `AyurvedaAssessmentService` | Charaka Samhita Rules | **$0.00 (Free)** | Calculates Vata, Pitta, and Kapha percentages dynamically. |
| **Voice Input (Speech-to-Text)**| Web Speech API | Browser Native | **$0.00 (Free)** | Uses Chrome/Edge/Safari native microphone speech recognition with Hindi/English support. |
| **Voice Output (Text-to-Speech)**| Web Speech API | Browser Native | **$0.00 (Free)** | Uses browser `window.speechSynthesis` for multilingual voice prompt playback. |
| **FHIR R4 Bundle Serialization**| `FhirService` | Native JSON Builder | **$0.00 (Free)** | Serializes consultation records into HL7 FHIR R4 standard encounters. |
| **Cloud LLM Ingestion (Optional)**| OpenAI / Grok / Ollama | External API | Paid / Self-Hosted | Optional; inactive by default. System relies on deterministic clinical rules. |

---

## 2. Serverless Execution Constraints on Vercel

1. **OCR Timeout Limit**: Configured with a default `OCR_TIMEOUT_MS=45000` (45 seconds) to operate comfortably within Vercel's Serverless Function execution windows.
2. **Page Limit**: `OCR_PDF_PAGES=2` limits PDF rasterization to the first 2 pages per document, preventing memory exhaustion on serverless container instances.
3. **Browser Audio Support**: Voice input uses the standard W3C Web Speech API. For desktop/mobile browsers without Web Speech (e.g. Firefox), the application cleanly provides standard text input fields as a direct fallback.
