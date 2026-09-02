import {
  KnowledgeConceptDomain,
  KnowledgeConceptCategory,
  KnowledgeRelationshipType,
  KnowledgeStatus,
} from "@prisma/client";

export interface SeedKnowledgeSource {
  sourceKey: string;
  title: string;
  publisher: string;
  sourceType: string;
  citation: string;
  version: string;
  language: string;
}

export interface SeedKnowledgeConcept {
  conceptKey: string;
  name: string;
  nameHindi: string;
  nameSanskrit?: string;
  normalizedName: string;
  description: string;
  domain: KnowledgeConceptDomain;
  category: KnowledgeConceptCategory;
  sourceKey: string;
  sourceReference: string;
  version: string;
}

export interface SeedKnowledgeRelationship {
  sourceConceptKey: string;
  targetConceptKey: string;
  relationshipType: KnowledgeRelationshipType;
  clinicalRationale: string;
  weight: number;
  sourceKey: string;
  sourceReference: string;
  version: string;
}

export interface SeedKnowledgePack {
  packKey: string;
  name: string;
  domain: KnowledgeConceptDomain;
  version: string;
  description: string;
  sourceKey: string;
  concepts: SeedKnowledgeConcept[];
  relationships: SeedKnowledgeRelationship[];
}

export const AYURVEDA_CORE_SOURCE: SeedKnowledgeSource = {
  sourceKey: "CHARAKA_SAMHITA_CORE",
  title: "Charaka Samhita (चरक संहिता) - Sutrasthana & Nidanasthana",
  publisher: "Central Council for Research in Ayurvedic Sciences (CCRAS) / AIIA Standard Edition",
  sourceType: "TRADITIONAL_TEXT",
  citation: "Charaka Samhita, Agnivesha's treatise refined by Charaka and redacted by Dridhabala.",
  version: "v1.0",
  language: "sa",
};

export const HOMEOPATHY_CORE_SOURCE: SeedKnowledgeSource = {
  sourceKey: "ORGANON_MEDICINE_CORE",
  title: "Organon of Medicine (6th Edition) & Boericke Materia Medica",
  publisher: "Central Council for Research in Homoeopathy (CCRH)",
  sourceType: "TRADITIONAL_TEXT",
  citation: "Organon of Medicine by Dr. Samuel Hahnemann & Pocket Manual of Materia Medica by William Boericke.",
  version: "v1.0",
  language: "en",
};

export const AYURVEDA_CORE_PACK: SeedKnowledgePack = {
  packKey: "AYURVEDA_CORE_PACK_V1",
  name: "AyurSetu Ayurveda Foundational Ontology Pack v1.0",
  domain: KnowledgeConceptDomain.AYURVEDA,
  version: "v1.0",
  description: "Curated foundational concepts and relationships for Tridosha, Agni, Ama, and common clinical manifestations according to Charaka Samhita.",
  sourceKey: "CHARAKA_SAMHITA_CORE",
  concepts: [
    // 1. Tridoshas
    {
      conceptKey: "concept.dosha.vata",
      name: "Vata Dosha",
      nameHindi: "वात दोष",
      nameSanskrit: "वात",
      normalizedName: "vata dosha",
      description: "Biological principle of movement, kinetic energy, dryness (Ruksha), and cold (Sheeta). Governs nervous and musculoskeletal functions.",
      domain: KnowledgeConceptDomain.AYURVEDA,
      category: KnowledgeConceptCategory.DOSHA,
      sourceKey: "CHARAKA_SAMHITA_CORE",
      sourceReference: "Charaka Sutrasthana 1/59",
      version: "v1.0",
    },
    {
      conceptKey: "concept.dosha.pitta",
      name: "Pitta Dosha",
      nameHindi: "पित्त दोष",
      nameSanskrit: "पित्त",
      normalizedName: "pitta dosha",
      description: "Biological principle of transformation, metabolic heat (Ushna), sharp (Tikshna), and liquidity (Sara). Governs digestion and thermogenesis.",
      domain: KnowledgeConceptDomain.AYURVEDA,
      category: KnowledgeConceptCategory.DOSHA,
      sourceKey: "CHARAKA_SAMHITA_CORE",
      sourceReference: "Charaka Sutrasthana 1/60",
      version: "v1.0",
    },
    {
      conceptKey: "concept.dosha.kapha",
      name: "Kapha Dosha",
      nameHindi: "कफ दोष",
      nameSanskrit: "कफ",
      normalizedName: "kapha dosha",
      description: "Biological principle of structure, cohesion, unctuousness (Snigdha), heaviness (Guru), and stability. Governs cellular stability.",
      domain: KnowledgeConceptDomain.AYURVEDA,
      category: KnowledgeConceptCategory.DOSHA,
      sourceKey: "CHARAKA_SAMHITA_CORE",
      sourceReference: "Charaka Sutrasthana 1/61",
      version: "v1.0",
    },

    // 2. Agni & Ama
    {
      conceptKey: "concept.agni.mandagni",
      name: "Mandagni (Hypofunctioning Digestive Fire)",
      nameHindi: "मन्दाग्नि",
      nameSanskrit: "मन्दाग्नि",
      normalizedName: "mandagni",
      description: "Sluggish, diminished metabolic and digestive capacity leading to incomplete digestion and metabolic toxin accumulation.",
      domain: KnowledgeConceptDomain.AYURVEDA,
      category: KnowledgeConceptCategory.AGNI,
      sourceKey: "CHARAKA_SAMHITA_CORE",
      sourceReference: "Charaka Grahani Chikitsa 15/51",
      version: "v1.0",
    },
    {
      conceptKey: "concept.ama.present",
      name: "Ama (Endogenous Metabolic Toxins)",
      nameHindi: "सामता / आम दोष",
      nameSanskrit: "आम",
      normalizedName: "ama",
      description: "Unprocessed, toxic metabolic by-product generated from impaired Jatharagni, causing channel blockages (Srotorodha).",
      domain: KnowledgeConceptDomain.AYURVEDA,
      category: KnowledgeConceptCategory.AMA,
      sourceKey: "CHARAKA_SAMHITA_CORE",
      sourceReference: "Charaka Sutrasthana 28/6",
      version: "v1.0",
    },

    // 3. Clinical Manifestations & Symptoms
    {
      conceptKey: "concept.symptom.burning_sensation",
      name: "Daha / Epigastric Burning Sensation",
      nameHindi: "दाह / छाती-पेट में जलन",
      nameSanskrit: "दाह",
      normalizedName: "burning sensation epigastric daha",
      description: "Sensation of burning heat in the retrosternal or epigastric area, associated with Pitta aggravation in Annavaha Srotas.",
      domain: KnowledgeConceptDomain.AYURVEDA,
      category: KnowledgeConceptCategory.SYMPTOM,
      sourceKey: "CHARAKA_SAMHITA_CORE",
      sourceReference: "Charaka Sutrasthana 20/14",
      version: "v1.0",
    },
    {
      conceptKey: "concept.symptom.knee_joint_pain",
      name: "Sandhi Shoola (Knee Joint Pain with Morning Stiffness)",
      nameHindi: "संधिशूल / घुटने में दर्द व जकड़न",
      nameSanskrit: "संधिशूल",
      normalizedName: "knee joint pain sandhi shoola",
      description: "Pain and stiffness in joint structures, characteristically presenting in Vataja and Amavata patterns.",
      domain: KnowledgeConceptDomain.AYURVEDA,
      category: KnowledgeConceptCategory.SYMPTOM,
      sourceKey: "CHARAKA_SAMHITA_CORE",
      sourceReference: "Charaka Chikitsasthana 28/37",
      version: "v1.0",
    },
    {
      conceptKey: "concept.symptom.acid_reflux",
      name: "Amlika / Amlodgara (Acid Eructations & Reflux)",
      nameHindi: "अम्लोद्गार / खट्टी डकार",
      nameSanskrit: "अम्लोद्गार",
      normalizedName: "acid reflux amlodgara",
      description: "Sour eructations and regurgitation indicating Vidagdhajirna and Pitta-dominant Amlapitta.",
      domain: KnowledgeConceptDomain.AYURVEDA,
      category: KnowledgeConceptCategory.SYMPTOM,
      sourceKey: "CHARAKA_SAMHITA_CORE",
      sourceReference: "Charaka Grahani 15/48",
      version: "v1.0",
    },
  ],
  relationships: [
    {
      sourceConceptKey: "concept.symptom.burning_sensation",
      targetConceptKey: "concept.dosha.pitta",
      relationshipType: KnowledgeRelationshipType.CHARACTERISTIC_OF,
      clinicalRationale: "Epigastric and retrosternal burning is a primary clinical cardinal sign (Karma/Lakshana) of elevated Ushna and Tikshna gunas of Pitta.",
      weight: 0.95,
      sourceKey: "CHARAKA_SAMHITA_CORE",
      sourceReference: "Charaka Sutrasthana 20/14",
      version: "v1.0",
    },
    {
      sourceConceptKey: "concept.symptom.acid_reflux",
      targetConceptKey: "concept.dosha.pitta",
      relationshipType: KnowledgeRelationshipType.CHARACTERISTIC_OF,
      clinicalRationale: "Sour eructation (Amlodgara) is directly associated with aggravated Amla and Drava gunas of Pitta in gastrointestinal tract.",
      weight: 0.90,
      sourceKey: "CHARAKA_SAMHITA_CORE",
      sourceReference: "Charaka Grahani 15/48",
      version: "v1.0",
    },
    {
      sourceConceptKey: "concept.symptom.burning_sensation",
      targetConceptKey: "concept.agni.mandagni",
      relationshipType: KnowledgeRelationshipType.ASSOCIATED_WITH,
      clinicalRationale: "Impaired digestive fire produces Vidagdha state leading to secondary Pitta escalation and burning.",
      weight: 0.85,
      sourceKey: "CHARAKA_SAMHITA_CORE",
      sourceReference: "Charaka Grahani Chikitsa 15/51",
      version: "v1.0",
    },
    {
      sourceConceptKey: "concept.symptom.knee_joint_pain",
      targetConceptKey: "concept.dosha.vata",
      relationshipType: KnowledgeRelationshipType.CHARACTERISTIC_OF,
      clinicalRationale: "Pain (Shoola) in musculoskeletal structures does not occur without Vata involvement (Naasti ruja vina vaatat).",
      weight: 0.95,
      sourceKey: "CHARAKA_SAMHITA_CORE",
      sourceReference: "Charaka Chikitsasthana 28/37",
      version: "v1.0",
    },
    {
      sourceConceptKey: "concept.symptom.knee_joint_pain",
      targetConceptKey: "concept.ama.present",
      relationshipType: KnowledgeRelationshipType.ASSOCIATED_WITH,
      clinicalRationale: "Morning joint stiffness (Stambha) associated with pain frequently points to Ama circulating in Sandhi structures (Amavata).",
      weight: 0.88,
      sourceKey: "CHARAKA_SAMHITA_CORE",
      sourceReference: "Charaka Sutrasthana 28/6",
      version: "v1.0",
    },
  ],
};

export const HOMEOPATHY_CORE_PACK: SeedKnowledgePack = {
  packKey: "HOMEOPATHY_CORE_PACK_V1",
  name: "AyurSetu Homeopathy Foundational Ontology Pack v1.0",
  domain: KnowledgeConceptDomain.HOMEOPATHY,
  version: "v1.0",
  description: "Curated foundational concepts and relationships for Homeopathic modalities, miasms, and constitutional characteristics according to Hahnemannian Organon.",
  sourceKey: "ORGANON_MEDICINE_CORE",
  concepts: [
    // 1. Miasms
    {
      conceptKey: "concept.miasm.psora",
      name: "Psora Miasm",
      nameHindi: "सोरा मियाज्म",
      normalizedName: "psora miasm",
      description: "Fundamental dynamic miasm manifesting as functional disturbance, hypersensitivity, pruritus, and lack of cellular destruction.",
      domain: KnowledgeConceptDomain.HOMEOPATHY,
      category: KnowledgeConceptCategory.MIASM,
      sourceKey: "ORGANON_MEDICINE_CORE",
      sourceReference: "Organon of Medicine §80",
      version: "v1.0",
    },
    {
      conceptKey: "concept.miasm.sycotic",
      name: "Sycosis Miasm",
      nameHindi: "साइकोसिस मियाज्म",
      normalizedName: "sycosis miasm",
      description: "Miasm characterized by overgrowth, proliferation, joint infiltration, and aggravation from cold, damp weather.",
      domain: KnowledgeConceptDomain.HOMEOPATHY,
      category: KnowledgeConceptCategory.MIASM,
      sourceKey: "ORGANON_MEDICINE_CORE",
      sourceReference: "Organon of Medicine §79",
      version: "v1.0",
    },

    // 2. Modalities
    {
      conceptKey: "concept.modality.worse_cold_damp",
      name: "Aggravation: Cold, Damp Weather",
      nameHindi: "शीत व नम मौसम में वृद्धि",
      normalizedName: "worse cold damp weather aggravation",
      description: "Symptom escalation experienced during atmospheric changes to cold, rainy, or humid damp environments.",
      domain: KnowledgeConceptDomain.HOMEOPATHY,
      category: KnowledgeConceptCategory.MODALITY,
      sourceKey: "ORGANON_MEDICINE_CORE",
      sourceReference: "Boericke Materia Medica General Modalities",
      version: "v1.0",
    },
    {
      conceptKey: "concept.modality.worse_night",
      name: "Aggravation: Nocturnal / After Midnight",
      nameHindi: "रात्रि कालीन वृद्धि",
      normalizedName: "worse night nocturnal aggravation",
      description: "Symptom escalation occurring specifically during nocturnal hours or post-midnight.",
      domain: KnowledgeConceptDomain.HOMEOPATHY,
      category: KnowledgeConceptCategory.MODALITY,
      sourceKey: "ORGANON_MEDICINE_CORE",
      sourceReference: "Boericke Materia Medica General Modalities",
      version: "v1.0",
    },
  ],
  relationships: [
    {
      sourceConceptKey: "concept.modality.worse_cold_damp",
      targetConceptKey: "concept.miasm.sycotic",
      relationshipType: KnowledgeRelationshipType.CHARACTERISTIC_OF,
      clinicalRationale: "Cold damp aggravation is recognized as a key constitutional modality reflecting sycotic miasmatic diathesis.",
      weight: 0.90,
      sourceKey: "ORGANON_MEDICINE_CORE",
      sourceReference: "Organon of Medicine §79",
      version: "v1.0",
    },
  ],
};
