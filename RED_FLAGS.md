# Clinical Red-Flag Safety Registry & Decision Tree Catalog

**Ministry of Ayush / AIIA Clinical Platform**

---

## 🚨 1. Safety Core Philosophy & Non-Diagnostic Rule
The AyurSetu safety layer operates on a **zero-false-negative triage model** designed to protect vulnerable, rural, and elderly patients:
- **Never Diagnose**: The platform never delivers frightening differential diagnoses to the patient (e.g., *"You are having a Myocardial Infarction"*).
- **Calm Emergency Directive**: The patient interface displays a calm, accessible modal with audio guidance: *"Possible emergency symptoms detected. Please consult emergency medical staff immediately."* and a direct `Call 108 Emergency` touch button.
- **Immediate Doctor Escalation**: The clinical session triage priority is automatically escalated to **`EMERGENCY`** or **`URGENT`**, and a real-time dispatch alert is routed to the on-duty Vaidya/Doctor dashboard queue.

---

## 📋 2. Comprehensive Clinical Red-Flag Rules Matrix

| Rule ID | Tree / Category | Clinical Trigger Criteria | Severity | Action & Escalation |
|---|---|---|---|---|
| **`RF_ACS_RADIATION`** | `CHEST_PAIN` | Chest pain radiating to left arm, neck, or jaw (`CP_RADIATION == YES`) | **`CRITICAL`** | Auto-escalate triage to `EMERGENCY`. Dispatch ACS priority notification. |
| **`RF_CARDIAC_AUTONOMIC_SIGNS`** | `CHEST_PAIN` | Chest pain + cold sweating (diaphoresis) or acute dyspnea (`CP_ASSOCIATED == DIAPHORESIS`) | **`CRITICAL`** | Auto-escalate triage to `EMERGENCY`. Prompt immediate hospital transfer. |
| **`RF_AORTIC_TEARING`** | `CHEST_PAIN` | Severe tearing/ripping chest pain radiating to interscapular back (`CP_CHARACTER == TEARING_BACK`) | **`CRITICAL`** | Auto-escalate triage to `EMERGENCY`. Emergency vascular/cardiac alert. |
| **`RF_HEADACHE_THUNDERCLAP`** | `HEADACHE` | Explosive headache reaching maximum severity in seconds (`HA_ONSET == THUNDERCLAP_SUDDEN`) | **`CRITICAL`** | Auto-escalate triage to `EMERGENCY`. Suspected subarachnoid hemorrhage. |
| **`RF_STROKE_FAST_SIGNS`** | `HEADACHE` | Unilateral facial droop, arm weakness, or speech slurring (`HA_NEURO_DEFICIT == FACIAL_OR_ARM_WEAKNESS`) | **`CRITICAL`** | Auto-escalate triage to `EMERGENCY`. Suspected acute ischemic stroke (FAST). |
| **`RF_HEADACHE_MENINGISM`** | `HEADACHE` | Headache + neck rigidity + high fever (`HA_ASSOCIATED == NECK_STIFFNESS_FEVER`) | **`CRITICAL`** | Auto-escalate triage to `EMERGENCY`. Suspected acute meningitis. |
| **`RF_GI_BLEED_HEMATEMESIS`** | `ABDOMINAL_PAIN` | Active vomiting of fresh blood or coffee-ground emesis (`ABD_BLEEDING == VOMITING_BLOOD`) | **`CRITICAL`** | Auto-escalate triage to `EMERGENCY`. Upper GI bleeding escalation. |
| **`RF_GI_BLEED_MELENA`** | `ABDOMINAL_PAIN` | Passage of black tarry stools (`ABD_BLEEDING == BLACK_TARRY_STOOL`) | **`HIGH`** | Auto-escalate triage to `URGENT`. Rapid clinical assessment. |
| **`RF_ACUTE_ABDOMEN_RIGIDITY`** | `ABDOMINAL_PAIN` | Board-like abdominal muscle rigidity & guarding (`ABD_CHARACTER == BOARD_LIKE_RIGIDITY`) | **`CRITICAL`** | Auto-escalate triage to `EMERGENCY`. Suspected visceral perforation / peritonitis. |
| **`RF_FEVER_ALTERED_SENSORIUM`** | `FEVER` | High fever + drowsiness, confusion, delirium (`FEVER_NEURO == CONFUSION_DROWSINESS`) | **`CRITICAL`** | Auto-escalate triage to `EMERGENCY`. Sepsis / CNS infection protocol. |
| **`RF_FEVER_SEVERE_DYSPNEA`** | `FEVER` | Fever with marked respiratory distress / blue lips (`FEVER_RESPIRATORY == SEVERE_BREATHLESSNESS`) | **`HIGH`** | Auto-escalate triage to `URGENT`. Severe lower respiratory tract infection. |
| **`RF_SEPTIC_ARTHRITIS`** | `JOINT_PAIN` | Single red hot swollen joint with total inability to bear weight (`JP_SIGNS == HOT_RED_INABILITY_TO_BEAR_WEIGHT`) | **`HIGH`** | Auto-escalate triage to `URGENT`. Orthopedic / Joint aspiration priority. |
| **`RF_ANAPHYLAXIS_AIRWAY`** | `GENERAL` | Sudden lip/tongue angioedema with audible stridor (`GEN_ALLERGY == STRIDOR_LIP_SWELLING`) | **`CRITICAL`** | Auto-escalate triage to `EMERGENCY`. Anaphylactic airway alert. |

---

## 🌲 3. Summary of Implemented Question Trees

1. **Chest Pain Tree**: Severity (1-10) → Character (Pressure vs Tearing vs Sharp) → Radiation (Arm/Jaw) → Associated Autonomic Signs → Exertion.
2. **Headache Tree**: Onset (Thunderclap vs Gradual) → FAST Neuro Deficits → Meningism (Neck stiffness/fever).
3. **Abdominal Pain Tree**: Location (Upper, RIF, Diffuse) → Peritoneal Rigidity → Upper/Lower GI Bleeding check.
4. **Fever Tree**: Duration → Altered Sensorium / Sepsis → Severe Tachypnea / Respiratory distress.
5. **Joint Pain Tree**: Location (Knees/Wrists, Lower Back) → Septic Signs (Hot/Red) → Morning Stiffness > 1 hr (Amavata).
6. **General / Fallback Tree**: Airway / Anaphylaxis screen → Duration.
