# AYUSH & Ayurveda Clinical Mode Specification (Charaka Samhita Model)

**Ministry of Ayush / All India Institute of Ayurveda (AIIA)**
**AyurSetu Clinical Platform**

---

## 🌿 1. Overview & Philosophical Foundations
The **AYUSH Clinical Mode** embeds classical Ayurvedic diagnostic methodologies directly into modern digital case-taking:
- **Holistic Individualization**: Accounts for individual constitutional variance (*Prakriti*) rather than a one-size-fits-all disease model.
- **Charaka Samhita Dashavidha Pariksha**: Systematic evaluation of ten fundamental diagnostic parameters to ascertain disease severity (*Rogabala*) and patient vitality (*Rogibala*).
- **NAMASTE / ABDM Interoperability**: Seamlessly maps Ayurvedic terminology into standard FHIR bundles.

---

## 🪷 2. The Ten Parameters of Dashavidha Pariksha

| Parameter (परीक्षा) | Clinical Focus | Assessment Criteria & Values |
|---|---|---|
| **1. Prakriti (प्रकृति)** | Baseline Constitutional Dosha | `VATA`, `PITTA`, `KAPHA`, `VATA_PITTA`, `PITTA_KAPHA`, `VATA_KAPHA`, `SAMADOSHA` |
| **2. Vikriti (विकृति)** | Current Dosha Morbidity & Dushti | Primary active doshic imbalance manifested in current illness. |
| **3. Sara (सार)** | Dhatu Excellence & Tissue Quality | `PRAVARA` (Superior), `MADHYAMA` (Medium), `AVARA` (Inferior) across 8 Dhatus. |
| **4. Samhanana (संहनन)** | Compactness & Skeletal Symmetry | Physical symmetry and compactness of body joints. |
| **5. Pramana (प्रमाण)** | Anthropometric Proportions | Body height, weight, arm span (Anguli Pramana standards). |
| **6. Satmya (सात्म्य)** | Adaptability & Homologation | Suitability to diet, climate, seasons, and medications. |
| **7. Sattva (सत्त्व)** | Mental Resilience & Temperament | High resilience (`Pravara`), Moderate (`Madhyama`), or Low resilience (`Avara`). |
| **8. Ahara Shakti (आहार शक्ति)** | Appetite (*Abhyavaharana*) & Digestion (*Jarana*) | `SAMAGNI`, `MANDAGNI`, `TIKSHNAGNI`, `VISHAMAGNI`. |
| **9. Vyayama Shakti (व्यायाम शक्ति)** | Physical Endurance & Vitality (*Bala*) | Work capacity and exertion tolerance before breathlessness. |
| **10. Vaya (वय)** | Age Stage & Life Phase | `BALA` (0-16 yrs), `MADHYAMA` (16-60 yrs), `VRIDDHA` (>60 yrs). |

---

## 💬 3. Sample Dashavidha Adaptive Questions

### Question 1: Prakriti (प्रकृति परीक्षा)
- **Hindi**: *"आपकी प्राकृतिक शारीरिक बनावट और त्वचा का स्वभाव कैसा है?"*
- **English**: *"Which best describes your natural body frame and skin texture?"*
- **Options**:
  - `VATA`: पतला शरीर, रूखी त्वचा व चंचल स्वभाव (Lean, dry skin)
  - `PITTA`: मध्यम शरीर, गर्म त्वचा व अधिक पसीना (Medium build, warm skin)
  - `KAPHA`: मजबूत चौड़ा शरीर, चिकनी व ठंडी त्वचा (Solid frame, moist skin)

### Question 2: Agni (अग्नि परीक्षा)
- **Hindi**: *"आपकी भूख और भोजन पचने की क्षमता कैसी रहती है?"*
- **English**: *"How is your appetite and digestion after meals?"*
- **Options**:
  - `SAMAGNI`: नियमित व संतुलित पाचन (Balanced)
  - `MANDAGNI`: धीमी भूख, पेट में भारीपन व सुस्ती (Sluggish)
  - `TIKSHNAGNI`: अत्यधिक तेज भूख, सीने में जलन (Intense / Acidic)
  - `VISHAMAGNI`: कभी तेज भूख कभी नहीं, गैस व अफरा (Irregular)

### Question 3: Koshtha (कोष्ठ परीक्षा)
- **Hindi**: *"पेट साफ होने (शौच) की स्थिति कैसी रहती है?"*
- **English**: *"How are your bowel evacuation habits?"*
- **Options**:
  - `MRIDU`: आसानी से व कई बार साफ (Soft / Rapid)
  - `MADHYAMA`: नियमित रूप से (Normal)
  - `KRURA`: कड़ा मल या कब्जियत (Hard / Constipated)
