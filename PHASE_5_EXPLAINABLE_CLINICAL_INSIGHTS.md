# PHASE 5 — EXPLAINABLE CLINICAL INSIGHTS ENGINE
## AyurSetu / MediMindAi (SIH 2026 — Problem Statement 26047)

### 1. Executive Summary & Architectural Overview
Phase 5 introduces the **Explainable Clinical Insights Engine**, transforming raw clinical observations, longitudinal trajectories, and curated AYUSH knowledge graphs into structured, explainable, and clinician-reviewable insights for attending Ayurvedic and Homeopathic physicians.

The engine strictly adheres to the core clinical separation:
$$\text{Patient Fact} \to \text{Longitudinal Trajectory} \to \text{Knowledge Context} \to \text{Clinical Insight} \to \text{Doctor Decision}$$

### 2. Implemented Architecture & Services

1. **`ClinicalInsightService` (`lib/clinical/insight.service.ts`)**:
   - **Deterministic Synthesis**: Computes longitudinal deltas (`NEW_FINDING`, `PERSISTENT_FINDING`, `IMPROVING_FINDING`, `WORSENING_FINDING`, `FLUCTUATING_FINDING`, `NOT_CURRENTLY_REPORTED`), AYUSH context insights (`AYURVEDA_KNOWLEDGE_CONTEXT`, `HOMEOPATHY_KNOWLEDGE_CONTEXT`), and data quality insights (`INSUFFICIENT_HISTORY`, `MISSING_INFORMATION`).
   - **Explainability Schema**: Every insight provides a structured 5-part explanation:
     - `what`: Plain description of the clinical pattern.
     - `why`: Deterministic rule logic and numerical delta.
     - `evidence`: Linked discrete `ClinicalObservation` IDs.
     - `knowledgeContext`: Authentic classical source citation (e.g., *Charaka Samhita Sutrasthana 20/14* or *Boericke Materia Medica*).
     - `limitations`: Mandatory non-diagnostic clinical disclaimer.
   - **Idempotent Fingerprinting**: Computes `fp::{sessionId}::{type}::obs[...]::kg[...]::{version}` to guarantee 100% idempotent storage across repeated evaluations.
   - **Direct vs Derived Evidence**: Explicitly marks direct patient symptoms (`isDirectEvidence: true`) versus literature associations (`isDirectEvidence: false`).
   - **Doctor Review Lifecycle**: Attending physicians can verify (`CONFIRMED`), reject (`REJECTED`), or override (`OVERRIDDEN`) insights without mutating underlying observations or deleting system inference.
   - **LLM Safety Validator (`validateLlmInsightCandidate`)**: Rejects unanchored hallucinations, definitive diagnostic claims, or autonomous prescription orders.

2. **REST API (`app/api/doctor/insights/[sessionId]/route.ts`)**:
   - `GET /api/doctor/insights/[sessionId]`: Authenticated (DOCTOR/ADMIN) retrieval of synthesized insights.
   - `POST /api/doctor/insights/[sessionId]`: Authenticated review mutation recording physician decision and clinical rationale.

3. **Doctor Case Dossier UI (`app/[locale]/doctor/case/[sessionId]/page.tsx`)**:
   - Integrated `INSIGHTS` tab into the master case dossier.
   - Interactive cards displaying category badges, priority levels, confidence scores, structured What/Why/Evidence/AYUSH context breakdowns, and Confirm/Reject physician actions.

### 3. Verification & Test Gate Results

- **Prisma Schema Validation**: `npx prisma validate` $\to$ **PASS**
- **TypeScript Strict Compilation**: `npm run typecheck` $\to$ **0 errors (PASS)**
- **Master Test Harness**: `npm test` $\to$ **252 / 252 tests passing (0 failures)**
  - Unit Suite 26 (`CI-001` through `CI-039`): All 39 test assertions verified.
- **Adaptive Question Generator Suite**: `npx tsx tests/adaptive-question-generator.test.ts` $\to$ **32 / 32 tests passing**
- **Production Build**: `npm run build` $\to$ **78 App Router routes compiled cleanly**
