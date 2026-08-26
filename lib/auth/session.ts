import { auth } from "./auth";
import { redirect } from "next/navigation";

export type AllowedRole = "PATIENT" | "DOCTOR" | "ADMIN" | "NURSE";

/**
 * Returns the currently authenticated user session or null
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/**
 * Ensures user is authenticated; otherwise redirects to login page
 */
export async function requireAuth(returnUrl: string = "/login") {
  const user = await getCurrentUser();
  if (!user) {
    redirect(returnUrl);
  }
  return user;
}

/**
 * Enforces role-based authorization
 */
export async function requireRole(allowedRoles: AllowedRole[], redirectUrl: string = "/login") {
  const user = await requireAuth(redirectUrl);
  if (!allowedRoles.includes(user.role as AllowedRole)) {
    redirect("/unauthorized");
  }
  return user;
}
