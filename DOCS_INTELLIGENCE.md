# Medical Document Intelligence & Tabular Lab Extraction Architecture

**Ministry of Ayush / AIIA Clinical Platform**

---

## 📄 1. Automatic Document Classification

The pipeline inspects OCR text tokens to automatically categorize documents into 4 archetypes:

| Document Class | Trigger Keywords | Extraction Specialization |
|---|---|---|
| **`PRESCRIPTION`** | `Rx`, `Tab`, `Syp`, `Vati`, `Guggulu`, `mg BD`, `pc` | Medications, dosages, frequencies, and administration timing. |
| **`LAB_REPORT`** | `Reference Range`, `Biological Interval`, `HbA1c`, `Creatinine` | Tabular lab test names, observed values, units, and out-of-range flags. |
| **`DISCHARGE_SUMMARY`** | `Date of Admission`, `Course in Hospital`, `Discharge Vitals` | Historic procedures, past surgeries, and hospital course notes. |
| **`OTHER`** | Unstructured notes | Raw text capture with manual tagging option. |

---

## 🧪 2. Tabular Lab Extraction & Out-of-Range Flagging

- **Structured Parsing**: Extracts test rows conforming to `StructuredLabRow` schema (`testName`, `observedValue`, `unit`, `referenceRange`, `flag`).
- **ICMR/NABL Comparison**: Automatically computes `HIGH`, `LOW`, or `NORMAL` flags against standardized biological reference ranges.

---

## ✍️ 3. Handwriting Confidence & Physician Feedback Loop

- **Confidence Thresholds**: Computes confidence scores per extracted entity. Entries with confidence $< 0.80$ are marked with `needsReview: true` and highlighted in amber.
- **Correction API ([`app/api/doctor/document/correct/route.ts`](file:///c:/Users/Hp/OneDrive/Desktop/SIH_2026/app/api/doctor/document/correct/route.ts))**: Attending physicians can correct extracted values with one click, preserving a full audit trail.
