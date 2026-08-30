# Medical Document Intelligence & OCR Extraction Architecture

**Smart India Hackathon 2026 – Problem ID 26047 (Ministry of Ayush / AIIA)**

---

## 📄 1. End-to-End Multimodal Extraction Flow

```
+-------------------------------------------------------------------------------+
|                             CLIENT / PATIENT APP                             |
|  - Guided DocumentCameraCapture Viewfinder with Prescription Alignment Guides |
|  - Instant Pre-Processing: Contrast Boost, Auto-Crop & Adaptive Binarization  |
|  - Retake vs Confirm flow with live audio & multilingual Hindi/English hints  |
|  - Multi-document accumulation for multi-page OPD prescriptions & lab panels |
+-------------------------------------------------------------------------------+
                                      │
                                      ▼ [Multipart Form Upload]
+-------------------------------------------------------------------------------+
|                       NEXT.JS APP ROUTER API LAYER                            |
|             POST /api/patient/documents/upload                                |
|             POST /api/patient/documents/:id/process                           |
|             GET  /api/patient/documents/:id/entities                          |
+-------------------------------------------------------------------------------+
                                      │
                                      ▼ [Buffer Stream]
+-------------------------------------------------------------------------------+
|                        MULTILINGUAL OCR SERVICE                               |
|   - Multi-provider abstraction: Tesseract.js / Azure Document AI / Textract   |
|   - Multilingual printed & handwritten text recognition (English + Hindi)     |
|   - Real-time confidence scoring (0-100%) and needsReview flags               |
+-------------------------------------------------------------------------------+
                                      │
                                      ▼ [Raw Text]
+-------------------------------------------------------------------------------+
|                      CLINICAL MEDICAL ENTITY EXTRACTOR                        |
|                                                                               |
|   * Medications: Name, Dose, Frequency (1-0-1, BD, TDS), Duration (15 Days)   |
|   * Lab Investigations: Test Name, Value, Unit, Reference Range, Flag         |
|   * Clinical Diagnoses: Modern ICD / Ayurvedic Diagnoses (e.g. Amavata)       |
|   * Vitals & Allergies: Blood Pressure, Pulse, Weight, NKDA                   |
+-------------------------------------------------------------------------------+
                                      │
                                      ▼ [Prisma ORM]
+-------------------------------------------------------------------------------+
|                    POSTGRESQL CLINICAL DATABASE                               |
|   - MedicalDocument (id, sessionId, originalFileUrl, ocrRawText, status)      |
|   - ExtractedMedicalEntity (type: MEDICATION/LAB/DIAGNOSIS, structuredData)   |
|   - AuditLog (Tamper-evident log of document ingestion)                       |
+-------------------------------------------------------------------------------+
```

---

## 📷 2. Dedicated Camera Document Capture & Preprocessing

The camera flow is customized for rural and elderly patients:
1. **Viewport Rectangle Guide**: High-contrast, glowing boundary overlay (`पर्चे को फ्रेम के अंदर रखें`) instructing the user to keep the document steady.
2. **76px Obvious Shutter Button**: Accessible, high-contrast touch target centered at the bottom of the screen.
3. **Smart Client-Side Filters**:
   - **Smart Auto**: Dynamic range expansion for ambient clinic lighting.
   - **Handwritten / Binarized (`DOCUMENT_BINARIZED`)**: Adaptive thresholding separating faint blue/black doctor handwriting from yellowish or patterned prescription paper.
   - **High Contrast (`HIGH_CONTRAST`)**: Amplification of faded pencil and thermal lab printouts.
   - **Original (`ORIGINAL`)**: Untouched original snapshot.
4. **Preview & Confirmation Flow**:
   - Immediate review screen allowing the patient or health worker to inspect readability before OCR processing.
   - One-tap "Retake" or "Use Photo" actions.
5. **Fallback & Permission Handling**:
   - Seamless fallback to standard file / gallery picker if browser camera permissions are blocked or device lacks hardware camera support.

---

## 🔬 3. Before / After Example: Raw OCR to Structured Entities

### Before (Raw OCR Text):
```text
ALL INDIA INSTITUTE OF AYURVEDA (AIIA)
Patient: Ramesh Sharma | Age: 42Y | Gender: Male
DIAGNOSIS: Amavata (Saama Vata-Kaphaja), Chronic Acidity (Amlapitta)

Rx:
1. Tab Yogaraj Guggulu 500mg - 1-0-1 (BD) - 15 days
2. Syp Amritarishta 15ml - 2 tsp twice daily - 15 days

LABS:
- HbA1c: 6.8 % (Ref: 4.0 - 5.6 %) [HIGH]
- ESR: 38 mm/hr (Ref: 0 - 15 mm/hr) [HIGH]
- BP: 130/84 mmHg
```

### After (Structured JSON Entities with Confidence):
```json
{
  "medications": [
    { "name": "Tab Yogaraj Guggulu 500mg", "dosage": "500mg", "frequency": "1-0-1", "duration": "15 days", "confidence": 0.94 },
    { "name": "Syp Amritarishta 15ml", "dosage": "15ml", "frequency": "twice daily", "duration": "15 days", "confidence": 0.88 }
  ],
  "diagnoses": ["Amavata (Saama Vata-Kaphaja)", "Chronic Acidity (Amlapitta)"],
  "labResults": [
    { "testName": "HbA1c", "value": 6.8, "unit": "%", "referenceRange": "4.0 - 5.6", "flag": "HIGH", "confidence": 0.96 },
    { "testName": "ESR", "value": 38, "unit": "mm/hr", "referenceRange": "0 - 15", "flag": "HIGH", "confidence": 0.89 }
  ],
  "vitals": { "BP": "130/84 mmHg" }
}
```

---

## 📂 4. Sample Documents Dataset
- [`public/sample-documents/sample_prescription_aiia.txt`](file:///c:/Users/Hp/OneDrive/Desktop/SIH_2026/public/sample-documents/sample_prescription_aiia.txt): Official prescription from All India Institute of Ayurveda with classical medications and lab panels.
