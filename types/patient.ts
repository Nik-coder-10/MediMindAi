export interface PatientProfile {
  id: string;
  userId: string;
  name: string;
  email?: string;
  dateOfBirth: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  contactNo?: string;
  address?: string;
  abhaNumber?: string;
  healthId?: string;
  dominantPrakriti?: string;
}
