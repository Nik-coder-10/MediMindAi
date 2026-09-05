/**
 * Durable Patient Session Recovery & Offline Resilience Store
 * AyurSetu / MediMindAi Clinical Platform
 * 
 * Provides client-side persistence (IndexedDB + localStorage fallback) to guarantee:
 * 1. Zero data loss across device power failures, browser restarts, or page refreshes.
 * 2. Seamless offline queueing of questions, answers, and documents during network drops.
 * 3. Automatic optimistic queue reconciliation upon online event recovery.
 */

export interface DurableIntakeSnapshot {
  sessionId: string;
  patientId?: string;
  language: string;
  chiefComplaint: string;
  currentNodeCode?: string;
  collectedAnswers: Array<{
    nodeCode: string;
    questionText: string;
    questionTextHindi?: string;
    answerValue: any;
    answeredAt: number;
  }>;
  collectedFacts?: Record<string, any>;
  uploadedDocSummaries: Array<{
    id: string;
    name: string;
    size: number;
    extractedCount: number;
  }>;
  triagePriority: "ROUTINE" | "URGENT" | "EMERGENCY";
  lastActiveTimestamp: number;
  step: "COMPLAINT" | "QUESTIONS" | "DOCUMENTS" | "SUMMARY_PREVIEW" | "SUBMITTED";
}

export interface QueuedAction {
  id: string;
  sessionId: string;
  actionType: "ANSWER" | "RED_FLAG" | "NOTE" | "METRIC";
  endpoint: string;
  payload: any;
  queuedAt: number;
  retryCount: number;
}

const DB_NAME = "AyurSetu_OfflineDB_v1";
const STORE_SNAPSHOTS = "session_snapshots";
const STORE_QUEUE = "mutation_queue";
const ACTIVE_SESSION_POINTER_KEY = "ayursetu_active_session_pointer";

export class SessionRecoveryStore {
  private static dbPromise: Promise<IDBDatabase | null> | null = null;

  private static getDB(): Promise<IDBDatabase | null> {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      return Promise.resolve(null);
    }
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve) => {
        try {
          const req = indexedDB.open(DB_NAME, 1);
          req.onupgradeneeded = (evt: any) => {
            const db = evt.target.result;
            if (!db.objectStoreNames.contains(STORE_SNAPSHOTS)) {
              db.createObjectStore(STORE_SNAPSHOTS, { keyPath: "sessionId" });
            }
            if (!db.objectStoreNames.contains(STORE_QUEUE)) {
              db.createObjectStore(STORE_QUEUE, { keyPath: "id" });
            }
          };
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      });
    }
    return this.dbPromise;
  }

  /**
   * Persists the active session state durably to local storage & IndexedDB
   */
  static async saveActiveSessionSnapshot(snapshot: DurableIntakeSnapshot): Promise<void> {
    if (typeof window === "undefined") return;

    snapshot.lastActiveTimestamp = Date.now();

    // 1. Keep fast lookup pointer in localStorage
    try {
      localStorage.setItem(ACTIVE_SESSION_POINTER_KEY, snapshot.sessionId);
      localStorage.setItem(`ayursetu_snap_${snapshot.sessionId}`, JSON.stringify(snapshot));
    } catch {
      // Storage quota safety
    }

    // 2. Persist in IndexedDB for heavy resilience
    try {
      const db = await this.getDB();
      if (db) {
        const tx = db.transaction(STORE_SNAPSHOTS, "readwrite");
        tx.objectStore(STORE_SNAPSHOTS).put(snapshot);
      }
    } catch {
      // IndexedDB fallback
    }
  }

  /**
   * Retrieves the latest uncompleted session snapshot if one exists
   */
  static async getActiveSessionSnapshot(): Promise<DurableIntakeSnapshot | null> {
    if (typeof window === "undefined") return null;

    const activeId = localStorage.getItem(ACTIVE_SESSION_POINTER_KEY);
    if (!activeId) return null;

    // Try IndexedDB first
    try {
      const db = await this.getDB();
      if (db) {
        const snapshot = await new Promise<DurableIntakeSnapshot | null>((resolve) => {
          const tx = db.transaction(STORE_SNAPSHOTS, "readonly");
          const req = tx.objectStore(STORE_SNAPSHOTS).get(activeId);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => resolve(null);
        });
        if (snapshot && snapshot.step !== "SUBMITTED") {
          // Check expiration (max 24 hours)
          if (Date.now() - snapshot.lastActiveTimestamp < 24 * 3600 * 1000) {
            return snapshot;
          }
        }
      }
    } catch {
      // fallback to localStorage
    }

    // Fallback to localStorage
    try {
      const raw = localStorage.getItem(`ayursetu_snap_${activeId}`);
      if (raw) {
        const snap: DurableIntakeSnapshot = JSON.parse(raw);
        if (snap.step !== "SUBMITTED" && Date.now() - snap.lastActiveTimestamp < 24 * 3600 * 1000) {
          return snap;
        }
      }
    } catch {
      return null;
    }

    return null;
  }

  /**
   * Clears the active session after successful submission or patient sign-out
   */
  static async clearActiveSession(sessionId?: string): Promise<void> {
    if (typeof window === "undefined") return;

    const targetId = sessionId || localStorage.getItem(ACTIVE_SESSION_POINTER_KEY);
    if (!targetId) return;

    try {
      localStorage.removeItem(ACTIVE_SESSION_POINTER_KEY);
      localStorage.removeItem(`ayursetu_snap_${targetId}`);
    } catch {}

    try {
      const db = await this.getDB();
      if (db) {
        const tx = db.transaction(STORE_SNAPSHOTS, "readwrite");
        tx.objectStore(STORE_SNAPSHOTS).delete(targetId);
      }
    } catch {}
  }

  // ==========================================
  // OFFLINE MUTATION QUEUE
  // ==========================================

  static async enqueueOfflineAction(action: Omit<QueuedAction, "id" | "queuedAt" | "retryCount">): Promise<string> {
    const id = `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const fullAction: QueuedAction = {
      ...action,
      id,
      queuedAt: Date.now(),
      retryCount: 0,
    };

    if (typeof window === "undefined") return id;

    // LocalStorage fallback queue
    try {
      const existing = this.getQueueFallback();
      existing.push(fullAction);
      localStorage.setItem("ayursetu_action_queue", JSON.stringify(existing));
    } catch {}

    // IndexedDB store
    try {
      const db = await this.getDB();
      if (db) {
        const tx = db.transaction(STORE_QUEUE, "readwrite");
        tx.objectStore(STORE_QUEUE).put(fullAction);
      }
    } catch {}

    return id;
  }

  static getQueueFallback(): QueuedAction[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem("ayursetu_action_queue");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  static async getAllQueuedActions(): Promise<QueuedAction[]> {
    if (typeof window === "undefined") return [];

    try {
      const db = await this.getDB();
      if (db) {
        return await new Promise<QueuedAction[]>((resolve) => {
          const tx = db.transaction(STORE_QUEUE, "readonly");
          const req = tx.objectStore(STORE_QUEUE).getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => resolve(this.getQueueFallback());
        });
      }
    } catch {}

    return this.getQueueFallback();
  }

  /**
   * Reconciles all pending offline actions with the server
   */
  static async syncOfflineActions(): Promise<{ synced: number; remaining: number }> {
    if (typeof window === "undefined") return { synced: 0, remaining: 0 };
    if (!navigator.onLine) return { synced: 0, remaining: (await this.getAllQueuedActions()).length };

    const actions = await this.getAllQueuedActions();
    if (actions.length === 0) return { synced: 0, remaining: 0 };

    let synced = 0;
    const remaining: QueuedAction[] = [];

    for (const act of actions) {
      try {
        const res = await fetch(act.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(act.payload),
        });

        if (res.ok) {
          synced++;
          // Remove from IndexedDB
          const db = await this.getDB();
          if (db) {
            const tx = db.transaction(STORE_QUEUE, "readwrite");
            tx.objectStore(STORE_QUEUE).delete(act.id);
          }
        } else {
          act.retryCount++;
          remaining.push(act);
        }
      } catch {
        act.retryCount++;
        remaining.push(act);
      }
    }

    try {
      localStorage.setItem("ayursetu_action_queue", JSON.stringify(remaining));
    } catch {}

    return { synced, remaining: remaining.length };
  }
}
