# Doctor Dashboard & Clinical Decision Workspace Documentation

**Ministry of Ayush / AIIA Clinical Platform**

---

## 🩺 1. Triage Queue Dashboard (`/doctor`)
- **Real-Time Priority Queuing**: Automatically sorts active case intakes by urgency:
  - 🚨 **`EMERGENCY`** (Acute Coronary Syndrome, FAST stroke symptoms, Sepsis, Gastrointestinal Bleeding)
  - ⚡ **`URGENT`** (Severe pain, respiratory tachypnea, acute joint swelling)
  - 🟢 **`ROUTINE`** (Standard chronic follow-up and Ayush intake)
- **High-Density Overview**: Displays patient demographics (Age, Gender, Blood Group), ABHA ID, language preference, chief complaint, waiting duration, and red-flag alerts in a single scannable card.

---

## 📋 2. Aggregated Patient Case Workspace (`/doctor/case/[sessionId]`)
- **Prominent Top Bar (Never below the fold)**: Patient demographics + Triage badge + Emergency Red Flag alert banner.
- **Tabbed Clinical Dossier**:
  1. 📝 **Clinical Summary**: Dual-mode markdown view with live side-by-side editing and version tracking.
  2. ⏳ **Longitudinal Timeline**: Multi-year chronological events from historical clinical encounters.
  3. 🧪 **Abnormal Labs**: Automated detection of out-of-range values (*HbA1c, ESR, Creatinine, Hemoglobin*).
  4. 🌿 **Ayush Dashavidha**: Charaka Samhita 10-fold parameters (Prakriti, Vikriti, Agni, Koshtha, Sattva, Bala).
  5. 📄 **Ingested Documents**: Multimodal OCR prescriptions and extracted medications.
- **Sticky Clinical Action Bar**: *"Accept & Sign"*, *"Edit Clinical Note"*, *"Order Tests"*.
