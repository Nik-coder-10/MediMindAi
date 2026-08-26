import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { AbhaMockService } from "./abha-mock-service";

export const authConfig: NextAuthConfig = {
  providers: [
    // 1. Doctor & Admin Credentials Login
    CredentialsProvider({
      id: "credentials",
      name: "Ayush Staff Credentials",
      credentials: {
        email: { label: "Email / Reg ID", type: "text" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = String(credentials.email).toLowerCase();
        const role = (credentials.role as any) || (email.includes("admin") ? "ADMIN" : "DOCTOR");

        // Doctor / Admin mock authorization
        return {
          id: role === "ADMIN" ? "usr-admin-demo-uuid" : "usr-doctor-demo-uuid",
          name: role === "ADMIN" ? "System Administrator" : "Dr. Rajesh Vaidya",
          email,
          role,
          preferredLanguage: "hi",
        };
      },
    }),

    // 2. Patient Phone + OTP Login
    CredentialsProvider({
      id: "phone-otp",
      name: "Patient Phone OTP",
      credentials: {
        phone: { label: "Mobile Number", type: "text" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.otp) return null;
        const isValidOtp = AbhaMockService.verifyOtp(String(credentials.otp));
        if (!isValidOtp) return null;

        const phone = String(credentials.phone);
        const abhaData = AbhaMockService.generateAbha(phone, "Ramesh Sharma");

        return {
          id: "usr-patient-demo-uuid",
          name: abhaData.name,
          phone,
          email: `${phone}@patient.ayursetu.gov.in`,
          role: "PATIENT",
          abhaId: abhaData.abhaNumber,
          preferredLanguage: "hi",
        };
      },
    }),

    // 3. Mock ABHA Quick Login
    CredentialsProvider({
      id: "abha-login",
      name: "ABHA Card Login",
      credentials: {
        abhaIdOrAddress: { label: "ABHA Number or Address", type: "text" },
      },
      async authorize(credentials) {
        const input = String(credentials?.abhaIdOrAddress || "14-5542-8921-3410");
        const abhaData = AbhaMockService.generateAbha("+919876543210", "Ramesh Sharma");

        return {
          id: "usr-patient-demo-uuid",
          name: abhaData.name,
          phone: abhaData.phone,
          email: `${abhaData.phone}@patient.ayursetu.gov.in`,
          role: "PATIENT",
          abhaId: input.includes("14-") ? input : abhaData.abhaNumber,
          preferredLanguage: "hi",
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user.role as any) || "PATIENT";
        token.abhaId = user.abhaId;
        token.phone = user.phone;
        token.preferredLanguage = user.preferredLanguage || "en";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || (token.sub as string);
        session.user.role = (token.role as any) || "PATIENT";
        session.user.abhaId = token.abhaId as string | null;
        session.user.phone = token.phone as string | null;
        session.user.preferredLanguage = (token.preferredLanguage as string) || "en";
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.AUTH_SECRET || "sih2026-ayush-platform-secret-key-32charsmin",
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
