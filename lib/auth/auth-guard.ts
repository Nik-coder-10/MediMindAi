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
    const testUserId = req.headers.get("x-test-user-id"); // Test bypass header for unit tests

    // 1. Handle unit testing header if running in non-production
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
        console.warn("AuthService test user lookup skipped (DB offline):", dbErr);
        return null;
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

    const session = await prisma.clinicalSession.findUnique({
      where: { id: sessionId, deletedAt: null },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
      },
    });

    if (!session) {
      throw AppError.notFound(`ClinicalSession '${sessionId}' was not found.`);
    }

    // 1. Admin has access
    if (user.role === Role.ADMIN) {
      return { user, session };
    }

    // 2. Patient can ONLY access their own session
    if (user.role === Role.PATIENT) {
      if (session.patient.userId !== user.id && session.patientId !== user.patientProfile?.id) {
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
