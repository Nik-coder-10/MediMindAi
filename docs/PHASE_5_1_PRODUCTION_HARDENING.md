# Phase 5.1 — Production Hardening & Clinical Insight Integrity

## 1. Executive Summary & Context
Phase 5 introduced explainable `ClinicalInsight` generation, longitudinal finding trajectories, and evidence-linking anchored to the AYUSH Clinical Knowledge Graph. 
A senior engineering safety review identified one production concurrency weakness and strict data lifecycle invariants requiring database-enforced hardening:
1. **Concurrent Duplicate Vulnerability**: Rapid concurrent intake updates or regenerate requests could create duplicate insights for the same logical observation cluster if uniqueness was only checked in application-tier logic.
2. **Doctor Governance Invariance**: System-generated draft data, re-inference, or model version updates must NEVER overwrite or revert human physician decisions (`CONFIRMED` / `VERIFIED`, `REJECTED`, `OVERRIDDEN`) or wipe audit metadata (`reviewedById`, `reviewedAt`, `doctorDecision`, `doctorReviewReason`, `doctorOverrideText`).
3. **Deterministic Identity (Fingerprints)**: Clinical insight identities must be uniquely reproducible from their canonical components (`algorithmVersion`, `sessionId`, `insightType`, sorted `observationIds`, and sorted parameter keys), invariant to dictionary ordering or evidence permutations.

Phase 5.1 addresses these hardening requirements with zero regression to Phases 1–5, zero introduction of autonomous diagnosis or prescribing, and full transactional persistence.

---

## 2. Architecture & Concurrency Defense

### 2.1 Database Uniqueness & Additive Schema Hardening
To prevent concurrent duplicate generation, the `ClinicalInsight` model enforces a composite unique constraint at the database tier:
```prisma
model ClinicalInsight {
  id                  String           @id @default(uuid())
  patientId           String
  sessionId           String
  fingerprint         String?
  ...
  @@unique([sessionId, fingerprint])
  @@index([sessionId])
  @@index([patientId])
}
```

### 2.2 Atomic Transactional Persistence with Conflict Recovery
In `ClinicalInsightService.persistSessionInsights()`, candidate insights are written within an atomic Prisma transaction (`prisma.$transaction`). If a concurrent process wins a race to insert the exact same `(sessionId, fingerprint)`:
- The database rejects the duplicate with a unique constraint violation.
- The service catches the constraint violation and fetches the winning record via `findUnique({ where: { sessionId_fingerprint: { sessionId, fingerprint } } })`.
- If the database is disconnected or offline, the service falls back to in-memory deduplication keyed by `${sessionId}::${fingerprint}`.

### 2.3 Permanent Doctor Governance Invariant
When re-generating insights for an active or modified session:
- If an existing insight with the same fingerprint is in status `VERIFIED`, `REJECTED`, or `OVERRIDDEN`, or has a non-null `doctorDecision`, re-generation **preserves** the existing status, title, and doctor decision/rationale fields.
- Only background telemetry fields (`confidence`, `ruleOrModelVersion`, `description`, explanation metadata) are updated to reflect the latest model pass.
- In-memory cache mirrors this governance guard, ensuring 100% deterministic fidelity during serverless fallback.

---

## 3. Deterministic Fingerprint Specification

Insight fingerprints are generated via `ClinicalInsightService.generateInsightFingerprint()` using SHA-256:
- **Canonical Algorithm Version**: `ClinicalInsightService.ALGORITHM_VERSION` (e.g. `v1.0.0`).
- **Normalized Session ID**: Session context identifier.
- **Normalized Insight Type**: e.g., `NEW_FINDING`, `PERSISTENT_FINDING`, `IMPROVING_FINDING`, etc.
- **Sorted, Deduplicated Evidence IDs**: Array of `observationIds` sorted lexicographically so that evidence permutations produce the identical fingerprint.
- **Sorted Parameter Keys**: Any additional metadata keys sorted alphabetically.

```typescript
const payload = JSON.stringify({
  version: this.ALGORITHM_VERSION,
  sessionId: params.sessionId,
  type: params.insightType,
  obs: [...new Set(params.observationIds)].sort(),
  params: sortedParams,
});
return createHash("sha256").update(payload).digest("hex");
```

---

## 4. Verification Suite & Test Evidence

A dedicated test suite (**Suite 27: Production Hardening & Clinical Insight Integrity**, tests `P51-001` through `P51-026`) was added to `tests/test-runner.ts` covering:

| Test Code | Verification Objective | Result |
| :--- | :--- | :--- |
| **P51-001** | ClinicalInsight fingerprint persisted as dedicated first-class field | **PASS** |
| **P51-002** | Database rejects duplicate fingerprints within same session | **PASS** |
| **P51-003** | Same fingerprint may exist across different sessions | **PASS** |
| **P51-004** | Generating insights twice produces zero duplicate records | **PASS** |
| **P51-005** | Both generation calls return identical persisted logical identity | **PASS** |
| **P51-006** | Existing evidence links remain intact across re-runs | **PASS** |
| **P51-007** | Concurrent generation operations persist exactly 1 record per fingerprint | **PASS** |
| **P51-008** | Concurrent duplicate persistence yields no unhandled database errors | **PASS** |
| **P51-009** | Resulting insight remains structurally valid | **PASS** |
| **P51-010** | Re-generation cannot reset `VERIFIED` insight status | **PASS** |
| **P51-011** | Re-generation cannot overwrite `REJECTED` insight status | **PASS** |
| **P51-012** | Re-generation cannot erase `OVERRIDDEN` state | **PASS** |
| **P51-013** | Re-generation cannot erase `doctorDecision` | **PASS** |
| **P51-014** | Re-generation cannot erase `doctorRationale` / `doctorReviewReason` | **PASS** |
| **P51-015** | Re-generation cannot erase doctor identity/audit fields (`reviewedById`) | **PASS** |
| **P51-016** | Same logical inputs produce identical fingerprint | **PASS** |
| **P51-017** | Different evidence order produces identical fingerprint | **PASS** |
| **P51-018** | Object key ordering does not alter fingerprint | **PASS** |
| **P51-019** | New algorithm version alters fingerprint namespace | **PASS** |
| **P51-020** | Display-only wording changes do not alter clinical inference fingerprint | **PASS** |
| **P51-021** | Knowledge-derived insight retains observation provenance | **PASS** |
| **P51-022** | Knowledge-derived insight retains concept provenance | **PASS** |
| **P51-023** | Knowledge-derived insight retains source provenance | **PASS** |
| **P51-024** | Knowledge-derived insight retains knowledge pack version | **PASS** |
| **P51-025** | Deterministic insight generation remains free of autonomous diagnosis | **PASS** |
| **P51-026** | Deterministic insight generation remains free of prescription generation | **PASS** |

### Harness Execution Summary
- Total Tests: **278 PASSED | 0 FAILED** across 27 comprehensive test suites.
- Next.js Production Build: **0 Errors**, 22 static/dynamic routes compiled cleanly.
- Prisma Schema Validation: **Valid 🚀**.
