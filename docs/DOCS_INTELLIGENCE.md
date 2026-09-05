# 📄 Medical Document Intelligence & Handwritten Prescription Processing

**AyurSetu Clinical Platform**  
**AyurSetu / MediMindAi Clinical Platform**

---

## 1. Overview & Architecture

Indian Outpatient Departments (OPDs) frequently encounter handwritten clinical prescriptions, varying doctor penmanship, bilingual Hindi/English notes, and scanned multi-page laboratory reports.

AyurSetu implements an **Intelligent Document OCR Pipeline** supporting:
- Pre-processing (contrast binarization, noise filtering, and grayscale luminance curve enhancement for ink clarity).
- Dual-engine fallback architecture (local **Tesseract.js** with Hindi + English support and pluggable **Cloud Document AI / Azure Form Recognizer / AWS Textract**).
- Multi-field confidence scoring (0.0 to 1.0) on all extracted clinical entities (Medications, Lab tests, Diagnoses, Vitals).
- Physician-in-the-loop verification and inline correction workflows.

```
Uploaded Image / Scanned PDF
           │
           ▼
Image Preprocessing (Sharp / Canvas Contrast & Noise Filter)
           │
           ▼
Intelligent OCR Provider (Tesseract eng+hin / Cloud Form Recognizer)
           │
           ▼
Clinical Entity Extractor (NER + SOCRATES Parsing + Lab Value Range Evaluator)
           │
           ▼
Confidence Scoring Matrix & Needs-Review Flagging
  ├── High Confidence (≥ 0.85): Direct clinical inclusion (Green badge)
  ├── Moderate Confidence (0.60 - 0.84): Verified with caution (Amber badge)
  └── Low Confidence (< 0.60): "Needs Physician Verification" (Red / Editable)
           │
           ▼
Database Persistence (PostgreSQL ExtractedMedicalEntity) & Doctor UI Inline Correction
```

---

## 2. Confidence Score Interpretation

| Range | Level | Visual Indicator | UI Behavior & Clinical Workflow |
| :--- | :--- | :--- | :--- |
| **0.85 – 1.00** | High Confidence | 🟢 Green Badge (`85% - 100% ✓`) | Clear printed text or high-clarity handwriting with matched dosage and frequency. Included directly in clinical summary. |
| **0.60 – 0.84** | Moderate Confidence | 🟡 Amber Badge (`60% - 84% ⚠`) | Legible handwriting or partially cropped names. Displayed with caution marker. |
| **< 0.60** | Low Confidence | 🔴 Red Badge (`< 60% !`) | Poor handwriting or ambiguous ink strokes. Marked **"Needs Physician Verification"**; physician can click **"संशोधन करें (Edit)"** to update the record in real-time. |

---

## 3. Sample Documents Available

Realistic sample prescriptions and lab reports are located in `/public/sample-documents/`:
1. `/public/sample-documents/sample_prescription_aiia.txt` — Formal AIIA printed OPD prescription with abnormal lab flags.
2. `/public/sample-documents/handwritten/sample_handwritten_prescription_opd.txt` — OPD handwritten prescription for joint pain (Amavata).
3. `/public/sample-documents/handwritten/sample_handwritten_opd_amlapitta.txt` — OPD handwritten prescription for hyperacidity and dyspepsia.

---

## 4. Configuration & Cloud Provider Switching

To switch from the local Tesseract fallback engine to Cloud OCR in production, set the following environment variables:

```env
# OCR Engine Mode: "tesseract" | "azure" | "google" | "aws"
OCR_PROVIDER="azure"

# Azure Document Intelligence
AZURE_DI_ENDPOINT="https://<your-resource>.cognitiveservices.azure.com/"
AZURE_DI_KEY="<your-azure-key>"
AZURE_DI_MODEL="prebuilt-document"

# OCR Language Packs
OCR_LANGS="eng+hin"
```
