import { create } from "zustand";
import { AyushEncounterData, AshtavidhaParikshaData, DashavidhaParikshaData, AyushPrescriptionItem } from "@/types/ayush";

interface CaseTakingState {
  currentStep: number;
  patientId: string | null;
  chiefComplaints: Array<{ symptom: string; duration: string; severity: "Mild" | "Moderate" | "Severe" }>;
  historyPresent: string;
  ashtavidha: AshtavidhaParikshaData;
  dashavidha: DashavidhaParikshaData;
  prescriptions: AyushPrescriptionItem[];
  diagnosis: string;
  namasteCode: string;

  // Actions
  setStep: (step: number) => void;
  setPatientId: (id: string) => void;
  addChiefComplaint: (complaint: { symptom: string; duration: string; severity: "Mild" | "Moderate" | "Severe" }) => void;
  updateAshtavidha: (data: Partial<AshtavidhaParikshaData>) => void;
  updateDashavidha: (data: Partial<DashavidhaParikshaData>) => void;
  addPrescription: (item: AyushPrescriptionItem) => void;
  setDiagnosis: (diagnosis: string, namasteCode?: string) => void;
  resetCase: () => void;
}

const initialState = {
  currentStep: 1,
  patientId: null,
  chiefComplaints: [],
  historyPresent: "",
  ashtavidha: {},
  dashavidha: {},
  prescriptions: [],
  diagnosis: "",
  namasteCode: "",
};

export const useCaseTakingStore = create<CaseTakingState>((set) => ({
  ...initialState,
  setStep: (step) => set({ currentStep: step }),
  setPatientId: (id) => set({ patientId: id }),
  addChiefComplaint: (complaint) =>
    set((state) => ({ chiefComplaints: [...state.chiefComplaints, complaint] })),
  updateAshtavidha: (data) =>
    set((state) => ({ ashtavidha: { ...state.ashtavidha, ...data } })),
  updateDashavidha: (data) =>
    set((state) => ({ dashavidha: { ...state.dashavidha, ...data } })),
  addPrescription: (item) =>
    set((state) => ({ prescriptions: [...state.prescriptions, item] })),
  setDiagnosis: (diagnosis, namasteCode = "") =>
    set({ diagnosis, namasteCode }),
  resetCase: () => set(initialState),
}));
