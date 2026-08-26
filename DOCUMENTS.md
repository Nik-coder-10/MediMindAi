# Medical Document Intelligence & OCR Extraction Architecture

**Smart India Hackathon 2026 – Problem ID 26047 (Ministry of Ayush / AIIA)**

---

## 📄 1. End-to-End Multimodal Extraction Flow

```
+-------------------------------------------------------------------------------+
|                             CLIENT / PATIENT APP                             |
|  - High-contrast 56px+ Touch Target Scan Card (Mobile Camera & PDF Upload)     |
|  - Live Progress Stepper & Extracted Medication / Lab Preview                  |
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

## 🔬 2. Before / After Example: Raw OCR to Structured Entities

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

### After (Structured JSON Entities):
```json
{
  "medications": [
    { "name": "Tab Yogaraj Guggulu", "dosage": "500mg", "frequency": "1-0-1", "duration": "15 days" },
    { "name": "Syp Amritarishta", "dosage": "15ml", "frequency": "twice daily", "duration": "15 days" }
  ],
  "diagnoses": ["Amavata (Saama Vata-Kaphaja)", "Chronic Acidity (Amlapitta)"],
  "labResults": [
    { "testName": "HbA1c", "value": 6.8, "unit": "%", "referenceRange": "(Ref: 4.0 - 5.6 %)", "flag": "HIGH" },
    { "testName": "ESR", "value": 38, "unit": "mm/hr", "referenceRange": "(Ref: 0 - 15 mm/hr)", "flag": "HIGH" }
  ],
  "vitals": { "BP": "130/84 mmHg" }
}
```

---

## 📂 3. Sample Documents Dataset
- [`public/sample-documents/sample_prescription_aiia.txt`](file:///c:/Users/Hp/OneDrive/Desktop/SIH_2026/public/sample-documents/sample_prescription_aiia.txt): Official prescription from All India Institute of Ayurveda with classical medications and lab panels.
