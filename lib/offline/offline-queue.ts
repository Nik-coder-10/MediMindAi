export interface QueuedAnswer {
  id: string;
  sessionId: string;
  questionId: string;
  answerValue: string;
  timestamp: number;
}

export class OfflineQueueManager {
  private static STORAGE_KEY = "ayursetu_offline_answers_queue";

  static enqueueAnswer(answer: Omit<QueuedAnswer, "id" | "timestamp">) {
    if (typeof window === "undefined") return;

    const currentQueue: QueuedAnswer[] = this.getQueue();
    const item: QueuedAnswer = {
      ...answer,
      id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: Date.now(),
    };

    currentQueue.push(item);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(currentQueue));
  }

  static getQueue(): QueuedAnswer[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  static async syncQueue(onSynced?: (count: number) => void): Promise<number> {
    if (typeof window === "undefined") return 0;
    const queue = this.getQueue();
    if (queue.length === 0) return 0;

    let syncedCount = 0;
    const remaining: QueuedAnswer[] = [];

    for (const item of queue) {
      try {
        const res = await fetch(`/api/patient/answer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: item.sessionId,
            questionId: item.questionId,
            answer: item.answerValue,
          }),
        });

        if (res.ok) {
          syncedCount++;
        } else {
          remaining.push(item);
        }
      } catch {
        remaining.push(item);
      }
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(remaining));
    if (onSynced) onSynced(syncedCount);
    return syncedCount;
  }

  static clearQueue() {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }
}
