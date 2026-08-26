import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { AbhaMockProvider } from "./abha-provider";

export const authConfig: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: "Ayush Credentials",
      credentials: {
        email: { label: "Email / Reg No", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        // Mock authorization for scaffolding/development
        return {
          id: "usr_mock_01",
          name: "Dr. Ayush Vaidya",
          email: String(credentials.email),
          role: "DOCTOR",
        };
      },
    }),
    AbhaMockProvider({
      clientId: process.env.ABDM_CLIENT_ID || "mock-abdm-client",
      clientSecret: process.env.ABDM_CLIENT_SECRET || "mock-abdm-secret",
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.role) {
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
