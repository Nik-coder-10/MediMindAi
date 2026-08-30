import { prisma } from "@/lib/db/prisma";
import { AuditService } from "@/lib/services/audit.service";
import crypto from "crypto";

export type NotificationType = "RED_FLAG" | "NEW_CASE" | "SAFETY_ALERT" | "SYSTEM";
export type NotificationSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type NotificationStatus = "UNREAD" | "READ" | "ACKNOWLEDGED";

export interface ClinicalNotificationItem {
  id: string;
  type: NotificationType;
  severity: NotificationSeverity;
  sessionId?: string;
  patientName: string;
  tokenNumber?: string;
  chiefComplaint?: string;
  title: string;
  message: string;
  status: NotificationStatus;
  createdAt: string;
  acknowledgedAt?: string | null;
  acknowledgedBy?: string | null;
  metadata?: Record<string, any>;
}

export interface CreateNotificationDTO {
  type: NotificationType;
  severity: NotificationSeverity;
  sessionId?: string;
  patientName?: string;
  tokenNumber?: string;
  chiefComplaint?: string;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

// In-memory persistent active store (synchronized across serverless invocations & SSE channels)
class NotificationStore {
  private notifications: ClinicalNotificationItem[] = [
    {
      id: "notif-seed-001",
      type: "RED_FLAG",
      severity: "CRITICAL",
      sessionId: "sess-rf-001",
      patientName: "रवि कुमार (Ravi Kumar)",
      tokenNumber: "#AYUR-9842",
      chiefComplaint: "छाती में तेज दर्द और बाएं हाथ में खिंचाव (Crushing chest pain)",
      title: "🚨 आपातकालीन रेड-फ्लैग: तीव्र कोरोनरी सिंड्रोम (Critical ACS Alert)",
      message: "Patient reports acute crushing chest pain radiating to left arm with diaphoresis (Rule: RF_ACS_RADIATION).",
      status: "UNREAD",
      createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    },
    {
      id: "notif-seed-002",
      type: "SAFETY_ALERT",
      severity: "HIGH",
      sessionId: "sess-safe-002",
      patientName: "सुमन देवी (Suman Devi)",
      tokenNumber: "#AYUR-7731",
      chiefComplaint: "जोड़ों में दर्द (Severe Joint pain)",
      title: "⚠️ गंभीर ड्रग इंटरैक्शन चेतावनी (Drug-Drug Interaction)",
      message: "Major interaction detected: Warfarin (Blood thinner) + Aspirin 150mg prescribed concurrently.",
      status: "UNREAD",
      createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    },
    {
      id: "notif-seed-003",
      type: "NEW_CASE",
      severity: "LOW",
      sessionId: "sess-demo-001",
      patientName: "रमेश शर्मा (Ramesh Sharma)",
      tokenNumber: "#AYUR-104D",
      chiefComplaint: "सिरदर्द व सर्दी जुकाम (Headache & Common Cold)",
      title: "🌿 नया रोगी परामर्श प्रस्तुत (New Case Submitted)",
      message: "Patient completed AYUSH intake and Dashavidha Pariksha. Case is waiting in OPD triage desk.",
      status: "ACKNOWLEDGED",
      createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      acknowledgedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      acknowledgedBy: "Dr. Rajesh Vaidya",
    },
  ];

  // SSE client listeners
  private listeners: Set<(notif: ClinicalNotificationItem) => void> = new Set();

  addListener(listener: (notif: ClinicalNotificationItem) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(notif: ClinicalNotificationItem) {
    this.listeners.forEach((listener) => {
      try {
        listener(notif);
      } catch (err) {
        console.warn("Error notifying SSE client listener:", err);
      }
    });
  }

  getNotifications(): ClinicalNotificationItem[] {
    // Sort: Unacknowledged first, then by severity priority, then newest first
    const severityWeight: Record<NotificationSeverity, number> = {
      CRITICAL: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    };

    return [...this.notifications].sort((a, b) => {
      if (a.status !== "ACKNOWLEDGED" && b.status === "ACKNOWLEDGED") return -1;
      if (a.status === "ACKNOWLEDGED" && b.status !== "ACKNOWLEDGED") return 1;

      const weightDiff = (severityWeight[b.severity] || 0) - (severityWeight[a.severity] || 0);
      if (weightDiff !== 0) return weightDiff;

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  addNotification(dto: CreateNotificationDTO): ClinicalNotificationItem {
    const id = `notif-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
    const item: ClinicalNotificationItem = {
      id,
      type: dto.type,
      severity: dto.severity,
      sessionId: dto.sessionId,
      patientName: dto.patientName || "Patient",
      tokenNumber: dto.tokenNumber || (dto.sessionId ? `#AYUR-${dto.sessionId.replace(/-/g, "").slice(0, 4).toUpperCase()}` : undefined),
      chiefComplaint: dto.chiefComplaint,
      title: dto.title,
      message: dto.message,
      status: "UNREAD",
      createdAt: new Date().toISOString(),
      metadata: dto.metadata,
    };

    // Avoid duplicate notifications for identical session + type + title within short time
    const existingIdx = this.notifications.findIndex(
      (n) => n.sessionId === item.sessionId && n.type === item.type && n.title === item.title
    );

    if (existingIdx >= 0) {
      this.notifications[existingIdx] = item;
    } else {
      this.notifications.unshift(item);
    }

    // Keep memory bounded to latest 100 alerts
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    this.emit(item);
    return item;
  }

  acknowledge(id: string, doctorName: string): ClinicalNotificationItem | null {
    const item = this.notifications.find((n) => n.id === id);
    if (!item) return null;

    item.status = "ACKNOWLEDGED";
    item.acknowledgedAt = new Date().toISOString();
    item.acknowledgedBy = doctorName;

    return item;
  }

  markAllAsRead(): void {
    this.notifications.forEach((n) => {
      if (n.status === "UNREAD") {
        n.status = "READ";
      }
    });
  }
}

export const notificationStore = new NotificationStore();

export class NotificationService {
  /**
   * Dispatch a real-time clinical notification to on-duty doctors & Vaidyas
   */
  static async notify(dto: CreateNotificationDTO): Promise<ClinicalNotificationItem> {
    const item = notificationStore.addNotification(dto);

    // Optional DB Audit Log for Critical & High severity items
    if (dto.severity === "CRITICAL" || dto.severity === "HIGH") {
      try {
        await AuditService.log({
          action: "DOCTOR_NOTIFICATION_DISPATCHED",
          resourceType: "ClinicalSession",
          resourceId: dto.sessionId || "GLOBAL",
          metadata: {
            notificationId: item.id,
            type: item.type,
            severity: item.severity,
            title: item.title,
            patientName: item.patientName,
          },
        });
      } catch (e) {
        // Non-fatal
      }
    }

    return item;
  }

  /**
   * Returns all active notifications and calculated unread/unacknowledged count
   */
  static getDoctorNotifications() {
    const items = notificationStore.getNotifications();
    const unreadCount = items.filter((n) => n.status !== "ACKNOWLEDGED").length;
    const criticalCount = items.filter(
      (n) => n.status !== "ACKNOWLEDGED" && (n.severity === "CRITICAL" || n.severity === "HIGH")
    ).length;

    return {
      unreadCount,
      criticalCount,
      notifications: items,
    };
  }

  /**
   * Doctor acknowledges a clinical alert with audit logging
   */
  static async acknowledgeNotification(
    notificationId: string,
    doctorUser: { id: string; name?: string; email?: string }
  ) {
    const doctorDisplayName =
      doctorUser.name || doctorUser.email || `Dr. (${doctorUser.id.slice(0, 8)})`;

    const item = notificationStore.acknowledge(notificationId, doctorDisplayName);

    if (item && item.sessionId) {
      try {
        await AuditService.log({
          actorId: doctorUser.id,
          action: "DOCTOR_NOTIFICATION_ACKNOWLEDGED",
          resourceType: "ClinicalSession",
          resourceId: item.sessionId,
          metadata: {
            notificationId: item.id,
            notificationType: item.type,
            severity: item.severity,
            doctorName: doctorDisplayName,
            acknowledgedAt: item.acknowledgedAt,
          },
        });
      } catch (e) {
        // Non-fatal
      }
    }

    return item;
  }
}
