import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/api/errors";
import { supabaseAdminClient } from "./supabase-client";
import { Role } from "@prisma/client";

export interface AuthenticatedUser {
  id: string; // AyurSetu Prisma User UUID
  supabaseUserId: string; // Supabase Auth UID
  email: string | null;
  phone: string | null;
  role: Role;
  preferredLanguage: string;
  patientProfile?: {
    id: string;
    firstName: string;
    lastName: string;
    abhaId?: string | null;
  } | null;
  doctorProfile?: {
    id: string;
    registrationNumber: string;
    specialization: string;
    hospitalAffiliation?: string | null;
  } | null;
}

export class AuthService {
  /**
   * Resolves and verifies the authenticated user from the Authorization Bearer header
   * or session cookie. Supports both real Supabase JWTs and test tokens in test environment.
   */
  static async getAuthenticatedUser(req: NextRequest): Promise<AuthenticatedUser | null> {
    const authHeader = req.headers.get("Authorization");
    const testUserId = req.headers.get("x-test-user-id") || (process.env.NODE_ENV !== "production" ? req.headers.get("x-user-id") : null); // Test bypass / dev client header

    // 1. Handle unit testing and dev client headers if running in non-production
    if (process.env.NODE_ENV !== "production" && testUserId) {
      try {
        const user = await prisma.user.findFirst({
          where: {
            OR: [{ id: testUserId }, { supabaseUserId: testUserId }],
            isActive: true,
            deletedAt: null,
          },
          include: {
            patientProfile: true,
            doctorProfile: true,
          },
        });

        if (user) {
          return {
            id: user.id,
            supabaseUserId: user.supabaseUserId || user.id,
            email: user.email,
            phone: user.phone,
            role: user.role,
            preferredLanguage: user.preferredLanguage,
            patientProfile: user.patientProfile,
            doctorProfile: user.doctorProfile,
          };
        }
      } catch (dbErr) {
        console.warn("AuthService user lookup fallback (DB offline or local):", (dbErr as any)?.message);
      }

      // Resilience Fallback for local demo personas when DB is offline or seeded in memory
      if (testUserId === "pat-104-demo" || testUserId.startsWith("pat-")) {
        return {
          id: testUserId,
          supabaseUserId: testUserId,
          email: "ramesh.sharma@abha.gov.in",
          phone: "+91 98765 43210",
          role: Role.PATIENT,
          preferredLanguage: "hi",
          patientProfile: {
            id: "pat-prof-104",
            userId: testUserId,
            abhaAddress: "ramesh.sharma@abdm",
            firstName: "Ramesh",
            lastName: "Sharma",
            dateOfBirth: new Date("1982-05-14"),
            gender: "MALE" as any,
            bloodGroup: "B_POSITIVE" as any,
            pincode: "110029",
            emergencyContactPhone: "+91 98765 43211",
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
          } as any,
          doctorProfile: null,
        };
      }

      if (testUserId === "doc-8842-demo" || testUserId.startsWith("doc-")) {
        return {
          id: testUserId,
          supabaseUserId: testUserId,
          email: "dr.rajesh.vaidya@aiia.gov.in",
          phone: "+91 98765 88420",
          role: Role.DOCTOR,
          preferredLanguage: "hi",
          patientProfile: null,
          doctorProfile: {
            id: "doc-prof-8842",
            userId: testUserId,
            registrationNumber: "AYUSH-REG-DL-2024-9842",
            specialization: "Senior Vaidya & Consultant Physician",
            hospitalAffiliation: "All India Institute of Ayurveda (AIIA), New Delhi",
            qualifications: ["BAMS", "MD (Ayurveda)"],
            isAvailable: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as any,
        };
      }

      if (testUserId === "adm-001-demo" || testUserId.startsWith("adm-")) {
        return {
          id: testUserId,
          supabaseUserId: testUserId,
          email: "director.ayush@nic.in",
          phone: "+91 98765 00001",
          role: Role.ADMIN,
          preferredLanguage: "hi",
          patientProfile: null,
          doctorProfile: null,
        };
      }
    }


    // 2. Extract Bearer token
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7).trim();
    if (!token) return null;

    try {
      // 3. Verify JWT with Supabase Auth
      const { data: { user: sbUser }, error } = await supabaseAdminClient.auth.getUser(token);

      if (error || !sbUser) {
        return null;
      }

      // 4. Map Supabase User ID to Prisma User record
      const dbUser = await prisma.user.findFirst({
        where: {
          OR: [
            { supabaseUserId: sbUser.id },
            ...(sbUser.email ? [{ email: sbUser.email }] : []),
            ...(sbUser.phone ? [{ phone: sbUser.phone }] : []),
          ],
          isActive: true,
          deletedAt: null,
        },
        include: {
          patientProfile: true,
          doctorProfile: true,
        },
      });

      if (!dbUser) {
        return null;
      }

      // Sync supabaseUserId if newly linked
      if (!dbUser.supabaseUserId && sbUser.id) {
        await prisma.user.update({
          where: { id: dbUser.id },
          data: { supabaseUserId: sbUser.id },
        });
      }

      return {
        id: dbUser.id,
        supabaseUserId: sbUser.id,
        email: dbUser.email,
        phone: dbUser.phone,
        role: dbUser.role,
        preferredLanguage: dbUser.preferredLanguage,
        patientProfile: dbUser.patientProfile,
        doctorProfile: dbUser.doctorProfile,
      };
    } catch (e) {
      console.error("AuthService session verification failed:", e);
      return null;
    }
  }

  /**
   * Enforces that the request has a valid authenticated session
   */
  static async requireUser(req: NextRequest): Promise<AuthenticatedUser> {
    const user = await this.getAuthenticatedUser(req);
    if (!user) {
      throw AppError.unauthorized("Authentication required to access this clinical resource.");
    }
    return user;
  }

  /**
   * Enforces that the authenticated user possesses one of the allowed roles
   */
  static async requireRole(req: NextRequest, allowedRoles: Role[]): Promise<AuthenticatedUser> {
    const user = await this.requireUser(req);
    if (!allowedRoles.includes(user.role)) {
      throw AppError.forbidden(`Access restricted. Required roles: ${allowedRoles.join(", ")}.`);
    }
    return user;
  }

  /**
   * Enforces Patient identity and returns the patient profile
   */
  static async requirePatient(req: NextRequest): Promise<AuthenticatedUser> {
    const user = await this.requireRole(req, [Role.PATIENT]);
    if (!user.patientProfile) {
      throw AppError.forbidden("No active Patient Profile associated with this account.");
    }
    return user;
  }

  /**
   * Enforces Doctor identity and returns the doctor profile
   */
  static async requireDoctor(req: NextRequest): Promise<AuthenticatedUser> {
    const user = await this.requireRole(req, [Role.DOCTOR, Role.ADMIN]);
    if (user.role === Role.DOCTOR && !user.doctorProfile) {
      throw AppError.forbidden("No active Doctor Profile associated with this account.");
    }
    return user;
  }

  /**
   * Enforces Admin / Ministry identity
   */
  static async requireAdmin(req: NextRequest): Promise<AuthenticatedUser> {
    return await this.requireRole(req, [Role.ADMIN]);
  }

  /**
   * Verifies that the authenticated user owns or is authorized to access a specific clinical session
   */
  static async requireSessionAccess(req: NextRequest, sessionId: string) {
    const user = await this.requireUser(req);

    let session: any = null;
    try {
      session = await prisma.clinicalSession.findUnique({
        where: { id: sessionId, deletedAt: null },
        include: {
          patient: { include: { user: true } },
          doctor: { include: { user: true } },
        },
      });
    } catch (dbErr) {
      console.warn("AuthService DB query fallback to memory store:", (dbErr as any)?.message);
    }

    if (!session) {
      const { inMemoryClinicalStore } = await import("@/lib/db/in-memory-store");
      const memSession = inMemoryClinicalStore.getSession(sessionId);
      if (memSession) {
        session = memSession;
      }
    }

    if (!session) {
      throw AppError.notFound(`ClinicalSession '${sessionId}' was not found.`);
    }

    // 1. Admin has access
    if (user.role === Role.ADMIN) {
      return { user, session };
    }

    // 2. Patient can ONLY access their own session
    if (user.role === Role.PATIENT) {
      const sessionPatientUserId = session.patient?.userId || session.patient?.user?.id;
      const sessionPatientId = session.patientId || session.patient?.id;
      const userPatientProfileId = user.patientProfile?.id;

      if (sessionPatientUserId !== user.id && (!userPatientProfileId || sessionPatientId !== userPatientProfileId)) {
        throw AppError.forbidden("You are not authorized to view or modify this patient encounter.");
      }
      return { user, session };
    }

    // 3. Doctor access: Doctor assigned to session, or patient in doctor's active clinical queue
    if (user.role === Role.DOCTOR) {
      // In triage desk mode, doctors can evaluate active unassigned sessions or assigned sessions
      if (session.doctorId && session.doctorId !== user.doctorProfile?.id) {
        // If explicitly assigned to another doctor, verify consultation transfer or restrict
        throw AppError.forbidden("This case is assigned to another attending physician.");
      }
      return { user, session };
    }

    throw AppError.forbidden("Insufficient permissions to access this clinical session.");
  }
}
