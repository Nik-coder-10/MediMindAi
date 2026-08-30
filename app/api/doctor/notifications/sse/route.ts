import { NextRequest } from "next/server";
import { notificationStore } from "@/lib/services/notification.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/doctor/notifications/sse
 * Real-time Server-Sent Events (SSE) stream for instant doctor alert delivery.
 */
export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // 1. Send initial handshake and initial snapshot
      const snapshot = notificationStore.getNotifications();
      const initialPayload = `event: init\ndata: ${JSON.stringify(snapshot)}\n\n`;
      controller.enqueue(encoder.encode(initialPayload));

      // 2. Listen to real-time additions/updates
      const unsubscribe = notificationStore.addListener((notif) => {
        try {
          const payload = `event: notification\ndata: ${JSON.stringify(notif)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch (err) {
          console.warn("SSE stream enqueue error:", err);
        }
      });

      // 3. Heartbeat ping every 15s to keep connection alive through proxies
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch (e) {
          clearInterval(heartbeatInterval);
        }
      }, 15000);

      // 4. Cleanup on stream disconnect
      req.signal.addEventListener("abort", () => {
        unsubscribe();
        clearInterval(heartbeatInterval);
        try {
          controller.close();
        } catch (e) {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
