# 📄 Doctor Dashboard & Printable PDF Clinical Summary

**AyurSetu / MediMindAi (AyurSetu Clinical Platform)**
**Ministry of Ayush / All India Institute of Ayurveda (AIIA)**

---

## 🌟 Overview
The Doctor Workspace provides attending physicians with a clinical triage desk, live emergency notifications, dynamic case dossiers, and **high-quality, vector-rendered printable PDF summaries**.

---

## 🖨️ Printable PDF Clinical Summary Architecture

### 1. Library Selection & Technical Justification
- **Library**: [`pdf-lib`](https://pdf-lib.js.org/) (Pure JavaScript/TypeScript PDF vector manipulation library).
- **Advantages over Puppeteer / html2pdf / jsPDF**:
  - **Zero Chromium/Browser Dependency**: Does not require heavy binary headless browsers like Puppeteer, which fail on serverless edge environments (Vercel Serverless Functions 50MB limit).
  - **Sub-50ms Generation**: Instant on-demand stream generation directly in Node.js / Next.js API route.
  - **Crystal-Clear Vector Typography**: Produces razor-sharp, print-ready A4 documents with precise millimeter boundaries, high-contrast badges, and dynamic multi-page pagination.
  - **Security & Privacy**: Document generation executes strictly within memory buffers (`Uint8Array`/`Buffer`) without writing intermediate PHI files to disk.

### 2. PDF Document Layout & Content Sections
Every generated PDF follows official hospital record standards:
1. **Hospital Header & Banner**: AIIA / Ministry of Ayush official heading with emerald branding.
2. **Session Identification & Token**: High-visibility token badge (e.g. `#AYUR-A1B2`), encounter timestamp, session UUID, and Triage priority tag (`ROUTINE` / `URGENT` / `EMERGENCY`).
3. **Patient Demographics**: Name, approximate age, gender, language, and DPDP-compliant masked ABHA ID.
4. **Critical Red Flags (if any)**: High-visibility rose/red banner warning of acute cardiovascular, stroke, or meningism symptoms.
5. **Chief Complaint & Clinical Presentation**: Symptom name, duration, and severity score.
6. **Structured Medical, Family & Social History**: Parental hereditary diseases (HTN/DM/CAD), habits (tobacco, alcohol, activity, diet), and Obstetric/Gynecological status (for female encounters).
7. **AYUSH Dashavidha Pariksha Findings**: Constitutional *Prakriti*, *Vikriti*, and digestive *Agni* profile.
8. **Consultation Note & Treatment Plan**: Formatted, readable doctor-reviewed clinical note.
9. **Physician Sign-Off & Attestation**: Legal verification disclaimer, attending doctor name, signature/seal line, and date.
10. **Document Footer**: Page numbering (`Page X`), confidentiality notice, and AyurSetu AyurSetu digital stamp.

---

## 🔗 API Endpoint
- **URL**: `GET /api/doctor/summary/[sessionId]/pdf`
- **Authentication**: Requires doctor role via `AuthService.requireDoctor(req)`.
- **Response**: Binary stream (`application/pdf`) with `Content-Disposition: attachment; filename="AyurSetu_Clinical_Summary_<TOKEN>_<TIMESTAMP>.pdf"`.

---

## 💻 Doctor UI Integration
- Located on Doctor Case View ([`app/[locale]/doctor/case/[sessionId]/page.tsx`](file:///c:/Users/Hp/OneDrive/Desktop/SIH_2026/app/%5Blocale%5D/doctor/case/%5BsessionId%5D/page.tsx)).
- Emerald **"Download PDF" / "PDF डाउनलोड करें"** button situated directly in the Clinical Summary card header next to audio read-out and edit controls.
