# Digital Personal Data Protection (DPDP) Act 2023 Compliance

**Healthcare Data Fiduciary Compliance Architecture**
**AyurSetu / MediMind AI (SIH 2026 Problem ID 26047)**

---

## 🏛️ 1. Alignment with DPDP Act 2023 Principles

| Principle (DPDP 2023) | Implementation within AyurSetu Architecture |
|---|---|
| **1. Purpose Limitation (Sec. 6)** | Consent artifacts are granular and purpose-scoped (`HISTORY_TAKING`, `DOCUMENT_OCR`, `DOCTOR_SHARING`, `HOSPITAL_HIS`). |
| **2. Collection Minimization (Sec. 6)** | Intake questions only gather relevant clinical facts; non-clinical surveillance data is never collected. |
| **3. Right to Withdraw Consent (Sec. 6(4))** | Patients can instantly revoke any purpose-specific consent from their portal, triggering immediate processing blockage via `DpdpConsentGuard`. |
| **4. Storage Limitation (Sec. 8(7))** | Automatic data retention policies and session purge routines for uncompleted abandoned intakes. |
| **5. Reasonable Security Safeguards (Sec. 8(5))** | AES-256-GCM application encryption + immutable cryptographic audit trails in `AuditLog`. |

---

## 👤 2. Data Principal Rights Implementation
1. **Right to Access Information**: Patients can view all captured conversation turns, answers, and extracted medications before doctor submission (`/patient/summary-preview`).
2. **Right to Correction and Erasure**: Ability to edit clinical answers mid-intake or request record deletion.
3. **Right to Grievance Redressal**: System Administrator and Clinical Safety Officer contact points defined in consent artifacts.
