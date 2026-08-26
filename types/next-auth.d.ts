import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "PATIENT" | "DOCTOR" | "ADMIN" | "NURSE";
      abhaId?: string | null;
      phone?: string | null;
      preferredLanguage?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    role?: "PATIENT" | "DOCTOR" | "ADMIN" | "NURSE";
    abhaId?: string | null;
    phone?: string | null;
    preferredLanguage?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "PATIENT" | "DOCTOR" | "ADMIN" | "NURSE";
    abhaId?: string | null;
    phone?: string | null;
    preferredLanguage?: string;
  }
}
