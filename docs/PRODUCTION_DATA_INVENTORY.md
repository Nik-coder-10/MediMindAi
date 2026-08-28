# 📊 PRODUCTION DATA INVENTORY — AYURSETU (MediMindAi)
**SIH 2026 Problem ID 26047 — Ministry of Ayush / AIIA Case-Taking Software**
*Date: August 2026 | Phase 5: Production Data Integrity & Mock Fallback Elimination*

---

## Executive Summary

Phase 5 transitions AyurSetu from demo/hardcoded runtime representations into a 100% persistent, database-backed clinical platform. This document provides an exhaustive categorization of every data structure, constant, fixture, and clinical model across the entire codebase according to the four strict production classifications:

- **Category A: Legitimate Static Domain Configuration** (Kept intact — clinical knowledge, dictionaries, ontology, enums, UI constants)
- **Category B: Isolated Development/Test Fixtures** (Strictly isolated — test suites, seed scripts, never run silently in production)
- **Category C: Persistent Runtime Business Data** (100% dynamic — PostgreSQL & Supabase backed via Prisma ORM aggregations and relations)
- **Category D: Deprecated Demo Placeholders & Mock Fallbacks** (Eliminated — replaced with genuine database queries, empty states, or dynamic computations)

---

## 1. Category A: Legitimate Static Domain Configuration

These configurations represent foundational medical and linguistic knowledge mandated by the Ministry of Ayush and clinical triage standards. They are version-controlled, immutable at runtime (unless edited via authorized Admin consoles), and **must remain intact**:

| Domain / Component | File Location | Description & Justification |
| :--- | :--- | :--- |
| **SOCRATES Question Nodes** | `lib/engine/adaptive-question-generator.ts` | Classical clinical inquiry trees (Site, Onset, Character, Radiation, Associated symptoms, Timing, Exacerbating factors, Severity) across 7 chief symptom categories (Chest Pain, Headache, Fever, Abdominal Pain, Joint Pain, Dyspepsia, General). |
| **Red-Flag Clinical Rules** | `lib/engine/red-flag-rules.ts` | 15+ safety-critical clinical escalation rules (ACS, Stroke FAST signs, Meningismus, Acute Abdomen, Severe Respiratory Distress, Cauda Equina). |
| **Ayurvedic Dashavidha Ontology** | `lib/services/ayurveda.service.ts` | Charaka Samhita 10-fold examination parameters (Prakriti, Vikriti, Agni, Koshtha, Sattva, Bala, Ahara Shakti, Vyayama Shakti). |
| **ICMR Lab Reference Ranges** | `lib/clinical/lab-ranges.ts` | Age/gender-stratified biological reference ranges for hematology, biochemistry, and glycemic markers. |
| **NAMASTE & ICD-11 Mappings** | `lib/clinical/namaste-codes.ts` | Dual-coding ontology bridging AYUSH National Ayush Morbidity Standardized Terminology Electronic (NAMASTE) codes with WHO ICD-11 TM-2. |
| **MIME Magic Byte Signatures** | `lib/storage/document-validator.ts` | Binary signatures (PDF `%PDF`, PNG `\x89PNG`, JPEG `\xFF\xD8\xFF`, WebP `RIFF...WEBP`) for medical document security. |
| **Multilingual i18n Dictionaries** | `messages/en.json`, `messages/hi.json` | High-fidelity English and Hindi translation dictionaries with Devanagari localization. |
| **Prisma Clinical Enums** | `prisma/schema.prisma` | Role (`PATIENT`, `DOCTOR`, `ADMIN`), Gender, SessionStatus, TriagePriority, RedFlagSeverity, DoshaDominance. |

---

## 2. Category B: Isolated Development & Test Fixtures

These fixtures are restricted to offline automated testing, CI pipelines, and developer sandboxes. They **never execute in production flows**:

| Fixture / Script | File Location | Purpose & Isolation Boundary |
| :--- | :--- | :--- |
| **Phase 5 Master Test Suite** | `tests/test-runner.ts` | 76 automated test assertions (`DATA-001` through `DATA-018`, `STORAGE-001` through `STORAGE-020`, `AUTH-001` through `AUTH-016`) executing in isolated runtime. |
| **Demo Showcase Seed Script** | `scripts/seed-demo-showcase.ts` | Manual seeding script gated behind `NODE_ENV !== "production"` with safety checks. |
| **FHIR Compliance Test** | `scripts/test-fhir-compliance.ts` | CLI benchmark testing HL7 FHIR R4 JSON serialization against schema validators. |
| **Longitudinal Timeline Test** | `scripts/test-timeline.ts` | Terminal script verifying lab entity aggregation into chronological milestones. |

---

## 3. Category C: Persistent Runtime Business Data

All clinical records, user identities, encounter metadata, and documents are stored dynamically in Supabase PostgreSQL and accessed via Prisma ORM:

| Runtime Entity | Database Model (`prisma/schema.prisma`) | Storage & Access Architecture |
| :--- | :--- | :--- |
| **User Identities & Credentials** | `User`, `PatientProfile`, `DoctorProfile` | Canonical Supabase Auth identity mapped via `supabaseUserId` with server-side RBAC guards (`AuthService`). |
| **Clinical Encounter Sessions** | `ClinicalSession` | Lifecycle tracked (`SCHEDULED`, `IN_PROGRESS`, `WAITING_FOR_DOCTOR`, `COMPLETED`); queries scoped by session ID and patient/doctor permissions. |
| **Adaptive Question Answers** | `PatientAnswer`, `ConversationTurn` | Dynamic response storage linked to `ClinicalSession` and `QuestionNode`. |
| **Safety Red-Flag Events** | `RedFlagEvent` | Instantiated dynamically when triage rule conditions are triggered during question processing. |
| **Medical Documents & Storage** | `MedicalDocument`, `ExtractedMedicalEntity` | Binary files persisted in private Supabase Storage bucket `medical-documents`; metadata and extracted NER entities stored in PostgreSQL with 300s temporary signed access URLs. |
| **Longitudinal Timeline Events** | `MedicalTimelineEvent` | Database-backed milestones indexed by `patientId` and `eventDate`. |
| **Clinical Summary & Sign-Offs** | `ClinicalSummary` | Versioned clinical notes generated strictly from real session answers and documents (`SummaryService`). |
| **Ayurvedic Pariksha Scorecards** | `AyurvedaAssessment` | Session-specific constitutional assessments persisted with JSON-B ashtavidha metrics. |
| **DPDP Compliance Audit Logs** | `AuditLog` | Append-only immutable trail recording all clinical consent grants, summary modifications, and data access events. |

---

## 4. Category D: Replaced Placeholders & Fallback Removals

The following table details all demo data, hardcoded statistics, fake names, and silent catch fallbacks that were audited and removed or upgraded in Phase 5:

| Location | Prior Placeholder / Mock Behavior | Phase 5 Production Replacement | Status |
| :--- | :--- | :--- | :--- |
| `app/api/admin/analytics/overview/route.ts` | Static hardcoded KPI fallback (`totalIntakes: 142`, fixed 94.4%, static critical cases). | Real Prisma aggregations (`prisma.clinicalSession.count`, `groupBy` priority, dynamic red-flag logs). If no records, returns 0 counts and empty arrays. | ✅ Migrated |
| `app/api/patient/timeline/route.ts` | Default fallback array returning 5 fake past events for "Ramesh Sharma". | Pure database query on `prisma.medicalTimelineEvent.findMany({ where: { patientId } })`. Returns empty list `[]` when no events exist. | ✅ Migrated |
| `app/api/patient/labs/abnormal/route.ts` | Fixed hardcoded demo array of 5 lab tests. | Evaluates real extracted lab entities from patient's uploaded documents via `MedicalTimelineService.evaluateAbnormalLabs`. | ✅ Migrated |
| `app/api/doctor/export/his/route.ts` | Hardcoded `"Ramesh Sharma"` and static birthdate in FHIR bundle export. | Fetches live `ClinicalSession`, `PatientProfile`, and active diagnoses from database. | ✅ Migrated |
| `app/api/fhir/route.ts` | Hardcoded demographic parameters in test FHIR route. | Dynamic parameter extraction with database lookup fallback. | ✅ Migrated |
| `app/[locale]/patient/summary-preview/page.tsx` | Hardcoded patient name `"Ramesh Sharma"` and fixed timeline milestones. | Dynamic resolution from authenticated user profile (`useAuthStore`) and real sessionStorage/DB session entities; clean empty state for milestones. | ✅ Migrated |
| `app/[locale]/doctor/case/[sessionId]/page.tsx` | Fallback patient defaults (`firstName: "Ramesh"`). | Clean conditional rendering based on genuine `caseData.patient` from API. | ✅ Migrated |
| `app/[locale]/doctor/page.tsx` | Static waiting count labels. | Dynamic computation from real API triage queue length and red-flag events with empty state ("No patients waiting in queue"). | ✅ Migrated |
| `app/[locale]/admin-dashboard/page.tsx` | Hardcoded analytics tab counts (142 sessions, 8.4%). | Dynamic analytics metrics populated via `/api/admin/analytics/overview`. | ✅ Migrated |
| `app/[locale]/admin/analytics/page.tsx` | Hardcoded static fallback values when API fails. | Dynamic state with proper loading and empty distribution graphs. | ✅ Migrated |
| `lib/services/timeline.service.ts` | In-memory 5-event fallback array for "pat-demo". | Pure database query returning `dbEvents` or empty array `[]` without demo injection. | ✅ Migrated |
| `lib/services/ayurveda.service.ts` | Catch block generating mock assessment. | Database error propagation with clean retry semantics. | ✅ Migrated |

---

## 5. Verification & Quality Gates

1. **Clean Database Empty State:** When the database contains 0 sessions, 0 patients, and 0 documents, all APIs return `200 OK` with `totalCount: 0`, `queue: []`, `events: []`, without throwing unhandled exceptions or presenting mock data.
2. **Server-Side Aggregations:** Admin analytics and doctor queues use optimized Prisma queries (`count`, `findMany` with `take: 50`, `orderBy`) avoiding client-side heavy fetches.
3. **No Unauthenticated Leaks:** All API routes enforce IDOR protection and session ownership.
