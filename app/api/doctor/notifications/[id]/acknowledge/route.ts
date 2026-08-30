import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { AppError } from "@/lib/api/errors";
import { AuthService } from "@/lib/auth/auth-guard";
import { NotificationService } from "@/lib/services/notification.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/doctor/notifications/[id]/acknowledge
 * Doctor acknowledges a notification by route parameter.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const doctor = await AuthService.requireDoctor(req);
    const notificationId = params.id;

    if (!notificationId) {
      throw AppError.badRequest("Notification ID is required");
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
