export type DoshaType = "VATA" | "PITTA" | "KAPHA" | "VATA_PITTA" | "PITTA_KAPHA" | "VATA_KAPHA" | "SAMADOSHA";

export interface AshtavidhaParikshaData {
  nadi?: string;
  mutra?: string;
  mala?: string;
  jihwa?: string;
  shabda?: string;
  sparsha?: string;
  drik?: string;
  akriti?: string;
}

export interface DashavidhaParikshaData {
  dushya?: string;
  desha?: string;
  bala?: string;
  kala?: string;
  anala?: "SAMA_AGNI" | "VISHAMA_AGNI" | "TIKSHNA_AGNI" | "MANDA_AGNI";
  prakriti?: string;
  vayas?: string;
  sattva?: string;
  satmya?: string;
  aharaShakti?: string;
  vyayamaShakti?: string;
}

export interface AyushPrescriptionItem {
  medicineName: string;
  formulation?: string;
  dosage: string;
  frequency: string;
  anupana?: string;
  durationDays: number;
  instructions?: string;
}

export interface AyushEncounterData {
  patientId: string;
  doctorId: string;
  chiefComplaints: Array<{
    symptom: string;
    duration: string;
    severity: "Mild" | "Moderate" | "Severe";
  }>;
  historyPresent?: string;
  ashtavidha?: AshtavidhaParikshaData;
  dashavidha?: DashavidhaParikshaData;
  ayushDiagnosis?: string;
  namasteCode?: string;
  prescriptions?: AyushPrescriptionItem[];
}
