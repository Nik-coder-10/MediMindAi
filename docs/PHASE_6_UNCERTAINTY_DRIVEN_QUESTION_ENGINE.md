# Phase 6 — Uncertainty-Driven Adaptive Question Engine
## AyurSetu / MediMindAi (Clinical Case-Taking & Triage)

---

### 1. Executive Summary & Problem Context
In earlier iterations (Phases 1 through 5.1), AyurSetu employed dynamic questionnaire branching based on keyword classification and hardcoded category sequences. While functional, a fixed questionnaire has inherent limitations:
1. It does not actively track what crucial clinical facets remain **unknown**.
2. It can ask questions for information already captured through uploaded prescriptions, lab reports, or prior turns.
3. It risks conversational exhaustion without knowing when sufficient information has been acquired.

**Phase 6 introduces the Uncertainty-Driven Adaptive Question Engine.**
The system operates as a **Case-Taking Information Acquisition System**:
> *"Given what is already known about this patient, what information should be collected next to improve the completeness, safety, and clinical usefulness of the case while avoiding redundancy and patient fatigue?"*

---

### 2. Core Clinical & Safety Invariants
1. **Information Uncertainty $\neq$ Diagnostic Uncertainty**:
   - The engine models **information gaps** (e.g., *"Pain severity is currently unknown"*), NOT disease probabilities $P(\text{disease} \mid \text{symptoms})$.
   - The engine does NOT diagnose diseases, rank diagnoses, calculate disease risk percentages, or prescribe medications.
   - Case completeness represents **Case Information Completeness**, NOT diagnostic certainty or medical prognosis.
2. **Authoritative & Independent Red-Flag Safety**:
   - The engine prioritizes red-flag screening inquiries over general history.
   - However, the red-flag engine (`RedFlagService` and `CLINICAL_RED_FLAG_REGISTRY`) remains completely independent and authoritative. An emergency alert triggers immediate triage escalation (`SAFETY_ESCALATION`), superseding conversational optimization.
3. **No False Deductions**:
   - Missing or unasked information is never inferred as negative evidence (e.g. unrecorded allergy history $\neq$ "no allergies").
   - Discrete negative answers (`ObservationStatus.REFUTED` or explicit "none") are treated as confirmed known facts.
   - Longitudinal history provides context, but acute symptoms are not presumed to be current truth without verification.

---

### 3. Architecture & Service Boundaries

```
                             Patient Case State
                                    ↓
              [lib/clinical/uncertainty.service.ts]
              CaseCompletenessAnalyzer & InformationGapDetector
              - Evaluates known ClinicalObservations, answered questions, OCR facts
              - Quantifies information completeness across 19 canonical dimensions
              - Weighs clinical safety and complaint relevance
                                    ↓
              [lib/clinical/redundancy.service.ts]
              QuestionRedundancyDetector
              - Eliminates redundant questions matching already known facts
              - Distinguishes explicit negative findings from unknown gaps
              - Identifies conflicting clinical reports requiring clarification
                                    ↓
              [lib/clinical/fatigue.service.ts]
              QuestionFatigueGuard
              - Enforces question budgets and limits consecutive domain inquiries
              - Triggers deterministic stop conditions (MINIMUM_SAFE_COMPLETENESS)
                                    ↓
              [lib/clinical/question-ranking.service.ts]
              QuestionRankingService
              - Transparent heuristic scoring:
                SafetyPriority + InformationGain + CompletenessImpact + Relevance 
                - RedundancyPenalty - FatiguePenalty
              - Enforces priority: Red-Flag > Safety > Complaint > History > AYUSH
                                    ↓
              [lib/clinical/uncertainty-engine.service.ts]
              UncertaintyDrivenQuestionEngine (Main Orchestrator)
              - Recalculates after every patient answer
              - Deterministic SHA-256 state fingerprinting
```

---

### 4. Uncertainty Dimension & Weighting Model

Information completeness is evaluated across 19 clinically weighted dimensions:

| Uncertainty Dimension | Weight | Safety Critical | Clinical Role |
| :--- | :---: | :---: | :--- |
| **NEGATIVE_SAFETY_FINDINGS** | 1.5 | Yes | Emergency red-flag and critical rule screening |
| **SEVERITY** | 1.3 | Yes | Magnitude and pain numerical rating scale |
| **COMPLAINT_CHARACTERIZATION** | 1.2 | No | Quality and presentation character (burning, throbbing, etc.) |
| **LOCATION** | 1.1 | No | Anatomical localization and laterality |
| **TEMPORAL_HISTORY** | 1.1 | No | Onset time, duration, and progression pattern |
| **ASSOCIATED_SYMPTOMS** | 1.1 | No | Concomitant secondary complaints |
| **MEDICATION_HISTORY** | 1.1 | Yes | Active therapies and allopathic/ayurvedic prescriptions |
| **ALLERGY_HISTORY** | 1.1 | Yes | Drug allergies and cross-reactivity warnings |
| **PAST_MEDICAL_HISTORY** | 1.0 | No | Pre-existing chronic diseases |
| **FAMILY_HISTORY** | 0.9 | No | Hereditary predispositions |
| **LIFESTYLE** | 0.8 | No | Diet, sleep, stress, and occupational factors |
| **AYURVEDIC_AGNI** | 0.9 | No | Digestive fire status (Sama, Vishama, Tikshna, Mandagni) |
| **AYURVEDIC_AMA** | 0.9 | No | Metabolic toxin accumulation (Ama lakshana) |
| **AYURVEDIC_PRAKRITI** | 0.8 | No | Constitutional Dosha balance (Vata-Pitta-Kapha) |
| **AYURVEDIC_VIKRITI** | 0.8 | No | Current doshic imbalance |
| **AYURVEDIC_KOSHTHA** | 0.7 | No | Bowel regularity and gut temperament |
| **HOMEOPATHIC_MODALITIES** | 0.9 | No | Aggravation / amelioration factors |
| **HOMEOPATHIC_GENERALS** | 0.8 | No | General thermal and physical reactions |
| **HOMEOPATHIC_MIASMS** | 0.7 | No | Fundamental miasmatic background |

#### Weighted Completeness Formula
$$\text{Completeness} = \frac{\sum_{\text{applicable}} (\text{Weight}_i \times \text{StatusRatio}_i)}{\sum_{\text{applicable}} \text{Weight}_i}$$
Where $\text{StatusRatio}$ is $1.0$ for `KNOWN`, $0.5$ for `PARTIALLY_KNOWN`, $0.25$ for `CONTRADICTORY`, and $0.0$ for `UNKNOWN`. Inactive dimensions in a given mode or non-pain complaint are marked `EXEMPT` and do not penalize completeness.

---

### 5. Next-Best-Question Ranking Algorithm
Every candidate question receives a transparent heuristic score:
$$\text{Score} = (\text{SafetyPriority} \times 1.5) + (\text{InfoGain} \times 1.2) + (\text{CompletenessImpact} \times 1.0) + (\text{Relevance} \times 0.8) + (\text{TemporalUrgency} \times 0.5) - (\text{RedundancyPenalty} \times 1.5) - (\text{FatiguePenalty} \times 0.8)$$

- **SafetyPriority**: $1.0$ for red-flag screening; $0.85$ for severity and allergies.
- **InfoGain**: $0.95$ when resolving a contradictory report; $0.90$ for blocking gaps; $0.75$ for unknown gaps.
- **CompletenessImpact**: $0.8$ if the category is currently unresolved.
- **Relevance**: $0.9$ for chief complaint characterization; $0.85$ for active AYUSH mode facets.
- **RedundancyPenalty**: $1.0$ if already answered; $0.85-0.95$ if present in observations or OCR facts.
- **FatiguePenalty**: Linear ramp after 4 questions, plus $+0.45$ for $>2$ consecutive questions in the same domain.

---

### 6. Conversational Stop Conditions
Questioning ceases gracefully under explicit, clinically grounded stop conditions:
1. `MINIMUM_SAFE_COMPLETENESS_REACHED`: Completeness $\ge 70\%$, total questions $\ge 5$, and zero blocking gaps remaining.
2. `NO_HIGH_VALUE_QUESTIONS_REMAIN`: All clinically relevant facets for the complaint category have been addressed.
3. `MAXIMUM_QUESTION_BUDGET_REACHED`: 10-question conversational ceiling reached to avoid patient exhaustion.
4. `SAFETY_ESCALATION`: Triggered immediately if an emergency red flag is detected.

---

### 7. Patient & Doctor UI Enhancements
- **Patient Questions Flow** (`/[locale]/patient/questions`):
  - Displays calm, supportive context badges (*"लक्षण विवरण (Clinical Detail)"* / *"सुरक्षा जांच (Safety check)"*) rather than confusing numerical scores or algorithmic weights.
- **Doctor Case View** (`/[locale]/doctor/case/[sessionId]`):
  - Adds dedicated **"📊 केस पूर्णता स्थिति (Case Info Status)"** tab.
  - Displays Case Information Completeness percentage with mandatory non-diagnostic disclaimer.
  - Summarizes resolved vs unresolved high-priority facets, blocking gaps, engine stop condition, and explainable decision rationale.

---

### 8. Verification & Master Test Suite 28
All 40 unit and integration tests (`UDQ-001` through `UDQ-040`) pass:
- **Group A (Uncertainty Detection)**: `UDQ-001` to `UDQ-005`
- **Group B (Case Completeness)**: `UDQ-006` to `UDQ-010`
- **Group C (Question Ranking)**: `UDQ-011` to `UDQ-015`
- **Group D (Redundancy Detection)**: `UDQ-016` to `UDQ-020`
- **Group E (Contradictions & Clarification)**: `UDQ-021` to `UDQ-023`
- **Group F (Fatigue & Stop Conditions)**: `UDQ-024` to `UDQ-027`
- **Group G (Longitudinal Context)**: `UDQ-028` to `UDQ-030`
- **Group H (Mode Adaptation)**: `UDQ-031` to `UDQ-034`
- **Group I (Safety Invariants)**: `UDQ-035` to `UDQ-038`
- **Group J (Engine Integration & Explainability)**: `UDQ-039` to `UDQ-040`
