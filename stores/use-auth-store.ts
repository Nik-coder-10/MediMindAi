import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type UserRole = "PATIENT" | "DOCTOR" | "ADMIN";

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
  phone?: string;
  // Patient ABHA Details
  abhaId?: string;
  age?: number;
  gender?: string;
  bloodGroup?: string;
  address?: string;
  state?: string;
  pincode?: string;
  // Doctor Credentials
  doctorRegNumber?: string;
  specialization?: string;
  hospitalName?: string;
  department?: string;
  // Admin / Ministry Details
  adminMinistryDept?: string;
  adminEmployeeId?: string;
  adminDesignation?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  loginAsPatient: (profile?: Partial<UserProfile>) => void;
  loginAsDoctor: (profile?: Partial<UserProfile>) => void;
  loginAsAdmin: (profile?: Partial<UserProfile>) => void;
  logout: () => void;
  updateUser: (data: Partial<UserProfile>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,

      loginAsPatient: (profile) =>
        set({
          isAuthenticated: true,
          user: {
            id: "pat-104-demo",
            name: profile?.name || "Ramesh Sharma",
            role: "PATIENT",
            phone: profile?.phone || "+91 98765 43210",
            email: profile?.email || "ramesh.sharma@abha.gov.in",
            abhaId: profile?.abhaId || "14-5542-8921-3410",
            age: profile?.age || 42,
            gender: profile?.gender || "MALE",
            bloodGroup: profile?.bloodGroup || "B+",
            address: "House 42, Sector 12, RK Puram",
            state: "Delhi (NCT)",
            pincode: "110022",
            ...profile,
          },
        }),

      loginAsDoctor: (profile) =>
        set({
          isAuthenticated: true,
          user: {
            id: "doc-8842-demo",
            name: profile?.name || "Dr. Arvind K. Sharma (MD, BAMS)",
            role: "DOCTOR",
            email: profile?.email || "dr.rajesh.vaidya@aiia.gov.in",
            doctorRegNumber: profile?.doctorRegNumber || "AYUSH-REG-DL-2024-9842",
            specialization: profile?.specialization || "Senior Vaidya & Consultant Physician",
            hospitalName: profile?.hospitalName || "All India Institute of Ayurveda (AIIA), New Delhi",
            department: profile?.department || "Kayachikitsa & Triage Desk",
            ...profile,
          },
        }),

      loginAsAdmin: (profile) =>
        set({
          isAuthenticated: true,
          user: {
            id: "adm-001-demo",
            name: profile?.name || "Dr. S. K. Narayanan (Joint Director)",
            role: "ADMIN",
            email: profile?.email || "director.ayush@nic.in",
            adminMinistryDept: profile?.adminMinistryDept || "Ministry of Ayush, Govt. of India",
            adminEmployeeId: profile?.adminEmployeeId || "AYUSH-GOV-ID-2026-881",
            adminDesignation: profile?.adminDesignation || "National Nodal Officer & Clinical Admin",
            hospitalName: "National Ayush Mission (NAM) HQ, New Delhi",
            ...profile,
          },
        }),

      logout: () => set({ isAuthenticated: false, user: null }),
      updateUser: (data) =>
        set((state) => ({ user: state.user ? { ...state.user, ...data } : null })),
    }),
    {
      name: "ayursetu_auth_session",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

