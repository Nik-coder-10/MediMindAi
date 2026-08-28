import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { AuthService } from "@/lib/auth/auth-guard";

export const dynamic = "force-dynamic";

export interface ClinicalNotification {
  id: string;
  type: "RED_FLAG_CRITICAL" | "NEW_SESSION_READY" | "SUMMARY_ACCEPTED" | "CONSENT_REVOKED";
  token: string;
  title: string;
  message: string;
  urgency: "EMERGENCY" | "URGENT" | "ROUTINE";
  timestamp: string;
  acknowledged: boolean;
}

// In-memory shift notification log
const shiftNotifications: ClinicalNotification[] = [
  {
    id: "notif-001",
    type: "RED_FLAG_CRITICAL",
    token: "#AIIA-104",
    title: "🚨 आपातकालीन रेड-फ्लैग (Critical ACS Alert)",
    message: "Patient reports crushing chest pain with left arm radiation (RF_ACS_RADIATION).",
    urgency: "EMERGENCY",
    timestamp: "Just now",
    acknowledged: false,
  },
  {
    id: "notif-002",
    type: "NEW_SESSION_READY",
    token: "#AIIA-105",
    title: "🌿 नया आयुर्वेद केस तैयार (AYUSH Case Ready)",
    message: "Patient completed Dashavidha Pariksha intake for chronic Amavata.",
    urgency: "ROUTINE",
    timestamp: "4 min ago",
    acknowledged: false,
  },
];

export async function GET(req: NextRequest) {
  try {
    await AuthService.requireDoctor(req);

    return apiSuccess({
      unreadCount: shiftNotifications.filter((n) => !n.acknowledged).length,
      notifications: shiftNotifications,
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await AuthService.requireDoctor(req);

    const body = await req.json();
    const { notificationId } = body;


    const notif = shiftNotifications.find((n) => n.id === notificationId);
    if (notif) {
      notif.acknowledged = true;
    }

    return apiSuccess({ success: true, notification: notif });
  } catch (error) {
    return apiError(error);
  }
}
