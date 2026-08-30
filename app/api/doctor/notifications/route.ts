import { NextRequest, NextResponse } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { AppError } from "@/lib/api/errors";
import { AuthService } from "@/lib/auth/auth-guard";
import { NotificationService } from "@/lib/services/notification.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/doctor/notifications
 * Returns all notifications with unread badge count for attending doctor.
 */
export async function GET(req: NextRequest) {
  try {
    await AuthService.requireDoctor(req);

    const result = NotificationService.getDoctorNotifications();
    return apiSuccess(result);
  } catch (error) {
    return apiError(error);
  }
}

/**
 * POST /api/doctor/notifications
 * Doctor acknowledges a notification (or marks all read).
 */
export async function POST(req: NextRequest) {
  try {
    const doctor = await AuthService.requireDoctor(req);
    const body = await req.json();
    const { notificationId, markAllRead } = body;

    if (markAllRead) {
      const { notificationStore } = await import("@/lib/services/notification.service");
      notificationStore.markAllAsRead();
      return apiSuccess({ success: true, message: "All notifications marked as read." });
    }

    if (!notificationId) {
      throw AppError.badRequest("notificationId is required for acknowledgment");
    }

    const updated = await NotificationService.acknowledgeNotification(notificationId, {
      id: doctor.id,
      name: (doctor as any).name,
      email: doctor.email || undefined,
    });
    if (!updated) {
      throw AppError.notFound("Notification not found");
    }

    return apiSuccess({
      success: true,
      notification: updated,
    });
  } catch (error) {
    return apiError(error);
  }
}
